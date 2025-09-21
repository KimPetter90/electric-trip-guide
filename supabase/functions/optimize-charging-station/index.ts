import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fast_charger: boolean;
  power: string;
  cost: number;
  provider: string;
  address: string;
}

interface OptimizationRequest {
  stations: ChargingStation[];
  routeData: {
    from: string;
    to: string;
    trailerWeight: number;
    batteryPercentage: number;
    totalDistance: number;
    estimatedTime: number;
  };
  carData: {
    range: number;
    consumption: number;
    batteryCapacity: number;
  };
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
}

async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
  
  if (!weatherApiKey) {
    console.log('⚠️ Weather API key not found, using default values');
    return {
      temperature: 10,
      windSpeed: 5,
      precipitation: 0,
      visibility: 10000
    };
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.main?.temp || 10,
      windSpeed: data.wind?.speed || 5,
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      visibility: data.visibility || 10000
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      temperature: 10,
      windSpeed: 5,
      precipitation: 0,
      visibility: 10000
    };
  }
}

function calculateWeatherImpact(weather: WeatherData): number {
  let impactFactor = 1.0;
  
  // Temperatur påvirkning (kald vær øker forbruk)
  if (weather.temperature < -10) {
    impactFactor += 0.25; // 25% økt forbruk ved meget kaldt vær
  } else if (weather.temperature < 0) {
    impactFactor += 0.15; // 15% økt forbruk ved kaldt vær
  } else if (weather.temperature < 10) {
    impactFactor += 0.05; // 5% økt forbruk ved kjølig vær
  }
  
  // Vind påvirkning
  if (weather.windSpeed > 15) {
    impactFactor += 0.15; // 15% økt forbruk ved sterk vind
  } else if (weather.windSpeed > 10) {
    impactFactor += 0.08; // 8% økt forbruk ved moderat vind
  }
  
  // Nedbør påvirkning
  if (weather.precipitation > 5) {
    impactFactor += 0.10; // 10% økt forbruk ved kraftig nedbør
  } else if (weather.precipitation > 1) {
    impactFactor += 0.05; // 5% økt forbruk ved moderat nedbør
  }
  
  return impactFactor;
}

function calculateTrailerImpact(trailerWeight: number): number {
  if (trailerWeight === 0) return 1.0;
  
  // Hengerlast øker forbruk betydelig
  if (trailerWeight > 1500) {
    return 1.4; // 40% økt forbruk for tung henger
  } else if (trailerWeight > 1000) {
    return 1.3; // 30% økt forbruk for medium henger
  } else if (trailerWeight > 500) {
    return 1.2; // 20% økt forbruk for lett henger
  } else {
    return 1.1; // 10% økt forbruk for meget lett henger
  }
}

function calculateRequiredRange(routeData: any, carData: any, weatherImpact: number, trailerImpact: number): number {
  const baseConsumption = carData.consumption;
  const adjustedConsumption = baseConsumption * weatherImpact * trailerImpact;
  const rangeWithCurrentBattery = (carData.range * routeData.batteryPercentage) / 100;
  
  // Beregn hvor langt bilen kan kjøre med nåværende batteri under gitte forhold
  const adjustedRange = rangeWithCurrentBattery / (weatherImpact * trailerImpact);
  
  return adjustedRange;
}

