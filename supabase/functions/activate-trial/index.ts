import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-TRIAL] ${step}${detailsStr}`);
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
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body to get trial type
    const { planType = 'premium' } = await req.json();
    logStep("Trial activation requested", { planType });

    // Calculate trial end date (30 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    logStep("Trial end date calculated", { trialEndDate: trialEndDate.toISOString() });

    // Check if user already has settings
    const { data: existingSettings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabaseClient
        .from('user_settings')
        .update({
          is_trial_active: true,
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          subscription_status: planType,
          plan_type: planType,
          monthly_route_count: 0
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating user settings", { error: updateError.message });
        throw updateError;
      }
      
      logStep("Trial activated for existing user", { planType, trialEndDate: trialEndDate.toISOString() });
    } else {
      // Create new settings with trial
      const { error: insertError } = await supabaseClient
        .from('user_settings')
        .insert({
          user_id: user.id,
          is_trial_active: true,
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          subscription_status: planType,
          plan_type: planType,
          monthly_route_count: 0
        });

      if (insertError) {
        logStep("Error creating user settings", { error: insertError.message });
        throw insertError;
      }
      
      logStep("Trial activated for new user", { planType, trialEndDate: trialEndDate.toISOString() });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${planType.charAt(0).toUpperCase() + planType.slice(1)} trial aktivert!`,
      trial_end_date: trialEndDate.toISOString(),
      plan_type: planType
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in activate-trial", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});