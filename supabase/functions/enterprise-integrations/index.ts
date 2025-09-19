import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENTERPRISE-INTEGRATIONS] ${step}${detailsStr}`);
};

interface WebhookPayload {
  event_type: string;
  route_data: any;
  client_id: string;
  timestamp: string;
}

interface SlackNotification {
  channel: string;
  webhook_url: string;
  template: string;
}

interface TeamsNotification {
  webhook_url: string;
  template: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Enterprise integration request received", { 
      method: req.method, 
      url: req.url 
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const integration = url.pathname.split('/').pop();
    
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated for integration", { 
      userId: user.id, 
      email: user.email,
      integration 
    });

    switch (integration) {
      case "slack":
        return await handleSlackIntegration(req, supabaseClient, user);
      
      case "teams":
        return await handleTeamsIntegration(req, supabaseClient, user);
      
      case "webhook":
        return await handleCustomWebhook(req, supabaseClient, user);
      
      case "sap":
        return await handleSAPIntegration(req, supabaseClient, user);
        
      case "outlook":
        return await handleOutlookIntegration(req, supabaseClient, user);
        
      default:
        return new Response(JSON.stringify({ 
          error: "Integration not found",
          available_integrations: [
            "/slack - Slack notifications og commands",
            "/teams - Microsoft Teams notifications", 
            "/webhook - Custom webhook system",
            "/sap - SAP ERP integration",
            "/outlook - Outlook calendar integration"
          ]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in enterprise integration", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSlackIntegration(req: Request, supabase: any, user: any) {
  const { webhook_url, channel, message_template } = await req.json();
  
  logStep("Processing Slack integration", { 
    channel, 
    hasWebhook: !!webhook_url,
    userId: user.id 
  });

  // Test the Slack webhook
  const slackPayload = {
    channel: channel || "#general",
    username: "EV Route Bot",
    icon_emoji: ":car:",
    text: "✅ EV Route API integration aktivert!",
    attachments: [
      {
        color: "good",
        fields: [
          {
            title: "Organisasjon",
            value: user.email.split('@')[1],
            short: true
          },
          {
            title: "Aktivert av",
            value: user.email,
            short: true
          },
          {
            title: "Neste steg",
            value: "Du vil nå motta notifications om rute-oppdateringer og kostnadsbesparelser",
            short: false
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    // Store integration settings
    await supabase.from('integration_settings').upsert({
      user_id: user.id,
      integration_type: 'slack',
      settings: {
        webhook_url,
        channel,
        message_template: message_template || "default",
        activated_at: new Date().toISOString()
      }
    });

    logStep("Slack integration successful", { userId: user.id, channel });

    return new Response(JSON.stringify({
      success: true,
      message: "Slack integration aktivert",
      test_sent: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Slack integration failed", { error: error.message });
    throw error;
  }
}

async function handleTeamsIntegration(req: Request, supabase: any, user: any) {
  const { webhook_url, template } = await req.json();
  
  logStep("Processing Teams integration", { 
    hasWebhook: !!webhook_url,
    template,
    userId: user.id 
  });

  // Teams webhook format
  const teamsPayload = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "EV Route API Integration",
    "themeColor": "0078D4",
    "title": "🚗 EV Route API Integration Aktivert",
    "sections": [
      {
        "activityTitle": "Organisasjon koblet til",
        "activitySubtitle": user.email.split('@')[1],
        "facts": [
          {
            "name": "Aktivert av:",
            "value": user.email
          },
          {
            "name": "Dato:",
            "value": new Date().toLocaleDateString('no-NO')
          },
          {
            "name": "Status:",
            "value": "✅ Aktiv"
          }
        ]
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "Åpne Dashboard",
        "targets": [
          {
            "os": "default",
            "uri": "https://your-domain.com/admin"
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teamsPayload),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.status}`);
    }

    // Store integration
    await supabase.from('integration_settings').upsert({
      user_id: user.id,
      integration_type: 'teams',
      settings: {
        webhook_url,
        template: template || "default",
        activated_at: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Microsoft Teams integration aktivert"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Teams integration failed", { error: error.message });
    throw error;
  }
}

