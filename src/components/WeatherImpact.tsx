import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PremiumGate, usePremiumAccess } from "@/components/PremiumGate";
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Battery
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  rangeFactor: number;
}

interface WeatherImpactProps {
  selectedCar: any;
  routeData: {
    from: string;
    to: string;
    travelDate?: Date;
  };
}

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('rain')) return <CloudRain className="h-5 w-5" />;
  if (lower.includes('snow')) return <CloudSnow className="h-5 w-5" />;
  if (lower.includes('cloud')) return <Cloud className="h-5 w-5" />;
  return <Sun className="h-5 w-5" />;
};

const getImpactColor = (factor: number) => {
  if (factor >= 1.0) return "text-green-500";
  if (factor >= 0.9) return "text-yellow-500";
  if (factor >= 0.8) return "text-orange-500";
  return "text-red-500";
};

const getImpactLevel = (factor: number) => {
  if (factor >= 1.05) return { level: "Forbedret", icon: <TrendingUp className="h-4 w-4" /> };
  if (factor >= 0.95) return { level: "Minimal påvirkning", icon: <Battery className="h-4 w-4" /> };
  if (factor >= 0.85) return { level: "Moderat reduksjon", icon: <TrendingDown className="h-4 w-4" /> };
  if (factor >= 0.75) return { level: "Betydelig reduksjon", icon: <AlertTriangle className="h-4 w-4" /> };
  return { level: "Stor reduksjon", icon: <AlertTriangle className="h-4 w-4" /> };
};

// Simple geocoding for Norwegian cities
const getCoordinates = (cityName: string) => {
  const norwegianCities: Record<string, {lat: number, lng: number}> = {
    "oslo": { lat: 59.9139, lng: 10.7522 },
    "bergen": { lat: 60.3913, lng: 5.3221 },
    "trondheim": { lat: 63.4305, lng: 10.3951 },
    "stavanger": { lat: 58.9700, lng: 5.7331 },
    "kristiansand": { lat: 58.1467, lng: 7.9956 },
    "tromsø": { lat: 69.6492, lng: 18.9553 },
    "drammen": { lat: 59.7431, lng: 10.2048 },
    "fredrikstad": { lat: 59.2181, lng: 10.9298 },
    "ålesund": { lat: 62.4722, lng: 6.1549 },
    "moss": { lat: 59.4315, lng: 10.6588 },
    "sandefjord": { lat: 59.1272, lng: 10.2167 },
    "bodø": { lat: 67.2804, lng: 14.4049 },
    "tønsberg": { lat: 59.2676, lng: 10.4065 },
    "hamar": { lat: 60.7945, lng: 11.0680 },
    "larvik": { lat: 59.0537, lng: 10.0357 }
  };

  // Clean city name - remove region/county info in parentheses
  const cleanCityName = cityName.toLowerCase().split('(')[0].trim();
  
  // Try exact match first
  if (norwegianCities[cleanCityName]) {
    return norwegianCities[cleanCityName];
  }
  
  // Try partial match
  for (const [city, coords] of Object.entries(norwegianCities)) {
    if (city.includes(cleanCityName) || cleanCityName.includes(city)) {
      return coords;
    }
  }
  
  // Default to Oslo if no match found
  return norwegianCities["oslo"];
};

export default function WeatherImpact({ selectedCar, routeData }: WeatherImpactProps) {
  const [weatherData, setWeatherData] = useState<RouteWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (routeData.from && routeData.to && routeData.travelDate) {
      fetchWeatherData();
    }
  }, [routeData.from, routeData.to, routeData.travelDate]);

  const fetchWeatherData = async () => {
    if (!routeData.from || !routeData.to) return;

    setLoading(true);
    setError(null);

    try {
      const startCoords = getCoordinates(routeData.from);
      const endCoords = getCoordinates(routeData.to);

      const { data, error: supabaseError } = await supabase.functions.invoke('weather-service', {
        body: {
          startLat: startCoords.lat,
          startLng: startCoords.lng,
          endLat: endCoords.lat,
          endLng: endCoords.lng,
          travelDate: routeData.travelDate?.toISOString()
        }
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setWeatherData(data);
    } catch (err: any) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
      toast({
        title: "Værdata utilgjengelig",
        description: "Kunne ikke hente værdata for valgt rute og dato.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!routeData.travelDate || !routeData.from || !routeData.to) {
    return (
      <Card className="p-4 glass-card">
        <div className="text-center text-muted-foreground">
          <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Velg rute og dato for å se værpåvirkning</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4 glass-card">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Henter værdata...</span>
        </div>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className="p-4 glass-card border-red-500/30">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Værdata ikke tilgjengelig</span>
        </div>
      </Card>
    );
  }

  const originalRange = selectedCar?.range || 400;
  const adjustedRange = Math.round(originalRange * weatherData.rangeFactor);
  const rangeChange = adjustedRange - originalRange;
  const percentChange = ((weatherData.rangeFactor - 1) * 100);
  const impact = getImpactLevel(weatherData.rangeFactor);

  return (
    <PremiumGate 
      feature="Værdata & Rekkeviddepåvirkning"
      description="Se hvordan vær og temperatur påvirker bilens rekkevidde for optimal ruteplanlegging"
      fallback={
        <Card className="p-4 glass-card border-dashed border-muted-foreground/30">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-orbitron font-bold text-muted-foreground">Værpåvirkning</h3>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Premium funksjon
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Oppgrader til Premium for detaljert væranalyse og rekkeviddepåvirkning
          </p>
        </Card>
      }
    >
      <Card className="p-4 glass-card cyber-glow">
        <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" />
          <h3 className="font-orbitron font-bold text-gradient">Værpåvirkning</h3>
          <Badge variant="outline" className="text-xs">
            {format(routeData.travelDate, "dd.MM.yyyy")}
          </Badge>
        </div>

        {/* Range Impact Summary - Compact display */}
        <div className="bg-background/20 rounded-lg p-2 border border-border/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Værpåvirkning:</span>
            <span className={`text-xs ${getImpactColor(weatherData.rangeFactor)}`}>
              {adjustedRange} km ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Uten vær:</span>
            <span className="text-xs">{originalRange} km</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {weatherData.averageConditions.temperature}°C • {weatherData.averageConditions.windSpeed} km/h vind
          </div>
          <Progress 
            value={weatherData.rangeFactor * 100} 
            className="h-1 mt-1"
            max={120}
          />
        </div>

        </div>
      </Card>
    </PremiumGate>
  );
}