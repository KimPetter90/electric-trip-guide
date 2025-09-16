import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking user settings");
      
      // Update user settings to free status
      await supabaseClient
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          subscription_status: 'free',
          stripe_customer_id: null,
          subscription_product_id: null,
          subscription_end_date: null
        });

      // Check if user is test user even without Stripe customer
      const { data: userSettings } = await supabaseClient
        .from('user_settings')
        .select('monthly_route_count, is_test_user')
        .eq('user_id', user.id)
        .single();

      const isTestUser = userSettings?.is_test_user || false;
      const routeCount = userSettings?.monthly_route_count || 0;

      return new Response(JSON.stringify({ 
        subscribed: isTestUser,
        subscription_status: isTestUser ? 'premium' : 'free',
        route_count: routeCount,
        route_limit: isTestUser ? 100 : 5
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
    let subscriptionStatus = 'free';
    let routeLimit = 5;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      
      // Determine subscription status based on product
      if (productId === 'prod_T49B16Wt7QC3TT') {
        subscriptionStatus = 'premium';
        routeLimit = 100;
      } else if (productId === 'prod_T49BS2W6ASZzBO') {
        subscriptionStatus = 'pro';
        routeLimit = -1; // Unlimited
      }
      
      logStep("Determined subscription tier", { productId, subscriptionStatus, routeLimit });
    } else {
      logStep("No active subscription found");
    }

    // Get current route count and test user status from user settings
    const { data: userSettings } = await supabaseClient
      .from('user_settings')
      .select('monthly_route_count, is_test_user')
      .eq('user_id', user.id)
      .single();

    const routeCount = userSettings?.monthly_route_count || 0;
    
    // Override subscription status for test users
    let finalSubscriptionStatus = subscriptionStatus;
    let finalSubscribed = hasActiveSub;
    let finalRouteLimit = routeLimit;
    
    if (userSettings?.is_test_user) {
      finalSubscriptionStatus = 'premium';
      finalSubscribed = true;
      finalRouteLimit = 100;
      logStep("User is test user with premium access");
    }

    // Update user settings with subscription info
    await supabaseClient
      .from('user_settings')
      .upsert({ 
        user_id: user.id,
        stripe_customer_id: customerId,
        subscription_status: finalSubscriptionStatus,
        subscription_product_id: productId,
        subscription_end_date: subscriptionEnd
      });

    return new Response(JSON.stringify({
      subscribed: finalSubscribed,
      subscription_status: finalSubscriptionStatus,
      product_id: productId,
      subscription_end: subscriptionEnd,
      route_count: routeCount,
      route_limit: finalRouteLimit
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