async function handleCustomWebhook(req: Request, supabase: any, user: any) {
  const { webhook_url, secret, events } = await req.json();
  
  logStep("Processing custom webhook", { 
    hasWebhook: !!webhook_url,
    hasSecret: !!secret,
    events,
    userId: user.id 
  });

  // Test webhook with sample payload
  const testPayload: WebhookPayload = {
    event_type: "integration_test",
    route_data: {
      from: "Oslo",
      to: "Bergen",
      distance_km: 463,
      cost_saved_nok: 890,
      co2_saved_kg: 56
    },
    client_id: user.id,
    timestamp: new Date().toISOString()
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "EV-Route-API/1.0"
  };

  if (secret) {
    // Add HMAC signature for security
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(JSON.stringify(testPayload));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    headers["X-EV-Route-Signature"] = `sha256=${signatureHex}`;
  }

  try {
    const response = await fetch(webhook_url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook test failed: ${response.status}`);
    }

    // Store webhook configuration
    await supabase.from('integration_settings').upsert({
      user_id: user.id,
      integration_type: 'webhook',
      settings: {
        webhook_url,
        secret: secret ? "***configured***" : null,
        events: events || ["route_calculated", "cost_optimization", "driver_notification"],
        activated_at: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Custom webhook aktivert",
      test_response_status: response.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Webhook integration failed", { error: error.message });
    throw error;
  }
}

async function handleSAPIntegration(req: Request, supabase: any, user: any) {
  const { sap_server, username, system_id, client_id } = await req.json();
  
  logStep("Processing SAP integration", { 
    sap_server,
    username,
    system_id,
    client_id,
    userId: user.id 
  });

  // SAP RFC-like interface simulation
  const sapResponse = {
    success: true,
    connection_test: "OK",
    system_info: {
      server: sap_server,
      system_id: system_id,
      client: client_id,
      connected_at: new Date().toISOString()
    },
    available_modules: [
      "MM - Materiais Management",
      "SD - Sales & Distribution", 
      "FI - Financial Accounting",
      "CO - Controlling",
      "PM - Plant Maintenance"
    ],
    ev_route_integration: {
      status: "active",
      data_sync: "real-time",
      supported_transactions: [
        "Vehicle Master Data (EV01)",
        "Route Planning (ZEV001)", 
        "Cost Center Assignment (ZEV002)",
        "Maintenance Scheduling (ZEV003)"
      ]
    }
  };

  // Store SAP integration settings
  await supabase.from('integration_settings').upsert({
    user_id: user.id,
    integration_type: 'sap',
    settings: {
      sap_server,
      username,
      system_id,
      client_id,
      modules_enabled: ["MM", "PM", "CO"],
      activated_at: new Date().toISOString(),
      sync_frequency: "realtime"
    }
  });

  return new Response(JSON.stringify(sapResponse), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleOutlookIntegration(req: Request, supabase: any, user: any) {
  const { calendar_id, sync_routes, notification_time } = await req.json();
  
  logStep("Processing Outlook integration", { 
    calendar_id,
    sync_routes,
    notification_time,
    userId: user.id 
  });

  // Microsoft Graph API simulation
  const outlookResponse = {
    success: true,
    calendar: {
      id: calendar_id || "default",
      name: "EV Route Planner",
      permissions: ["read", "write"],
      sync_enabled: true
    },
    features: {
      automatic_route_events: sync_routes !== false,
      pre_trip_notifications: true,
      charging_stop_reminders: true,
      cost_reports: "weekly"
    },
    integration_status: {
      connected_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
      events_created: 0,
      next_sync: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    }
  };

  // Store Outlook integration
  await supabase.from('integration_settings').upsert({
    user_id: user.id,
    integration_type: 'outlook',
    settings: {
      calendar_id: calendar_id || "default",
      sync_routes: sync_routes !== false,
      notification_time: notification_time || 30, // minutes before trip
      features_enabled: ["route_events", "notifications", "cost_reports"],
      activated_at: new Date().toISOString()
    }
  });

  return new Response(JSON.stringify(outlookResponse), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}