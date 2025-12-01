import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to get OAuth2 access token from service account
async function getAccessToken() {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured')
  }

  const serviceAccount = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const jwt = `${signatureInput}.${encodedSignature}`
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }
  
  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { receiver_id, sender_id, content } = body.record || body

    console.log('Processing message notification:', { receiver_id, sender_id })

    // Get sender name
    const { data: sender, error: senderError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', sender_id)
      .single()

    if (senderError || !sender) {
      console.error('Sender not found:', senderError)
      throw new Error('Sender not found')
    }

    // Resolve receiver's auth user_id from profiles.id then get FCM tokens
    const { data: receiverProfile, error: receiverErr } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', receiver_id)
      .single()

    if (receiverErr || !receiverProfile?.user_id) {
      console.error('Receiver profile not found:', receiverErr)
      throw new Error('Receiver profile not found or missing user_id')
    }

    console.log('Looking up FCM tokens for user_id:', receiverProfile.user_id)

    const { data: tokens, error: tokenError } = await supabaseClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', receiverProfile.user_id)

    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError)
      throw tokenError
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user:', receiverProfile.user_id)
      return new Response(
        JSON.stringify({ message: 'No FCM tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${tokens.length} FCM tokens`)

    // Get access token for FCM v1 API
    const accessToken = await getAccessToken()
    
    // Get project ID from service account
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    const projectId = serviceAccount.project_id

    // Send notification to each token using FCM v1 API
    const notifications = tokens.map(async ({ token }) => {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: token,
              notification: {
                title: 'নতুন মেসেজ',
                body: `${sender.full_name}: ${content}`,
              },
              data: {
                type: 'message',
                sender_id,
                sender_name: sender.full_name,
                content,
                click_action: '/messages',
              },
              webpush: {
                fcm_options: {
                  link: '/messages'
                },
                notification: {
                  icon: '/pwa/manifest-icon-192.png',
                  badge: '/pwa/manifest-icon-192.png',
                }
              }
            }
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorJson: any = null
        try {
          errorJson = JSON.parse(errorText)
        } catch (_) {
          // ignore JSON parse error
        }

        const isUnregistered =
          response.status === 404 &&
          !!(errorJson?.error?.details || []).find((d: any) => d?.errorCode === 'UNREGISTERED')

        if (isUnregistered) {
          console.warn('Pruning UNREGISTERED FCM token:', token)
          // Use service role client to delete invalid token
          const supabaseService = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )
          const { error: delErr } = await supabaseService
            .from('fcm_tokens')
            .delete()
            .eq('user_id', receiverProfile.user_id)
            .eq('token', token)
          if (delErr) {
            console.error('Failed to delete invalid FCM token:', delErr)
          }
        } else {
          console.error('FCM API error:', response.status, errorText)
        }

        return { error: errorText, status: response.status }
      }

      return response.json()
    })

    const results = await Promise.all(notifications)
    console.log('Notification results:', results)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        sent_to: tokens.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})