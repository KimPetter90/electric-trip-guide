import React from "react";
import { Card } from "@/components/ui/card";
import { Car, Route, Zap } from "lucide-react";
import CarSelector from "@/components/CarSelector";
import RouteInput from "@/components/RouteInput";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

interface EnhancedRouteInputProps {
  selectedCar: CarModel | null;
  setSelectedCar: (car: CarModel | null) => void;
  routeData: RouteData;
  setRouteData: (data: RouteData) => void;
  generateRouteOptions: () => Promise<void>;
}

export const EnhancedRouteInput: React.FC<EnhancedRouteInputProps> = ({
  selectedCar,
  setSelectedCar,
  routeData,
  setRouteData,
  generateRouteOptions
}) => {
  return (
    <div className="xl:col-span-1 space-y-6">
      <Card className="glass-card p-6 animate-card-reveal border-2 border-primary/10 hover:border-primary/30 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Car className="h-5 w-5 text-primary animate-bounce-soft" />
          </div>
          <h2 className="text-xl font-semibold text-gradient-static">
            Velg bil
          </h2>
        </div>
        <CarSelector selectedCar={selectedCar} onCarSelect={setSelectedCar} />
      </Card>

      <Card className="glass-card p-6 animate-card-reveal border-2 border-primary/10 hover:border-primary/30 transition-all duration-300" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Route className="h-5 w-5 text-secondary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gradient-static">
            Planlegg rute
          </h2>
        </div>
        <RouteInput 
          routeData={routeData}
          onRouteChange={setRouteData}
          onPlanRoute={generateRouteOptions}
          isPlanning={false}
        />
      </Card>
    </div>
  );
};