import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Truck, Thermometer, Wind, Droplets, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  condition: string;
}

interface RouteWeatherData {
  startWeather: WeatherData;
  endWeather: WeatherData;
  averageConditions: WeatherData;
  rangeFactor: number;
}

interface RouteImpactProps {
  selectedCar: any;
  routeData: {
    from: string;
    to: string;
    trailerWeight: number;
    travelDate?: Date;
    [key: string]: any;
  };
}

const RouteImpact: React.FC<RouteImpactProps> = ({ selectedCar, routeData }) => {
  const [weatherData, setWeatherData] = useState<RouteWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatisk hent værdata når rute planlegges
  useEffect(() => {
    console.log('🌤️ RouteImpact useEffect triggered:', {
      from: routeData.from,
      to: routeData.to, 
      selectedCar: !!selectedCar,
      carBrand: selectedCar?.brand,
      weatherData: !!weatherData
    });
    
    if (routeData.from && routeData.to && selectedCar) {
      console.log('🌤️ Henter værdata automatisk for rute:', routeData.from, '->', routeData.to);
      fetchWeatherData();
    } else {
      console.log('⚠️ Ikke alle kriterier oppfylt for værhenting:', {
        hasFrom: !!routeData.from,
        hasTo: !!routeData.to,
        hasCar: !!selectedCar
      });
    }
  }, [routeData.from, routeData.to, selectedCar]);

  const getWeatherIcon = (condition: string) => {
    const iconClass = "h-4 w-4";
    if (!condition) return <Cloud className={iconClass} />;
    
    switch (condition.toLowerCase()) {
      case 'clear': return <Cloud className={iconClass} />;
      case 'clouds': return <Cloud className={iconClass} />;
      case 'rain': return <Droplets className={iconClass} />;
      case 'snow': return <Cloud className={iconClass} />;
      default: return <Cloud className={iconClass} />;
    }
  };

  const getTrailerImpact = (weight: number) => {
    if (weight <= 0) return { factor: 1.0, level: "Ingen", color: "slate" };
    if (weight <= 500) return { factor: 0.95, level: "Minimal", color: "green" };
    if (weight <= 1000) return { factor: 0.88, level: "Moderat", color: "yellow" };
    if (weight <= 1500) return { factor: 0.82, level: "Betydelig", color: "orange" };
    return { factor: 0.75, level: "Høy", color: "red" };
  };

  const fetchWeatherData = async () => {
    if (!routeData.from || !routeData.to) {
      console.log('⚠️ Mangler fra/til data for værhenting');
      return;
    }

    console.log('🌤️ Starter værhenting for:', routeData.from, '->', routeData.to);
    setLoading(true);
    setError(null);

    try {
      const startCoords = await getCoordinates(routeData.from);
      const endCoords = await getCoordinates(routeData.to);

      if (!startCoords || !endCoords) {
        throw new Error('Kunne ikke finne koordinater for valgte steder');
      }

      console.log('📍 Koordinater funnet:', { startCoords, endCoords });

      const { data, error } = await supabase.functions.invoke('weather-service', {
        body: {
          startLat: startCoords[0],
          startLng: startCoords[1],
          endLat: endCoords[0],
          endLng: endCoords[1],
          travelDate: routeData.travelDate?.toISOString() || new Date().toISOString()
        }
      });

      if (error) {
        console.error('❌ Weather service error:', error);
        throw error;
      }
      
      console.log('✅ Værdata hentet:', data);
      setWeatherData(data);
    } catch (err: any) {
      console.error('❌ Feil ved henting av værdata:', err);
      setError(err.message || 'Feil ved henting av værdata');
    } finally {
      setLoading(false);
    }
  };

  // Utvid koordinatliste med mange flere norske steder
  const getCoordinates = async (cityName: string): Promise<[number, number] | null> => {
    const coords: { [key: string]: [number, number] } = {
      // Store byer
      'oslo': [59.9139, 10.7522],
      'bergen': [60.3913, 5.3221],
      'trondheim': [63.4305, 10.3951],
      'stavanger': [58.9700, 5.7331],
      'kristiansand': [58.1467, 7.9956],
      'ålesund': [62.4722, 6.1495],
      'tromsø': [69.6492, 18.9553],
      'bodø': [67.2804, 14.4049],
      'drammen': [59.7439, 10.2045],
      'fredrikstad': [59.2181, 10.9298],
      'sarpsborg': [59.2839, 11.1097],
      'sandefjord': [59.1289, 10.2280],
      'tønsberg': [59.2674, 10.4078],
      
      // Møre og Romsdal
      'kvalsvik': [62.3167, 6.1000], // Nerlandsøy
      'nerlandsøy': [62.3167, 6.1000],
      'volda': [62.1467, 6.0714],
      'ørsta': [62.1989, 6.1297],
      'stryn': [61.9111, 6.7164],
      'geiranger': [62.1014, 7.2065],
      'molde': [62.7378, 7.1597],
      'kristiansund': [63.1115, 7.7285],
      
      // Vestland 
      'florø': [61.5983, 5.0322],
      'måløy': [61.9347, 5.1119],
      'sogndal': [61.2308, 7.0969],
      'førde': [61.4520, 5.8589],
      'leirvik': [59.7739, 5.4958],
      'haugesund': [59.4138, 5.2681],
      
      // Nordland
      'narvik': [68.4384, 17.4272],
      'mo i rana': [66.3128, 14.1420],
      'svolvær': [68.2348, 14.5669],
      'leknes': [68.1467, 13.6100],
      
      // Troms og Finnmark
      'alta': [69.9689, 23.2717],
      'hammerfest': [70.6634, 23.6821],
      'kirkenes': [69.7281, 30.0450],
      'vadsø': [70.0739, 29.7489]
    };

    // Rens bynavnet (fjern parenteser og extra info)
    const cleanCityName = cityName.toLowerCase().trim().split('(')[0].trim();
    
    // Sjekk først i vår lokale liste
    if (coords[cleanCityName]) {
      return coords[cleanCityName];
    }
    
    // Hvis ikke funnet, prøv å bruke Mapbox geocoding API som backup
    try {
      const response = await fetch('/api/mapbox-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place: cityName })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.coordinates) {
          return data.coordinates;
        }
      }
    } catch (error) {
      console.warn('Geocoding API ikke tilgjengelig, bruker kun lokale koordinater');
    }
    
    return null;
  };

  if (!selectedCar) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-2">
            <Cloud className="h-5 w-5 text-primary animate-glow-pulse" />
            <Truck className="h-5 w-5 text-primary animate-glow-pulse" />
          </div>
          <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Påvirkningsanalyse</h3>
        </div>
        <p className="text-muted-foreground">Velg bil for å se påvirkning på rekkevidde</p>
      </Card>
    );
  }

  const trailerImpact = getTrailerImpact(routeData.trailerWeight || 0);
  const weatherImpact = weatherData?.rangeFactor || 1.0;
  const combinedFactor = trailerImpact.factor * weatherImpact;
  const adjustedRange = Math.round(selectedCar.range * combinedFactor);
  const totalReduction = selectedCar.range - adjustedRange;
  const totalReductionPercent = Math.round((1 - combinedFactor) * 100);

  // Beregn individuelle påvirkninger for visualisering
  const trailerReductionPercent = Math.round((1 - trailerImpact.factor) * 100);
  const weatherReductionPercent = Math.round((1 - weatherImpact) * 100);
  const remainingPercent = 100 - totalReductionPercent;


  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2">
          <Cloud className="h-5 w-5 text-primary animate-glow-pulse" />
          <Truck className="h-5 w-5 text-primary animate-glow-pulse" />
        </div>
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Påvirkningsanalyse</h3>
      </div>

      <div className="space-y-4">
        {/* Impact Summary with Visual Progress */}
        <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">
                {totalReduction > 0 ? "Justert rekkevidde" : "Aktuell rekkevidde"}
              </p>
              <p className="text-xs text-slate-400">
                {totalReduction > 0 ? 
                  `${totalReduction} km reduksjon (${totalReductionPercent}%)` : 
                  "Ingen påvirkningsfaktorer aktive"
                }
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${totalReduction > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {adjustedRange} km <span className="text-green-400">({selectedCar.range})</span>
              </p>
              <p className="text-xs text-slate-400">
                {totalReduction > 0 ? "Med påvirkning" : "Optimal"}
              </p>
            </div>
          </div>
          
          {/* Visual Energy Loss Bar with Separate Colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Energitap</span>
              <span>{totalReductionPercent}%</span>
            </div>
            <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
              {/* Green bar (remaining efficiency) */}
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${remainingPercent}%` }}
              />
              {/* Orange bar (trailer impact) */}
              {trailerReductionPercent > 0 && (
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                  style={{ 
                    left: `${remainingPercent}%`,
                    width: `${trailerReductionPercent}%` 
                  }}
                />
              )}
              {/* Blue bar (weather impact) */}
              {weatherReductionPercent > 0 && (
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                  style={{ 
                    left: `${remainingPercent + trailerReductionPercent}%`,
                    width: `${weatherReductionPercent}%` 
                  }}
                />
              )}
              {/* Progress indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {remainingPercent}% effektiv
                </span>
              </div>
            </div>
            {/* Enhanced Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-400">Tilgjengelig ({remainingPercent}%)</span>
              </div>
              {trailerReductionPercent > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-slate-400">Henger ({trailerReductionPercent}%)</span>
                </div>
              )}
              {weatherReductionPercent > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-400">Vær ({weatherReductionPercent}%)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Impacts - only show when there are actual impacts */}
        {(routeData.trailerWeight > 0 || weatherData) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Trailer Impact */}
            {routeData.trailerWeight > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Henger</span>
                  <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/50">
                    {routeData.trailerWeight} kg
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {trailerImpact.factor < 1 ? (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  )}
                  <span className="text-xs text-slate-400">
                    -{Math.round((1 - trailerImpact.factor) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Weather Impact */}
            {weatherData && (
              <PremiumGate feature="weather-analysis">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Vær</span>
                    <div className="flex items-center gap-1">
                      {getWeatherIcon(weatherData.averageConditions?.condition || 'clear')}
                      <span className="text-xs text-blue-400">
                        {Math.round(weatherData.averageConditions?.temperature || 15)}°C
                      </span>
                      <Wind className="h-3 w-3 text-blue-400 ml-1" />
                      <span className="text-xs text-blue-400">
                        {Math.round((weatherData.averageConditions?.windSpeed || 0) / 3.6)} m/s
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {weatherImpact < 1 ? (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    )}
                    <span className="text-xs text-slate-400">
                      {weatherImpact < 1 ? '-' : '+'}{Math.abs(Math.round((1 - weatherImpact) * 100))}%
                    </span>
                  </div>
                </div>
              </PremiumGate>
            )}
          </div>
        )}

        {/* Loading/Error States */}
        {loading && (
          <div className="text-center py-2">
            <p className="text-xs text-blue-400">Henter værdata...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RouteImpact;