function calculateStationScore(
  station: ChargingStation, 
  routeData: any, 
  carData: any, 
  weather: WeatherData,
  requiredRange: number,
  distanceToStation: number,
  isRisky: boolean = false
): number {
  let score = 0;
  
  // Tilgjengelighet (40% av score)
  const availability = station.available / station.total;
  score += availability * 40;
  
  // Hurtiglading bonus (25% av score)
  if (station.fast_charger) {
    const power = parseInt(station.power.replace(/\D/g, '')) || 150;
    if (power >= 250) score += 25; // Superhurtig
    else if (power >= 150) score += 20; // Hurtig
    else score += 10; // Moderat hurtig
  }
  
  // Kostnad (15% av score - lavere kostnad = høyere score)
  const costScore = Math.max(0, 15 - (station.cost - 3) * 3);
  score += costScore;
  
  // SIKKERHETSJUSTERING: Hvis situasjonen er risikabel, favoriser stasjoner som er tidlig på ruten men ikke ved start
  if (isRisky) {
    // Ved risikabelt: vi vil ha stasjoner 100-300km fra start (ikke ved start, men tidlig på ruten)
    if (distanceToStation < 50) {
      score -= 30; // STRAFF for stasjoner ved start - vi vil gjøre fremgang!
    } else if (distanceToStation >= 50 && distanceToStation < 150) {
      score += 40; // STOR BONUS for stasjoner tidlig på ruten (50-150km fra start)
    } else if (distanceToStation >= 150 && distanceToStation < 250) {
      score += 20; // Moderat bonus for stasjoner på midten av ruten
    } else {
      score -= 30; // Straff for stasjoner for langt unna når risikabelt
    }
  } else {
    // Normal avstandsberegning når ikke risikabelt (fra midtpunkt av ruten)
    const maxReasonableDistance = 100;
    const distanceScore = Math.max(0, 30 - (distanceToStation / maxReasonableDistance) * 30);
    score += distanceScore;
    
    if (distanceToStation > 150) {
      score -= 20;
    }
  }
  
  // Kritisk stasjon bonus hvis batteri er lavt
  if (routeData.batteryPercentage < 30 && distanceToStation < requiredRange * 1000 * 0.8) {
    score += 30;
  }
  
  // Leverandør bonus (kjente leverandører)
  if (['Tesla', 'Fortum', 'Eviny'].includes(station.provider)) {
    score += 5;
  }
  
  return Math.min(100, score);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const optimizationRequest: OptimizationRequest = await req.json();
    console.log('🎯 Optimizing charging station selection...');
    console.log('📥 MOTTATT DATA:', {
      stationsCount: optimizationRequest.stations?.length || 0,
      trailerWeight: optimizationRequest.routeData?.trailerWeight,
      batteryPercentage: optimizationRequest.routeData?.batteryPercentage,
      totalDistance: optimizationRequest.routeData?.totalDistance,
      from: optimizationRequest.routeData?.from,
      to: optimizationRequest.routeData?.to
    });
    
    const { stations, routeData, carData } = optimizationRequest;
    
    if (!stations || stations.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No stations provided',
        recommendedStation: null,
        analysis: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Hent værdata for første stasjon (representativt for området)
    const weather = await getWeatherData(stations[0].latitude, stations[0].longitude);
    console.log('🌦️ Weather data:', weather);
    
    // Beregn påvirkningsfaktorer
    const weatherImpact = calculateWeatherImpact(weather);
    const trailerImpact = calculateTrailerImpact(routeData.trailerWeight);
    const requiredRange = calculateRequiredRange(routeData, carData, weatherImpact, trailerImpact);
    
    console.log('📊 Impact factors:', {
      weatherImpact,
      trailerImpact,
      requiredRange,
      currentBatteryRange: (carData.range * routeData.batteryPercentage) / 100
    });
    
    // CRITICAL: Check if charging is actually needed
    const currentRange = (carData.range * routeData.batteryPercentage) / 100;
    const adjustedCurrentRange = currentRange / (weatherImpact * trailerImpact);
    const routeDistance = routeData.totalDistance || 0;
    
    console.log('🔍 Charging need calculation:', {
      batteryPercentage: routeData.batteryPercentage,
      carRange: carData.range,
      currentRange,
      weatherImpact,
      trailerImpact,
      adjustedCurrentRange,
      routeDistance,
      needsCharging: adjustedCurrentRange < (routeDistance * 1.2)
    });
    
    // ENKEL LOGIKK: Risikabelt = har henger. Ikke risikabelt = ingen henger.
    const isRisky = routeData.trailerWeight > 0;
    
    console.log('🚨 DETALJERT SIKKERHETSEVALUERING:', {
      batteryPercentage: routeData.batteryPercentage,
      trailerWeight: routeData.trailerWeight,
      weatherImpact: weatherImpact,
      trailerImpact: trailerImpact,
      currentRange: currentRange,
      adjustedCurrentRange: adjustedCurrentRange.toFixed(0),
      routeDistance: routeDistance.toFixed(0),
      isRisky: isRisky,
      safetyMarginPercent: ((adjustedCurrentRange / routeDistance) * 100).toFixed(0) + '%',
      modus: isRisky ? 'RISIKABEL - beregner fra START' : 'NORMAL - beregner fra MIDTPUNKT'
    });
    
    // If we have 20% safety margin beyond route distance, no charging needed
    const basicSafetyMargin = 1.2; // 20% safety margin
    if (adjustedCurrentRange >= (routeDistance * basicSafetyMargin)) {
      console.log('✅ No charging needed! Current range sufficient for route');
      return new Response(JSON.stringify({
        recommendedStation: null,
        analysis: {
          chargingNeeded: false,
          currentRange: adjustedCurrentRange,
          routeDistance: routeDistance,
          safetyMargin: (adjustedCurrentRange / routeDistance).toFixed(1) + 'x',
          message: `Du har ${routeData.batteryPercentage}% batteri som gir deg ${adjustedCurrentRange.toFixed(0)} km rekkevidde. Ruten er ${routeDistance.toFixed(0)} km, så ingen lading er nødvendig.`
        },
        totalStationsAnalyzed: stations.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Beregn score for hver stasjon - MED RISIKOEVALUERING
    const stationsWithScores = stations.map(station => {
      // Simuler avstand til stasjon basert på geografisk plassering
      const stationLat = parseFloat(station.latitude.toString());
      const stationLon = parseFloat(station.longitude.toString());
      
      // Geografiske koordinater for kjente steder (demo data)
      const knownLocations: { [key: string]: { lat: number, lon: number } } = {
        'oslo': { lat: 59.9139, lon: 10.7522 },
        'trondheim': { lat: 63.4305, lon: 10.3951 },
        'bergen': { lat: 60.3913, lon: 5.3221 },
        'ålesund': { lat: 62.4722, lon: 6.1549 },
        'dombås': { lat: 62.0767, lon: 9.1181 },
        'lillehammer': { lat: 61.1161, lon: 10.4669 }
      };
      
      // Finn start og sluttsted fra rute
      const fromLower = (routeData.from || '').toLowerCase();
      const toLower = (routeData.to || '').toLowerCase();
      
      let fromLat = 59.9139, fromLon = 10.7522; // Default Oslo
      let toLat = 59.9139, toLon = 10.7522;
      
      // Finn koordinater for start og slutt
      for (const [place, coords] of Object.entries(knownLocations)) {
        if (fromLower.includes(place)) {
          fromLat = coords.lat;
          fromLon = coords.lon;
        }
        if (toLower.includes(place)) {
          toLat = coords.lat;
          toLon = coords.lon;
        }
      }
      
      // Beregn avstand - forskjellig strategi for risikabel vs normal situasjon
      const R = 6371; // Earth's radius in km
      let distanceFromRoute;
      
      if (isRisky) {
        // Ved risikabel situasjon: beregn avstand fra START av ruten
        const dLat = (stationLat - fromLat) * Math.PI / 180;
        const dLon = (stationLon - fromLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(fromLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceFromRoute = R * c;
      } else {
        // Normal situasjon: beregn avstand fra midtpunkt av ruten
        const midLat = (fromLat + toLat) / 2;
        const midLon = (fromLon + toLon) / 2;
        
        const dLat = (stationLat - midLat) * Math.PI / 180;
        const dLon = (stationLon - midLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(midLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceFromRoute = R * c;
      }
      
      console.log(`📍 Station ${station.name}: ${distanceFromRoute.toFixed(0)}km from route ${isRisky ? 'START (risky mode)' : 'midpoint (normal mode)'} (${fromLower} → ${toLower})`);
      
      const score = calculateStationScore(
        station,
        routeData,
        carData,
        weather,
        requiredRange,
        distanceFromRoute,  // Send riktig avstand basert på modus
        isRisky  // Send med sikkerhetsstatus
      );
      
      return {
        ...station,
        optimizationScore: score,
        distanceFromRoute: distanceFromRoute,
        weatherImpact,
        trailerImpact
      };
    });
    
    // Sorter etter score og filtrer ut stasjoner som er for langt unna
    const filteredStations = stationsWithScores.filter(station => station.distanceFromRoute < 200); // Max 200km fra ruten
    const sortedStations = filteredStations.sort((a, b) => b.optimizationScore - a.optimizationScore);
    
    if (sortedStations.length === 0) {
      console.log('❌ No suitable stations found within reasonable distance');
      return new Response(JSON.stringify({
        recommendedStation: null,
        analysis: {
          chargingNeeded: true,
          error: 'Ingen passende ladestasjoner funnet langs ruten'
        },
        totalStationsAnalyzed: stations.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const recommendedStation = sortedStations[0];
    
    console.log(`🏆 Best station: ${recommendedStation.name} (Score: ${recommendedStation.optimizationScore.toFixed(1)}, Distance: ${recommendedStation.distanceFromRoute.toFixed(0)}km from route)`);
    
    const analysis = {
      weatherConditions: {
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        precipitation: weather.precipitation,
        impact: `${((weatherImpact - 1) * 100).toFixed(0)}% økt forbruk`
      },
      trailerImpact: {
        weight: routeData.trailerWeight,
        impact: `${((trailerImpact - 1) * 100).toFixed(0)}% økt forbruk`
      },
      batteryAnalysis: {
        currentLevel: routeData.batteryPercentage,
        adjustedRange: Math.round(requiredRange),
        totalRouteDistance: routeData.totalDistance,
        chargingNeeded: requiredRange < routeData.totalDistance
      },
      stationRanking: sortedStations.slice(0, 3).map(s => ({
        name: s.name,
        score: Math.round(s.optimizationScore),
        availability: `${s.available}/${s.total}`,
        cost: `${s.cost} kr/kWh`,
        reason: s.optimizationScore > 80 ? 'Utmerket valg' : 
                s.optimizationScore > 60 ? 'Godt valg' : 'OK valg'
      }))
    };
    
    return new Response(JSON.stringify({
      recommendedStation,
      analysis,
      totalStationsAnalyzed: stations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error in optimize-charging-station function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      recommendedStation: null,
      analysis: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});