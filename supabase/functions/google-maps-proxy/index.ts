import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    console.log('Environment check:', { 
      hasApiKey: !!googleMapsApiKey,
      keyLength: googleMapsApiKey?.length || 0 
    });
    
    if (!googleMapsApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          details: 'API-nøkkel ikke funnet i miljøvariabler'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Returning API key successfully');
    // Return the API key for the frontend to use
    return new Response(
      JSON.stringify({ apiKey: googleMapsApiKey }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-maps-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});