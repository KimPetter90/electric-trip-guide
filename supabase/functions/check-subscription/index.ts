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

    // Get current route count and trial info from user_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('monthly_route_count, last_route_reset_date, subscription_status, plan_type, trial_start_date, trial_end_date, is_trial_active')
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
        let lastResetMonth = 0; // Default til januar hvis parsing feiler
        
        try {
          if (lastReset && lastReset.trim() !== '' && lastReset !== 'null' && lastReset !== 'undefined') {
            const parsedDate = new Date(lastReset);
            if (!isNaN(parsedDate.getTime())) {
              lastResetMonth = parsedDate.getMonth();
            }
          }
        } catch (error) {
          logStep("Error parsing last_route_reset_date, using default", { error: error.message, lastReset });
        }
        
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
      
      logStep("User settings from database", { 
        subscription_status: settings.subscription_status, 
        plan_type: settings.plan_type,
        is_trial_active: settings.is_trial_active,
        trial_end_date: settings.trial_end_date
      });
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
      
      // Check trial for users without Stripe customer
      let isTrialActive = false;
      let trialEndDate = null;
      let daysLeftInTrial = 0;

      if (settings?.trial_end_date && settings?.is_trial_active) {
        try {
          // Sjekk at trial_end_date ikke er null eller ugyldig
          if (settings.trial_end_date && 
              settings.trial_end_date !== 'null' && 
              settings.trial_end_date !== 'undefined' && 
              typeof settings.trial_end_date === 'string' && 
              settings.trial_end_date.trim() !== '') {
            
            // Bruk Date constructor direkte på ISO string
            const endDate = new Date(settings.trial_end_date);
            const now = new Date();
            
            // Valider at endDate er gyldig
            if (!isNaN(endDate.getTime()) && endDate.getTime() > 0) {
              isTrialActive = endDate > now;
              
              if (isTrialActive) {
                trialEndDate = settings.trial_end_date;
                daysLeftInTrial = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
                routeLimit = -1; // Unlimited during trial
                // Set subscription status to premium during trial
                subscriptionStatus = 'premium';
              }
            } else {
              logStep("Invalid trial_end_date timestamp, treating as no trial", { trial_end_date: settings.trial_end_date });
            }
          } else {
            logStep("trial_end_date is null or invalid, treating as no trial", { trial_end_date: settings.trial_end_date });
          }
        } catch (error) {
          logStep("Error parsing trial_end_date, treating as no trial", { error: error.message, trial_end_date: settings.trial_end_date });
        }
      }

      return new Response(JSON.stringify({ 
        subscribed: isTrialActive, // Set subscribed to true during trial
        subscription_status: subscriptionStatus,
        product_id: null,
        subscription_end: null,
        route_count: routeCount,
        route_limit: routeLimit,
        is_trial_active: isTrialActive,
        trial_end_date: trialEndDate,
        days_left_in_trial: daysLeftInTrial
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
      try {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (error) {
        logStep("Error creating subscription end date", { error: error.message, timestamp: subscription.current_period_end });
        subscriptionEnd = null;
      }
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      const priceId = subscription.items.data[0].price.id;
      
      // CRITICAL DEBUG: Log everything about the subscription to find the mapping issue
      logStep("🔍 FULL STRIPE SUBSCRIPTION DEBUG", {
        subscriptionId: subscription.id,
        priceId: priceId,
        productId: productId,
        fullPrice: subscription.items.data[0].price,
        subscriptionItems: subscription.items.data,
        status: subscription.status
      });
      
      // Map price IDs and amounts to subscription tiers
      const priceAmount = subscription.items.data[0].price.unit_amount;
      const productName = subscription.items.data[0].price.nickname || 
                         subscription.items.data[0].price.product?.name || '';
      
      logStep("Subscription details", { priceId, priceAmount, productName });
      
      // Exact price ID mapping first (most reliable)
      if (priceId === 'price_1S9JN2DgjF2NREPhiV6kkPrP') {
        // Current Pro plan
        newSubscriptionStatus = 'pro';
        newPlanType = 'pro';
        routeLimit = -1;
        logStep("Exact PRO price ID match", { priceId });
      } else if (priceId === 'price_1S9JMqDgjF2NREPhOy9s16kw') {
        // Current Premium plan
        newSubscriptionStatus = 'premium';
        newPlanType = 'premium';
        routeLimit = 100;
        logStep("Exact PREMIUM price ID match", { priceId });
      }
      // Fallback to price amount or product name
      else if (priceAmount >= 3900 || productName.toLowerCase().includes('pro') || priceId.includes('JN2')) {
        newSubscriptionStatus = 'pro';
        newPlanType = 'pro';
        routeLimit = -1; // Unlimited
        logStep("Mapped to PRO tier via fallback", { priceAmount, productName, priceId });
      } 
      // Premium tier: 1900-3899 (19-38.99 NOK)
      else if (priceAmount >= 1900 || productName.toLowerCase().includes('premium') || priceId.includes('JMq')) {
        newSubscriptionStatus = 'premium';
        newPlanType = 'premium';
        routeLimit = 100;
        logStep("Mapped to PREMIUM tier via fallback", { priceAmount, productName, priceId });
      } else {
        // Legacy price ID mappings for existing customers
        if (priceId === 'price_1S80tCDgjF2NREPhFod9JnwM') {
          newSubscriptionStatus = 'premium';
          newPlanType = 'premium';
          routeLimit = 100;
          logStep("Legacy PREMIUM mapping", { priceId });
        } else if (priceId === 'price_1S80tNDgjF2NREPhc16tZZVw') {
          newSubscriptionStatus = 'pro';
          newPlanType = 'pro';
          routeLimit = -1;
          logStep("Legacy PRO mapping", { priceId });
        } else {
          // Default fallback - check price amount again
          logStep("No tier match found, using price amount fallback", { priceAmount, priceId, productName });
          if (priceAmount && priceAmount >= 3900) {
            newSubscriptionStatus = 'pro';
            newPlanType = 'pro';
            routeLimit = -1;
          } else {
            newSubscriptionStatus = 'premium';
            newPlanType = 'premium';
            routeLimit = 100;
          }
        }
      }
      
      logStep("Determined subscription tier", { productId, priceId, priceAmount, newSubscriptionStatus, routeLimit });
      
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

    // Check trial status
    let isTrialActive = false;
    let trialEndDate = null;
    let daysLeftInTrial = 0;

    if (settings?.trial_end_date && settings?.is_trial_active) {
      try {
        // Sjekk at trial_end_date ikke er null eller ugyldig
        if (settings.trial_end_date && 
            settings.trial_end_date !== 'null' && 
            settings.trial_end_date !== 'undefined' && 
            typeof settings.trial_end_date === 'string' && 
            settings.trial_end_date.trim() !== '') {
          
          // Bruk Date constructor direkte på ISO string
          const endDate = new Date(settings.trial_end_date);
          const now = new Date();
          
          // Valider at endDate er gyldig
          if (!isNaN(endDate.getTime()) && endDate.getTime() > 0) {
            isTrialActive = endDate > now;
            
            if (isTrialActive) {
              trialEndDate = settings.trial_end_date;
              daysLeftInTrial = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
            } else {
              // Mark trial as inactive if expired
              await supabaseClient
                .from('user_settings')
                .update({ is_trial_active: false })
                .eq('user_id', user.id);
            }
          } else {
            logStep("Invalid trial_end_date timestamp in final check, treating as no trial", { trial_end_date: settings.trial_end_date });
            // Mark trial as inactive if invalid
            await supabaseClient
              .from('user_settings')
              .update({ is_trial_active: false })
              .eq('user_id', user.id);
          }
        } else {
          logStep("trial_end_date is null or invalid in final check, marking trial as inactive", { trial_end_date: settings.trial_end_date });
          // Mark trial as inactive if null/invalid
          await supabaseClient
            .from('user_settings')
            .update({ is_trial_active: false })
            .eq('user_id', user.id);
        }
      } catch (error) {
        logStep("Error parsing trial_end_date in final check", { error: error.message, trial_end_date: settings.trial_end_date });
        // Mark trial as inactive if there's a parsing error
        await supabaseClient
          .from('user_settings')
          .update({ is_trial_active: false })
          .eq('user_id', user.id);
      }
    }

    // For paying customers, check if they also have an active trial running
    // This allows users with subscriptions to still have trial access if they activated it
    if (hasActiveSub && !isTrialActive) {
      // Only disable trial if no trial is currently active
      isTrialActive = false;
      trialEndDate = null;
      daysLeftInTrial = 0;
    }
    // Adjust route limits for trial users or subscription users
    else if (isTrialActive || hasActiveSub) {
      routeLimit = -1; // Unlimited routes during trial or subscription
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_status: newSubscriptionStatus,
      product_id: productId,
      subscription_end: subscriptionEnd,
      route_count: routeCount,
      route_limit: routeLimit,
      is_trial_active: isTrialActive,
      trial_end_date: trialEndDate,
      days_left_in_trial: daysLeftInTrial
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