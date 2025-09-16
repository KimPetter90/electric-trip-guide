import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-TEST-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const currentUser = userData.user;
    if (!currentUser?.email) throw new Error("User not authenticated");
    
    logStep("Current user authenticated", { email: currentUser.email });

    // Parse request body
    const { email } = await req.json();
    if (!email) throw new Error("Email is required");
    
    logStep("Target email provided", { targetEmail: email });

    // Check if current user is admin (you can modify this check as needed)
    // For now, let's allow anyone to upgrade test users
    // In production, you might want to add admin role checking here

    // Call the database function to upgrade the user
    const { data, error } = await supabaseClient.rpc('upgrade_to_test_user', {
      target_email: email
    });

    if (error) {
      logStep("Error calling upgrade function", { error: error.message });
      throw error;
    }

    if (!data) {
      logStep("User not found", { email });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Bruker ikke funnet" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("User upgraded successfully", { email });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Bruker ${email} er nå oppgradert til testbruker med premium-tilgang` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in upgrade-test-user", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});