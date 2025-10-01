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

    // Resolve auth user_id if a profile id was provided
    let targetUserId = user_id
    let tokens: { token: string }[] | null = null

    // Try direct lookup first (assumes auth.user id)
    let { data: directTokens, error: directErr } = await supabaseClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', targetUserId)

    if (directErr) {
      throw directErr
    }

    tokens = directTokens

    // If none found, treat provided id as profile.id and resolve to auth uid
    if (!tokens || tokens.length === 0) {
      const { data: profile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('id', targetUserId)
        .single()

      if (profileErr) {
        // proceed; will return 404 below
        console.log('Profile lookup failed or not found:', profileErr?.message)
      } else if (profile?.user_id) {
        targetUserId = profile.user_id
        const { data: fallbackTokens, error: tokenError } = await supabaseClient
          .from('fcm_tokens')
          .select('token')
          .eq('user_id', targetUserId)
        if (tokenError) throw tokenError
        tokens = fallbackTokens
      }
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No FCM tokens found for user' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Firebase server key from environment variables
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
            title,
            body,
            icon: '/pwa/manifest-icon-192.png',
            badge: '/pwa/manifest-icon-192.png',
          },
          data: {
            ...data,
            click_action: '/',
          },
          webpush: {
            fcm_options: {
              link: '/'
            }
          }
        }),
      })

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})