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

  const getWeatherIcon = (condition: string) => {
    const iconClass = "h-4 w-4";
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
    if (!routeData.from || !routeData.to || !routeData.travelDate) return;

    setLoading(true);
    setError(null);

    try {
      const startCoords = getCoordinates(routeData.from);
      const endCoords = getCoordinates(routeData.to);

      if (!startCoords || !endCoords) {
        throw new Error('Kunne ikke finne koordinater for valgte steder');
      }

      const { data, error } = await supabase.functions.invoke('weather-service', {
        body: {
          startLat: startCoords[0],
          startLng: startCoords[1],
          endLat: endCoords[0],
          endLng: endCoords[1],
          travelDate: routeData.travelDate.toISOString()
        }
      });

      if (error) throw error;
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Feil ved henting av værdata');
    } finally {
      setLoading(false);
    }
  };

  const getCoordinates = (cityName: string): [number, number] | null => {
    const coords: { [key: string]: [number, number] } = {
      'oslo': [59.9139, 10.7522],
      'bergen': [60.3913, 5.3221],
      'trondheim': [63.4305, 10.3951],
      'stavanger': [58.9700, 5.7331],
      'kristiansand': [58.1467, 7.9956],
      'ålesund': [62.4722, 6.1495],
      'tromsø': [69.6492, 18.9553],
      'bodø': [67.2804, 14.4049],
      'drammen': [59.7439, 10.2045]
    };

    const cityKey = cityName.toLowerCase().split(' ')[0].split('(')[0];
    return coords[cityKey] || null;
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

  const hasAnyImpact = routeData.trailerWeight > 0 || weatherData;

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2">
          <Cloud className="h-5 w-5 text-primary animate-glow-pulse" />
          <Truck className="h-5 w-5 text-primary animate-glow-pulse" />
        </div>
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Påvirkningsanalyse</h3>
        
        {routeData.from && routeData.to && routeData.travelDate && (
          <Button
            onClick={fetchWeatherData}
            disabled={loading}
            size="sm"
            variant="outline"
            className="text-xs ml-auto"
          >
            {loading ? "Henter..." : "Oppdater vær"}
          </Button>
        )}
      </div>

      {!hasAnyImpact ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-2">Ingen påvirkningsfaktorer aktive</p>
          <p className="text-xs text-slate-500">
            Legg til hengervekt eller velg reisedato for væranalyse
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Combined Impact Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div>
              <p className="text-sm text-slate-300">Total påvirkning</p>
              <p className="text-xs text-slate-400">
                {totalReduction} km reduksjon ({totalReductionPercent}%)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-200">{adjustedRange} km</p>
              <p className="text-xs text-slate-400">Justert rekkevidde</p>
            </div>
          </div>

          {/* Individual Impacts */}
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
                      {getWeatherIcon(weatherData.averageConditions.condition)}
                      <span className="text-xs text-blue-400">
                        {Math.round(weatherData.averageConditions.temperature)}°C
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
      )}
    </Card>
  );
};

export default RouteImpact;