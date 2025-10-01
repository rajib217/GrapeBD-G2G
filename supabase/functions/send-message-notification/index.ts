import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { record } = await req.json()
    const { receiver_id, sender_id, content } = record

    // Get sender name
    const { data: sender } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', sender_id)
      .single()

    if (!sender) {
      throw new Error('Sender not found')
    }

    // Resolve receiver's auth user_id from profiles.id then get FCM tokens
    const { data: receiverProfile, error: receiverErr } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', receiver_id)
      .single()

    if (receiverErr || !receiverProfile?.user_id) {
      throw new Error('Receiver profile not found or missing user_id')
    }

    const { data: tokens, error: tokenError } = await supabaseClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', receiverProfile.user_id)

    if (tokenError) {
      throw tokenError
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user:', receiverProfile.user_id)
      return new Response(
        JSON.stringify({ message: 'No FCM tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Firebase server key
    const serverKey = Deno.env.get('FIREBASE_SERVER_KEY')
    if (!serverKey) {
      throw new Error('Firebase server key not configured')
    }

    // Send notification to each token
    const notifications = tokens.map(async ({ token }) => {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: 'নতুন মেসেজ',
            body: `${sender.full_name}: ${content}`,
            icon: '/pwa/manifest-icon-192.png',
            badge: '/pwa/manifest-icon-192.png',
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
            }
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('FCM API error:', response.status, errorText)
        return { error: errorText, status: response.status }
      }

      return response.json()
    })

    const results = await Promise.all(notifications)
    
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})