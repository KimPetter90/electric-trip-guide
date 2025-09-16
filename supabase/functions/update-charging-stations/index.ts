import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔄 Starting live charging station updates...')

    // Hent alle ladestasjoner
    const { data: stations, error: fetchError } = await supabase
      .from('charging_stations')
      .select('*')

    if (fetchError) {
      throw fetchError
    }

    console.log(`📊 Found ${stations?.length || 0} charging stations to update`)

    // Oppdater tilfeldig tilgjengelighet for hver stasjon
    for (const station of stations || []) {
      // Simuler realistiske endringer i tilgjengelighet
      const maxChange = Math.floor(station.total * 0.3) // Maks 30% endring
      const currentAvailable = station.available
      
      // Tilfeldig endring mellom -maxChange og +maxChange
      const change = Math.floor(Math.random() * (maxChange * 2 + 1)) - maxChange
      let newAvailable = Math.max(0, Math.min(station.total, currentAvailable + change))
      
      // Litt mer sannsynlig at stasjoner blir mer tilgjengelige enn mindre
      if (Math.random() > 0.6 && newAvailable < station.total) {
        newAvailable = Math.min(station.total, newAvailable + 1)
      }

      // Simuler prisendringer (±0.5 kr/kWh)
      const priceChange = (Math.random() - 0.5) * 1.0 // -0.5 til +0.5
      const newCost = Math.max(3.0, Math.min(7.0, station.cost + priceChange))

      // Oppdater kun hvis det er endringer
      if (newAvailable !== currentAvailable || Math.abs(newCost - station.cost) > 0.1) {
        const { error: updateError } = await supabase
          .from('charging_stations')
          .update({
            available: newAvailable,
            cost: Math.round(newCost * 10) / 10 // Rund til 1 desimal
          })
          .eq('id', station.id)

        if (updateError) {
          console.error(`❌ Error updating station ${station.name}:`, updateError)
        } else {
          console.log(`✅ Updated ${station.name}: ${currentAvailable} → ${newAvailable} available, ${station.cost} → ${Math.round(newCost * 10) / 10} kr/kWh`)
        }
      }
    }

    console.log('✅ Completed live charging station updates')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Charging stations updated successfully',
        updatedCount: stations?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('❌ Error in update-charging-stations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})