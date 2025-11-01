import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { user_id, title, body, data }: NotificationPayload = await req.json()

    console.log('Processing notification for user_id:', user_id)

    // Resolve auth user_id if a profile id was provided
    let targetUserId = user_id
    let tokens: { token: string }[] | null = null

    // Try direct lookup first (assumes auth.user id)
    let { data: directTokens, error: directErr } = await supabaseClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', targetUserId)

    if (directErr) {
      console.error('Error fetching tokens directly:', directErr)
      throw directErr
    }

    tokens = directTokens

    // If none found, treat provided id as profile.id and resolve to auth uid
    if (!tokens || tokens.length === 0) {
      console.log('No tokens found directly, trying profile lookup')
      const { data: profile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('id', targetUserId)
        .maybeSingle()

      if (profileErr) {
        console.log('Profile lookup failed:', profileErr?.message)
      } else if (profile?.user_id) {
        targetUserId = profile.user_id
        const { data: fallbackTokens, error: tokenError } = await supabaseClient
          .from('fcm_tokens')
          .select('token')
          .eq('user_id', targetUserId)
        if (tokenError) {
          console.error('Error fetching fallback tokens:', tokenError)
          throw tokenError
        }
        tokens = fallbackTokens
      }
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user')
      return new Response(
        JSON.stringify({ error: 'No FCM tokens found for user' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
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
                title,
                body,
              },
              data: {
                ...data,
                click_action: '/',
              },
              webpush: {
                fcm_options: {
                  link: '/'
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
          const { error: delErr } = await supabaseClient
            .from('fcm_tokens')
            .delete()
            .eq('user_id', targetUserId)
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