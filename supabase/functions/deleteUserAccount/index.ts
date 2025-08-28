import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  // For dev: allow any origin. In prod, set to your domain: 'https://smartbites.food'
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // 1) CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2) Verify JWT & get user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized or no user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3) Use ADMIN client to delete user data and account
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Deleting account for user: ${user.id}`);

    // Delete user data from all tables in the correct order
    // Delete user dietary preferences
    const { error: dietaryError } = await admin
      .from('user_dietary_prefs')
      .delete()
      .eq('user_id', user.id);

    if (dietaryError) {
      console.error('Error deleting user dietary preferences:', dietaryError);
    }

    // Delete user allergens
    const { error: allergensError } = await admin
      .from('user_allergens')
      .delete()
      .eq('user_id', user.id);

    if (allergensError) {
      console.error('Error deleting user allergens:', allergensError);
    }

    // Delete user recipes
    const { error: recipesError } = await admin
      .from('user_recipes')
      .delete()
      .eq('user_id', user.id);

    if (recipesError) {
      console.error('Error deleting user recipes:', recipesError);
    }

    // Delete user profile
    const { error: profileError } = await admin
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }

    // Finally, delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);

    if (delErr) {
      console.error('Error deleting auth user:', delErr);
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('deleteUserAccount error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});