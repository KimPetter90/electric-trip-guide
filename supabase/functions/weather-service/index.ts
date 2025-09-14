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

    const { startLat, startLng, endLat, endLng, travelDate } = await req.json();
    
    // Determine if we need forecast data (for future dates) or current weather
    const now = new Date();
    const requestDate = travelDate ? new Date(travelDate) : now;
    const isCurrentWeather = requestDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours
    
    console.log('Fetching weather data for route:', { 
      startLat, startLng, endLat, endLng, 
      travelDate, isCurrentWeather, requestDate: requestDate.toISOString() 
    });

    // Fetch weather data for both locations (current or forecast based on date)
    let startWeatherResponse, endWeatherResponse;
    
    if (isCurrentWeather) {
      // Use current weather API
      startWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${startLat}&lon=${startLng}&appid=${openWeatherApiKey}&units=metric`
      );
      endWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${endLat}&lon=${endLng}&appid=${openWeatherApiKey}&units=metric`
      );
    } else {
      // Use forecast API for future dates (5-day forecast with 3-hour intervals)
      startWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${startLat}&lon=${startLng}&appid=${openWeatherApiKey}&units=metric`
      );
      endWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${endLat}&lon=${endLng}&appid=${openWeatherApiKey}&units=metric`
      );
    }
    
    const startWeatherData = await startWeatherResponse.json();
    const endWeatherData = await endWeatherResponse.json();

    if (!startWeatherResponse.ok || !endWeatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    // Helper function to process weather data
    const processWeatherData = (data: any, isCurrentWeather: boolean): WeatherData => {
      if (isCurrentWeather) {
        // Current weather data structure
        return {
          temperature: Math.round(data.main.temp),
          windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
          windDirection: data.wind?.deg || 0,
          humidity: data.main.humidity,
          weatherCondition: data.weather[0].main,
          visibility: Math.round((data.visibility || 10000) / 1000) // Convert to km
        };
      } else {
        // Forecast data structure - find the closest forecast to the requested date
        const targetTime = requestDate.getTime();
        let closestForecast = data.list[0];
        let closestTimeDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - targetTime);
        
        for (const forecast of data.list) {
          const forecastTime = new Date(forecast.dt * 1000).getTime();
          const timeDiff = Math.abs(forecastTime - targetTime);
          
          if (timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            closestForecast = forecast;
          }
        }
        
        return {
          temperature: Math.round(closestForecast.main.temp),
          windSpeed: Math.round(closestForecast.wind?.speed * 3.6 || 0),
          windDirection: closestForecast.wind?.deg || 0,
          humidity: closestForecast.main.humidity,
          weatherCondition: closestForecast.weather[0].main,
          visibility: Math.round((closestForecast.visibility || 10000) / 1000)
        };
      }
    };

    // Process weather data
    const startWeather = processWeatherData(startWeatherData, isCurrentWeather);
    const endWeather = processWeatherData(endWeatherData, isCurrentWeather);

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