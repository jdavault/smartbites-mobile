// supabase/functions/deleteUserAccount/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-api-version, accept, accept-language, cache-control, pragma',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('BASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a client to verify the user's token
    const supabaseClient = createClient(
      Deno.env.get('BASE_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user from the token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const userId = user.id;

    console.log(`Attempting to delete account for user: ${userId}`);

    // Delete user data from your custom tables first
    // Adjust these table names to match your schema
    const tablesToCleanup = [
      'user_profiles',
      'user_allergens',
      'user_dietary_preferences',
      // Add any other tables that reference the user
    ];

    for (const table of tablesToCleanup) {
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error(`Error deleting from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      } else {
        console.log(`Successfully deleted user data from ${table}`);
      }
    }

    // Finally, delete the user from auth.users
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    console.log(`Successfully deleted user account: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in deleteUserAccount function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
