import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Reset routes function called');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;
    console.log(`👤 User authenticated: ${userId}`);

    // Reset the route count for the user
    const { data, error } = await supabase.rpc('reset_route_count', {
      user_uuid: userId
    });

    if (error) {
      console.error('❌ Error resetting route count:', error);
      throw new Error(`Failed to reset route count: ${error.message}`);
    }

    if (!data) {
      console.error('❌ User not found in database');
      throw new Error('User settings not found');
    }

    console.log('✅ Route count reset successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Route count reset successfully! You now have fresh monthly routes available.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in reset-routes function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});