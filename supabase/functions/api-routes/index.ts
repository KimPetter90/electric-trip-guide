import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[API-ROUTES] ${step}${detailsStr}`);
};

interface RouteRequest {
  from: string;
  to: string;
  car_model: string;
  battery_percentage?: number;
  trailer_weight?: number;
  client_id?: string;
}

interface AnalyticsRequest {
  client_id: string;
  start_date?: string;
  end_date?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("API request received", { 
      method: req.method, 
      url: req.url,
      userAgent: req.headers.get("user-agent")
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const apiKey = req.headers.get("x-api-key");

    // API Key validation for B2B clients
    if (apiKey) {
      logStep("B2B API key detected", { apiKey: apiKey.substring(0, 8) + "..." });
      // TODO: Validate API key against client database
    }

    // Log API usage for analytics
    await supabaseClient.from('api_usage_log').insert({
      endpoint: endpoint,
      client_ip: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent"),
      api_key: apiKey,
      timestamp: new Date().toISOString(),
      response_status: 200
    });

    switch (endpoint) {
      case "calculate-route":
        return await handleRouteCalculation(req, supabaseClient);
      
      case "analytics":
        return await handleAnalytics(req, supabaseClient);
      
      case "charging-stations":
        return await handleChargingStations(req, supabaseClient);
      
      case "client-usage":
        return await handleClientUsage(req, supabaseClient);
        
      default:
        return new Response(JSON.stringify({ 
          error: "Endpoint not found",
          available_endpoints: [
            "/calculate-route",
            "/analytics", 
            "/charging-stations",
            "/client-usage"
          ]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in API", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleRouteCalculation(req: Request, supabase: any) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const body: RouteRequest = await req.json();
  logStep("Route calculation request", body);

  // Validate required fields
  if (!body.from || !body.to || !body.car_model) {
    return new Response(JSON.stringify({ 
      error: "Missing required fields: from, to, car_model" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Get car specifications
  const { data: carData } = await supabase
    .from('favorite_car')
    .select('*')
    .eq('brand', body.car_model.split(' ')[0])
    .eq('model', body.car_model.split(' ').slice(1).join(' '))
    .single();

  // Calculate route impact (simplified for API)
  const estimatedDistance = calculateDistance(body.from, body.to);
  const batteryUsage = calculateBatteryUsage(estimatedDistance, carData);
  const chargingStops = calculateChargingStops(batteryUsage, body.battery_percentage || 80);
  const estimatedCost = calculateCost(estimatedDistance, chargingStops);

  const result = {
    route: {
      from: body.from,
      to: body.to,
      distance_km: estimatedDistance,
      estimated_duration_minutes: Math.round(estimatedDistance * 1.2), // Rough estimate
    },
    car: {
      model: body.car_model,
      battery_capacity: carData?.battery_capacity || 75,
      range_km: carData?.range || 400,
    },
    impact: {
      battery_usage_percent: batteryUsage,
      charging_stops_needed: chargingStops,
      estimated_cost_nok: estimatedCost,
      co2_saved_kg: Math.round(estimatedDistance * 0.12), // vs petrol car
    },
    metadata: {
      calculated_at: new Date().toISOString(),
      client_id: body.client_id || "web-app",
      api_version: "1.0"
    }
  };

  // Store route for analytics
  await supabase.from('favorite_routes').insert({
    user_id: body.client_id || 'api-user',
    route_name: `${body.from} → ${body.to}`,
    from_location: body.from,
    to_location: body.to,
    distance: estimatedDistance,
    estimated_duration: Math.round(estimatedDistance * 1.2),
    estimated_cost: estimatedCost,
    car_model: body.car_model,
    created_at: new Date().toISOString()
  });

  logStep("Route calculation completed", { distance: estimatedDistance, cost: estimatedCost });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleAnalytics(req: Request, supabase: any) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const startDate = url.searchParams.get("start_date") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = url.searchParams.get("end_date") || new Date().toISOString();

  logStep("Analytics request", { clientId, startDate, endDate });

  // Get route analytics
  let routeQuery = supabase
    .from('favorite_routes')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (clientId) {
    routeQuery = routeQuery.eq('user_id', clientId);
  }

  const { data: routes } = await routeQuery;

  // Get API usage analytics
  let usageQuery = supabase
    .from('api_usage_log')
    .select('*')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate);

  const { data: apiUsage } = await usageQuery;

  const analytics = {
    period: {
      start_date: startDate,
      end_date: endDate,
      days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    },
    routes: {
      total_calculated: routes?.length || 0,
      total_distance_km: routes?.reduce((sum, route) => sum + (route.distance || 0), 0) || 0,
      total_cost_saved_nok: routes?.reduce((sum, route) => sum + (route.estimated_cost || 0), 0) || 0,
      most_popular_destinations: getMostPopularDestinations(routes || []),
      average_distance_km: routes?.length ? Math.round((routes.reduce((sum, route) => sum + (route.distance || 0), 0) / routes.length)) : 0
    },
    api_usage: {
      total_requests: apiUsage?.length || 0,
      requests_per_day: Math.round((apiUsage?.length || 0) / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))),
      endpoints_used: getEndpointUsage(apiUsage || [])
    },
    environmental_impact: {
      co2_saved_kg: Math.round((routes?.reduce((sum, route) => sum + (route.distance || 0), 0) || 0) * 0.12),
      equivalent_trees_planted: Math.round(((routes?.reduce((sum, route) => sum + (route.distance || 0), 0) || 0) * 0.12) / 22)
    }
  };

  return new Response(JSON.stringify(analytics), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleChargingStations(req: Request, supabase: any) {
  const { data: stations } = await supabase
    .from('charging_stations')
    .select('*')
    .eq('available', true)
    .order('name');

  return new Response(JSON.stringify({ 
    stations: stations || [],
    total_count: stations?.length || 0 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleClientUsage(req: Request, supabase: any) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");

  if (!clientId) {
    return new Response(JSON.stringify({ error: "client_id required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const { data: usage } = await supabase
    .from('api_usage_log')
    .select('*')
    .eq('api_key', clientId)
    .order('timestamp', { ascending: false })
    .limit(100);

  return new Response(JSON.stringify({ 
    client_id: clientId,
    recent_usage: usage || [],
    total_requests: usage?.length || 0
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Helper functions
function calculateDistance(from: string, to: string): number {
  // Simplified distance calculation - in production would use actual routing
  const distances: { [key: string]: number } = {
    'oslo-bergen': 463,
    'oslo-trondheim': 551,
    'bergen-trondheim': 690,
    'oslo-stavanger': 386,
    'oslo-tromsø': 1368
  };
  
  const key = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const reverseKey = `${to.toLowerCase()}-${from.toLowerCase()}`;
  
  return distances[key] || distances[reverseKey] || Math.floor(Math.random() * 500) + 100;
}

function calculateBatteryUsage(distance: number, carData: any): number {
  const consumption = carData?.consumption || 18; // kWh/100km
  const batteryCapacity = carData?.battery_capacity || 75;
  return Math.round((distance * consumption / 100 / batteryCapacity) * 100);
}

function calculateChargingStops(batteryUsage: number, currentBattery: number): number {
  return batteryUsage > currentBattery ? Math.ceil((batteryUsage - currentBattery) / 80) : 0;
}

function calculateCost(distance: number, chargingStops: number): number {
  const baseCost = distance * 0.15; // NOK per km
  const chargingCost = chargingStops * 200; // NOK per charging stop
  return Math.round(baseCost + chargingCost);
}

function getMostPopularDestinations(routes: any[]): string[] {
  const destinations: { [key: string]: number } = {};
  routes.forEach(route => {
    destinations[route.to_location] = (destinations[route.to_location] || 0) + 1;
  });
  return Object.entries(destinations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([dest]) => dest);
}

function getEndpointUsage(usage: any[]): { [key: string]: number } {
  const endpoints: { [key: string]: number } = {};
  usage.forEach(log => {
    endpoints[log.endpoint] = (endpoints[log.endpoint] || 0) + 1;
  });
  return endpoints;
}