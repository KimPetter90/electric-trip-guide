import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get current route count from user_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('monthly_route_count, last_route_reset_date, subscription_status, plan_type')
      .eq('user_id', user.id)
      .maybeSingle();

    let routeCount = 0;
    let subscriptionStatus = 'free';
    let planType = 'free';

    if (settings) {
      // Check if we need to reset monthly count
      const today = new Date().toISOString().split('T')[0];
      const lastReset = settings.last_route_reset_date;
      
      if (lastReset !== today) {
        const currentMonth = new Date().getMonth();
        const lastResetMonth = new Date(lastReset || '2000-01-01').getMonth();
        
        if (currentMonth !== lastResetMonth) {
          // Reset monthly count
          await supabaseClient
            .from('user_settings')
            .update({ 
              monthly_route_count: 0, 
              last_route_reset_date: today 
            })
            .eq('user_id', user.id);
          routeCount = 0;
        } else {
          routeCount = settings.monthly_route_count || 0;
        }
      } else {
        routeCount = settings.monthly_route_count || 0;
      }
      
      subscriptionStatus = settings.subscription_status || 'free';
      planType = settings.plan_type || 'free';
    } else {
      // Create user settings if they don't exist
      await supabaseClient
        .from('user_settings')
        .insert({
          user_id: user.id,
          monthly_route_count: 0,
          last_route_reset_date: new Date().toISOString().split('T')[0],
          subscription_status: 'free',
          plan_type: 'free'
        });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free subscription");
      
      // Set route limits based on plan
      let routeLimit = 25; // Free plan
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_status: subscriptionStatus,
        product_id: null,
        subscription_end: null,
        route_count: routeCount,
        route_limit: routeLimit
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let newSubscriptionStatus = 'free';
    let newPlanType = 'free';
    let routeLimit = 25; // Default free plan

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      const priceId = subscription.items.data[0].price.id;
      
      // Map price IDs to subscription tiers
      if (priceId === 'price_1S80tCDgjF2NREPhFod9JnwM') {
        newSubscriptionStatus = 'premium';
        newPlanType = 'premium';
        routeLimit = 100;
      } else if (priceId === 'price_1S80tNDgjF2NREPhc16tZZVw') {
        newSubscriptionStatus = 'pro';
        newPlanType = 'pro';
        routeLimit = -1; // Unlimited
      }
      
      logStep("Determined subscription tier", { productId, priceId, newSubscriptionStatus, routeLimit });
      
      // Update user settings with subscription info
      await supabaseClient
        .from('user_settings')
        .update({
          subscription_status: newSubscriptionStatus,
          plan_type: newPlanType,
          subscription_end_date: subscriptionEnd
        })
        .eq('user_id', user.id);
    } else {
      logStep("No active subscription found");
      
      // Update user settings to free if no active subscription
      await supabaseClient
        .from('user_settings')
        .update({
          subscription_status: 'free',
          plan_type: 'free',
          subscription_end_date: null
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_status: newSubscriptionStatus,
      product_id: productId,
      subscription_end: subscriptionEnd,
      route_count: routeCount,
      route_limit: routeLimit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});