import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  noticeId: string;
}

// Function to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64Lines = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const b64 = b64Lines.replace(/\s/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getAccessToken(): Promise<string> {
  try {
    console.log('[FCM] Getting access token...');
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const privateKeyPem = serviceAccount.private_key;
    const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(unsignedToken);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data);
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${unsignedToken}.${encodedSignature}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[FCM] Token error:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('[FCM] Access token obtained successfully');
    return tokenData.access_token;
  } catch (error) {
    console.error('[FCM] Error getting access token:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Notice Notification] Starting to send notice notifications...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('[Notice Notification] Payload:', payload);

    // Get all FCM tokens from the database
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token, user_id');

    if (tokensError) {
      console.error('[Notice Notification] Error fetching tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('[Notice Notification] No FCM tokens found in database');
      return new Response(
        JSON.stringify({ success: false, message: 'No FCM tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[Notice Notification] Found ${tokens.length} FCM tokens`);

    // Get Firebase project ID from service account
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    // Get FCM access token
    const accessToken = await getAccessToken();

    // Send notification to each token
    const sendResults = [];
    const unregisteredTokens: string[] = [];

    for (const tokenData of tokens) {
      try {
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        const message = {
          message: {
            token: tokenData.token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              type: 'notice',
              notice_id: payload.noticeId,
            },
            webpush: {
              fcm_options: {
                link: '/',
              },
            },
          },
        };

        console.log(`[Notice Notification] Sending to token: ${tokenData.token.substring(0, 20)}...`);

        const response = await fetch(fcmEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[Notice Notification] Sent successfully to user ${tokenData.user_id}`);
          sendResults.push({ user_id: tokenData.user_id, success: true });
        } else {
          const errorText = await response.text();
          console.error(`[Notice Notification] Failed for user ${tokenData.user_id}:`, errorText);
          
          // Check if token is unregistered
          if (errorText.includes('UNREGISTERED') || errorText.includes('NOT_FOUND')) {
            console.log(`[Notice Notification] Token unregistered, will delete: ${tokenData.token.substring(0, 20)}...`);
            unregisteredTokens.push(tokenData.token);
          }
          
          sendResults.push({ user_id: tokenData.user_id, success: false, error: errorText });
        }
      } catch (error) {
        console.error(`[Notice Notification] Error sending to user ${tokenData.user_id}:`, error);
        sendResults.push({ user_id: tokenData.user_id, success: false, error: String(error) });
      }
    }

    // Clean up unregistered tokens
    if (unregisteredTokens.length > 0) {
      console.log(`[Notice Notification] Deleting ${unregisteredTokens.length} unregistered tokens...`);
      const { error: deleteError } = await supabase
        .from('fcm_tokens')
        .delete()
        .in('token', unregisteredTokens);
      
      if (deleteError) {
        console.error('[Notice Notification] Error deleting unregistered tokens:', deleteError);
      } else {
        console.log('[Notice Notification] Unregistered tokens deleted successfully');
      }
    }

    const successCount = sendResults.filter(r => r.success).length;
    console.log(`[Notice Notification] Sent to ${successCount}/${tokens.length} users successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount}/${tokens.length} users`,
        results: sendResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[Notice Notification] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
