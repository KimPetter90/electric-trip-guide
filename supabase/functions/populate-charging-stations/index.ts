import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[POPULATE-CHARGING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current number of charging stations
    const { count } = await supabase
      .from('charging_stations')
      .select('*', { count: 'exact', head: true });

    logStep("Current charging stations count", { count });

    // If we already have many stations, skip population
    if (count && count > 100) {
      logStep("Sufficient charging stations already exist, skipping population");
      return new Response(
        JSON.stringify({ 
          message: "Charging stations already populated", 
          currentCount: count 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Norway charging stations data - Major cities and highways
    const norwegianChargingStations = [
      // Oslo and surrounding areas
      {
        name: "Tesla Supercharger Grønland",
        location: "Oslo",
        address: "Schweigaards gate 15B, 0191 Oslo",
        latitude: 59.9103,
        longitude: 10.7578,
        provider: "Tesla",
        total: 16,
        available: 12,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Ionity Oslo Vest",
        location: "Oslo",
        address: "Sandvika Storsenter, 1338 Sandvika",
        latitude: 59.8921,
        longitude: 10.5194,
        provider: "Ionity",
        total: 6,
        available: 4,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Circle K Lambertseter",
        location: "Oslo",
        address: "Cecilie Thoresens vei 5, 1153 Oslo",
        latitude: 59.8579,
        longitude: 10.8179,
        provider: "Circle K",
        total: 8,
        available: 6,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },
      {
        name: "Recharge Aker Brygge",
        location: "Oslo",
        address: "Aker Brygge, 0250 Oslo",
        latitude: 59.9099,
        longitude: 10.7302,
        provider: "Recharge",
        total: 12,
        available: 8,
        power: "50 kW",
        cost: 3.95,
        fast_charger: true
      },
      {
        name: "Fortum Oslo City",
        location: "Oslo",
        address: "Oslo City, Stenersgata 1, 0050 Oslo",
        latitude: 59.9127,
        longitude: 10.7461,
        provider: "Fortum",
        total: 4,
        available: 3,
        power: "22 kW",
        cost: 3.50,
        fast_charger: false
      },

      // Bergen
      {
        name: "Tesla Supercharger Bergen",
        location: "Bergen",
        address: "Kokstadveien 23, 5257 Kokstad",
        latitude: 60.3372,
        longitude: 5.4108,
        provider: "Tesla",
        total: 12,
        available: 9,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Ionity Bergen Flesland",
        location: "Bergen",
        address: "Flyplassveien 555, 5869 Bergen",
        latitude: 60.2934,
        longitude: 5.2181,
        provider: "Ionity",
        total: 6,
        available: 5,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Circle K Åsane",
        location: "Bergen",
        address: "Åsane Storsenter, 5116 Ulset",
        latitude: 60.4348,
        longitude: 5.3470,
        provider: "Circle K",
        total: 10,
        available: 7,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },
      {
        name: "Recharge Bergen Sentrum",
        location: "Bergen",
        address: "Torgallmenningen, 5014 Bergen",
        latitude: 60.3913,
        longitude: 5.3221,
        provider: "Recharge",
        total: 6,
        available: 4,
        power: "50 kW",
        cost: 3.95,
        fast_charger: true
      },

      // Trondheim
      {
        name: "Tesla Supercharger Trondheim",
        location: "Trondheim",
        address: "Sirkus Shopping, 7465 Trondheim",
        latitude: 63.3546,
        longitude: 10.3734,
        provider: "Tesla",
        total: 8,
        available: 6,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Ionity Trondheim",
        location: "Trondheim",
        address: "Værnes, 7500 Stjørdal",
        latitude: 63.4579,
        longitude: 10.9239,
        provider: "Ionity",
        total: 6,
        available: 4,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Circle K City Syd",
        location: "Trondheim",
        address: "City Syd, 7046 Trondheim",
        latitude: 63.3617,
        longitude: 10.3686,
        provider: "Circle K",
        total: 8,
        available: 5,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },

      // Stavanger
      {
        name: "Tesla Supercharger Stavanger",
        location: "Stavanger",
        address: "Kvadrat Storsenter, 4306 Sandnes",
        latitude: 58.8516,
        longitude: 5.7375,
        provider: "Tesla",
        total: 10,
        available: 8,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Ionity Stavanger",
        location: "Stavanger",
        address: "Sola Lufthavn, 4055 Sola",
        latitude: 58.8768,
        longitude: 5.6378,
        provider: "Ionity",
        total: 6,
        available: 3,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Circle K Forus",
        location: "Stavanger",
        address: "Forusparken, 4033 Stavanger",
        latitude: 58.9341,
        longitude: 5.7069,
        provider: "Circle K",
        total: 12,
        available: 9,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },

      // Kristiansand
      {
        name: "Tesla Supercharger Kristiansand",
        location: "Kristiansand",
        address: "Sørlandssenteret, 4636 Kristiansand",
        latitude: 58.1875,
        longitude: 8.0754,
        provider: "Tesla",
        total: 8,
        available: 6,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Circle K Kristiansand",
        location: "Kristiansand",
        address: "Vågsbygd, 4630 Kristiansand",
        latitude: 58.1467,
        longitude: 7.9956,
        provider: "Circle K",
        total: 6,
        available: 4,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },

      // Tromsø
      {
        name: "Tesla Supercharger Tromsø",
        location: "Tromsø",
        address: "Jekta Storsenter, 9100 Kvaløysletta",
        latitude: 69.6781,
        longitude: 18.9710,
        provider: "Tesla",
        total: 6,
        available: 4,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Circle K Tromsø",
        location: "Tromsø",
        address: "Langnes, 9016 Tromsø",
        latitude: 69.6832,
        longitude: 18.9196,
        provider: "Circle K",
        total: 4,
        available: 3,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },

      // Ålesund
      {
        name: "Tesla Supercharger Ålesund",
        location: "Ålesund",
        address: "Moa Retail Park, 6026 Ålesund",
        latitude: 62.4722,
        longitude: 6.1549,
        provider: "Tesla",
        total: 8,
        available: 6,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },

      // Bodø
      {
        name: "Circle K Bodø",
        location: "Bodø",
        address: "City Nord, 8026 Bodø",
        latitude: 67.2804,
        longitude: 14.4049,
        provider: "Circle K",
        total: 6,
        available: 4,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },

      // Highway stations - E6
      {
        name: "Ionity Lillestrøm",
        location: "Lillestrøm",
        address: "Strømmen Storsenter, 2010 Strømmen",
        latitude: 59.9470,
        longitude: 11.0736,
        provider: "Ionity",
        total: 6,
        available: 5,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Circle K Gardermoen",
        location: "Gardermoen",
        address: "Oslo Lufthavn, 2061 Gardermoen",
        latitude: 60.1939,
        longitude: 11.1004,
        provider: "Circle K",
        total: 16,
        available: 12,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },
      {
        name: "Tesla Supercharger Hamar",
        location: "Hamar",
        address: "CC Hamar, 2317 Hamar",
        latitude: 60.7945,
        longitude: 11.0680,
        provider: "Tesla",
        total: 8,
        available: 6,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Ionity Dombås",
        location: "Dombås",
        address: "Dombås Storsenter, 2660 Dombås",
        latitude: 62.0758,
        longitude: 9.1304,
        provider: "Ionity",
        total: 4,
        available: 3,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },

      // Highway stations - E18
      {
        name: "Tesla Supercharger Drammen",
        location: "Drammen",
        address: "Gulskogen Senter, 3048 Drammen",
        latitude: 59.7389,
        longitude: 10.2041,
        provider: "Tesla",
        total: 10,
        available: 8,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Circle K Larvik",
        location: "Larvik",
        address: "Farris Bad, 3269 Larvik",
        latitude: 59.0537,
        longitude: 10.0357,
        provider: "Circle K",
        total: 8,
        available: 6,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },
      {
        name: "Ionity Arendal",
        location: "Arendal",
        address: "Lyngdal, 4580 Lyngdal",
        latitude: 58.1376,
        longitude: 7.0659,
        provider: "Ionity",
        total: 6,
        available: 4,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },

      // Additional major stations
      {
        name: "Recharge Fredrikstad",
        location: "Fredrikstad",
        address: "Torvbyen, 1621 Gressvik",
        latitude: 59.2025,
        longitude: 10.9758,
        provider: "Recharge",
        total: 8,
        available: 6,
        power: "50 kW",
        cost: 3.95,
        fast_charger: true
      },
      {
        name: "Tesla Supercharger Moss",
        location: "Moss",
        address: "Tunebadet, 1524 Moss",
        latitude: 59.4315,
        longitude: 10.6596,
        provider: "Tesla",
        total: 6,
        available: 4,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      },
      {
        name: "Circle K Sarpsborg",
        location: "Sarpsborg",
        address: "Borgengata 5, 1724 Sarpsborg",
        latitude: 59.2833,
        longitude: 11.1094,
        provider: "Circle K",
        total: 6,
        available: 5,
        power: "150 kW",
        cost: 4.49,
        fast_charger: true
      },
      {
        name: "Ionity Tønsberg",
        location: "Tønsberg",
        address: "Farmandstredet, 3111 Tønsberg",
        latitude: 59.2676,
        longitude: 10.4065,
        provider: "Ionity",
        total: 6,
        available: 4,
        power: "350 kW",
        cost: 6.90,
        fast_charger: true
      },
      {
        name: "Tesla Supercharger Skien",
        location: "Skien",
        address: "Arkaden Skien, 3717 Skien",
        latitude: 59.2086,
        longitude: 9.6108,
        provider: "Tesla",
        total: 8,
        available: 6,
        power: "250 kW",
        cost: 4.95,
        fast_charger: true
      }
    ];

    logStep("Starting to insert charging stations", { count: norwegianChargingStations.length });

    // Insert charging stations in batches
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < norwegianChargingStations.length; i += batchSize) {
      const batch = norwegianChargingStations.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('charging_stations')
        .upsert(batch, { onConflict: 'name,location' });

      if (error) {
        logStep("Error inserting batch", { batchStart: i, error: error.message });
        continue;
      }

      insertedCount += batch.length;
      logStep("Inserted batch", { batchStart: i, batchSize: batch.length });
    }

    logStep("Completed charging station population", { insertedCount });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Norwegian charging stations populated successfully",
        insertedCount,
        totalStations: norwegianChargingStations.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    logStep("ERROR in populate-charging-stations function", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});