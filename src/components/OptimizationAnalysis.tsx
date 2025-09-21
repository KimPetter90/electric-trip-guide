import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Wind, CloudRain, Truck, Battery, MapPin } from 'lucide-react';

interface OptimizationAnalysisProps {
  analysis: {
    weatherConditions: {
      temperature: number;
      windSpeed: number;
      precipitation: number;
      impact: string;
    };
    trailerImpact: {
      weight: number;
      impact: string;
    };
    batteryAnalysis: {
      currentLevel: number;
      adjustedRange: number;
      totalRouteDistance: number;
      chargingNeeded: boolean;
    };
    stationRanking: Array<{
      name: string;
      score: number;
      availability: string;
      cost: string;
      reason: string;
    }>;
  };
  isVisible: boolean;
}

const OptimizationAnalysis: React.FC<OptimizationAnalysisProps> = ({ analysis, isVisible }) => {
  if (!isVisible || !analysis) return null;

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ruteoptimalisering
          </CardTitle>
          <CardDescription>
            Basert på værforhold, hengerlast og batterinivå
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Værforhold */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Thermometer className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Temperatur</p>
                <p className="text-lg">{analysis.weatherConditions.temperature}°C</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Wind className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Vind</p>
                <p className="text-lg">{analysis.weatherConditions.windSpeed} m/s</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <CloudRain className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium">Nedbør</p>
                <p className="text-lg">{analysis.weatherConditions.precipitation} mm</p>
              </div>
            </div>
          </div>

          {/* Påvirkningsfaktorer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium">Hengerlast</h4>
              </div>
              <p className="text-sm text-gray-600">
                {analysis.trailerImpact.weight > 0 
                  ? `${analysis.trailerImpact.weight} kg - ${analysis.trailerImpact.impact}`
                  : 'Ingen henger'
                }
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Batteristatus</h4>
              </div>
              <p className="text-sm text-gray-600">
                {analysis.batteryAnalysis.currentLevel}% - Rekkevidde: {analysis.batteryAnalysis.adjustedRange} km
              </p>
              {analysis.batteryAnalysis.chargingNeeded && (
                <Badge variant="secondary" className="mt-1">
                  Lading nødvendig
                </Badge>
              )}
            </div>
          </div>

          {/* Værpåvirkning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-1">Værpåvirkning</h4>
            <p className="text-sm text-yellow-700">{analysis.weatherConditions.impact}</p>
          </div>

          {/* Topp 3 anbefalte stasjoner */}
          <div>
            <h4 className="font-medium mb-3">Anbefalte ladestasjoner</h4>
            <div className="space-y-2">
              {analysis.stationRanking.map((station, index) => (
                <div 
                  key={station.name} 
                  className={`p-3 border rounded-lg ${index === 0 ? 'bg-yellow-50 border-yellow-300' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {index === 0 && <span className="text-yellow-600">⭐</span>}
                        {station.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {station.availability} tilgjengelig • {station.cost}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          station.score > 80 ? "default" : 
                          station.score > 60 ? "secondary" : "outline"
                        }
                      >
                        {station.score}/100
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{station.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizationAnalysis;