import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  weatherCondition: string;
  visibility: number;
}

interface RouteWeatherData {
  startWeather: WeatherData;
  endWeather: WeatherData;
  averageConditions: {
    temperature: number;
    windSpeed: number;
    humidity: number;
  };
  rangeFactor: number; // Multiplier for range calculation (0.7 - 1.2)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
    
    if (!openWeatherApiKey) {
      console.error('OPENWEATHER_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Weather API key not configured',
          details: 'OpenWeather API-nøkkel ikke funnet'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { startLat, startLng, endLat, endLng } = await req.json();
    
    console.log('Fetching weather data for route:', { startLat, startLng, endLat, endLng });

    // Fetch weather for start location
    const startWeatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${startLat}&lon=${startLng}&appid=${openWeatherApiKey}&units=metric`
    );
    const startWeatherData = await startWeatherResponse.json();

    // Fetch weather for end location
    const endWeatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${endLat}&lon=${endLng}&appid=${openWeatherApiKey}&units=metric`
    );
    const endWeatherData = await endWeatherResponse.json();

    if (!startWeatherResponse.ok || !endWeatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    // Process weather data
    const startWeather: WeatherData = {
      temperature: Math.round(startWeatherData.main.temp),
      windSpeed: Math.round(startWeatherData.wind?.speed * 3.6 || 0), // Convert m/s to km/h
      windDirection: startWeatherData.wind?.deg || 0,
      humidity: startWeatherData.main.humidity,
      weatherCondition: startWeatherData.weather[0].main,
      visibility: Math.round((startWeatherData.visibility || 10000) / 1000) // Convert to km
    };

    const endWeather: WeatherData = {
      temperature: Math.round(endWeatherData.main.temp),
      windSpeed: Math.round(endWeatherData.wind?.speed * 3.6 || 0),
      windDirection: endWeatherData.wind?.deg || 0,
      humidity: endWeatherData.main.humidity,
      weatherCondition: endWeatherData.weather[0].main,
      visibility: Math.round((endWeatherData.visibility || 10000) / 1000)
    };

    // Calculate average conditions
    const averageConditions = {
      temperature: Math.round((startWeather.temperature + endWeather.temperature) / 2),
      windSpeed: Math.round((startWeather.windSpeed + endWeather.windSpeed) / 2),
      humidity: Math.round((startWeather.humidity + endWeather.humidity) / 2)
    };

    // Calculate range factor based on weather conditions
    let rangeFactor = 1.0;

    // Temperature impact
    if (averageConditions.temperature < -10) {
      rangeFactor *= 0.7; // Severe cold reduces range significantly
    } else if (averageConditions.temperature < 0) {
      rangeFactor *= 0.8; // Cold weather reduces range
    } else if (averageConditions.temperature > 30) {
      rangeFactor *= 0.85; // Hot weather with AC usage
    } else if (averageConditions.temperature >= 15 && averageConditions.temperature <= 25) {
      rangeFactor *= 1.05; // Optimal temperature range
    }

    // Wind impact
    if (averageConditions.windSpeed > 50) {
      rangeFactor *= 0.85; // Strong winds reduce range
    } else if (averageConditions.windSpeed > 30) {
      rangeFactor *= 0.92; // Moderate winds
    }

    // Weather condition impact
    const weatherCondition = startWeather.weatherCondition.toLowerCase();
    if (weatherCondition.includes('rain') || weatherCondition.includes('snow')) {
      rangeFactor *= 0.9; // Precipitation reduces range
    } else if (weatherCondition.includes('storm')) {
      rangeFactor *= 0.8; // Storms significantly reduce range
    }

    // Humidity impact (high humidity can affect efficiency)
    if (averageConditions.humidity > 80) {
      rangeFactor *= 0.95;
    }

    // Ensure range factor stays within reasonable bounds
    rangeFactor = Math.max(0.6, Math.min(1.2, rangeFactor));

    const routeWeatherData: RouteWeatherData = {
      startWeather,
      endWeather,
      averageConditions,
      rangeFactor
    };

    console.log('Weather data processed successfully:', routeWeatherData);

    return new Response(
      JSON.stringify(routeWeatherData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in weather-service function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Feil ved henting av værdata'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});