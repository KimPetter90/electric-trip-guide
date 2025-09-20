import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MapPin, Zap, AlertTriangle } from "lucide-react";
import GoogleRouteMap from "@/components/GoogleRouteMap";
import { ShareRoute } from "@/components/ShareRoute";

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface EnhancedMapSectionProps {
  selectedCar: CarModel | null;
  routeData: RouteData;
  routeTrigger: number;
  mapLoading: boolean;
  mapError: string | null;
  onChargingStationUpdate: (station: any, showButton: boolean, optimizedStations?: any[]) => void;
  onRouteAnalysisUpdate: (analysis: any) => void;
  onMapLoad: (map: google.maps.Map) => void;
  onRouteCalculated: (analysis: any) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
  setRouteTrigger: (value: number | ((prev: number) => number)) => void;
}

export const EnhancedMapSection: React.FC<EnhancedMapSectionProps> = ({
  selectedCar,
  routeData,
  routeTrigger,
  mapLoading,
  mapError,
  onChargingStationUpdate,
  onRouteAnalysisUpdate,
  onMapLoad,
  onRouteCalculated,
  onLoadingChange,
  onError,
  setRouteTrigger
}) => {
  return (
    <div className="xl:col-span-3 space-y-6">
      <Card className="glass-card p-6 relative animate-card-reveal border-2 border-primary/10 hover:border-primary/30 transition-all duration-300" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <MapPin className="h-5 w-5 text-accent animate-pulse-neon" />
            </div>
            <h2 className="text-xl font-semibold text-gradient-static">
              Interaktivt kart
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="cyber"
              size="sm"
              onClick={() => setRouteTrigger(prev => prev + 1)}
              disabled={!selectedCar || !routeData.from || !routeData.to}
              className="font-medium"
            >
              <Zap className="h-4 w-4 mr-2" />
              Oppdater kart
            </Button>
            <ShareRoute routeData={routeData} />
          </div>
        </div>

        {/* Loading State */}
        {mapLoading && (
          <div className="absolute inset-0 glass-card rounded-xl flex items-center justify-center z-10">
            <LoadingSpinner 
              variant="neon" 
              size="lg" 
              text="Laster kart og beregner rute..." 
            />
          </div>
        )}

        {/* Error State */}
        {mapError && (
          <div className="absolute inset-0 glass-card rounded-xl flex items-center justify-center z-10">
            <div className="text-center p-6">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4 animate-bounce-soft" />
              <h3 className="text-lg font-semibold mb-2">Kartfeil</h3>
              <p className="text-muted-foreground mb-4">{mapError}</p>
              <Button 
                variant="outline" 
                onClick={() => setRouteTrigger(prev => prev + 1)}
                className="hover-scale"
              >
                Prøv igjen
              </Button>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative bg-muted/20 rounded-lg overflow-hidden border border-primary/10 h-96">
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
            <p className="text-muted-foreground">Kartkomponent vil vises her</p>
          </div>
        </div>
      </Card>
    </div>
  );
};