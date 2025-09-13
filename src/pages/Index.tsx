import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CarSelector from "@/components/CarSelector";
import RouteInput from "@/components/RouteInput";
import ChargingMap from "@/components/ChargingMap";
import { Zap, Route, MapPin, Car } from "lucide-react";
import heroImage from "@/assets/ev-hero.jpg";

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
  trailerWeight: number;
}

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    from: "",
    to: "",
    trailerWeight: 0
  });
  const [showRoute, setShowRoute] = useState(false);

  const handlePlanRoute = () => {
    if (selectedCar && routeData.from && routeData.to) {
      setShowRoute(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-8 w-8 text-primary-foreground" />
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground">
                ElRoute
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Intelligent ruteplanlegging for elbiler med automatisk ladestasjon-mapping
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <span>Alle elbilmodeller</span>
              </div>
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                <span>Smart ruteoptimalisering</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Sanntids ladestasjondata</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-8">
            <CarSelector 
              selectedCar={selectedCar}
              onCarSelect={setSelectedCar}
            />
            
            <RouteInput
              routeData={routeData}
              onRouteChange={setRouteData}
              onPlanRoute={handlePlanRoute}
            />

            {selectedCar && (
              <Card className="p-4 bg-accent/50">
                <h4 className="font-semibold mb-2">Valgt bil:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCar.brand} {selectedCar.model} - {selectedCar.batteryCapacity} kWh, {selectedCar.range} km rekkevidde
                </p>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-8">
            {!showRoute ? (
              <Card className="p-8 text-center bg-glass-bg backdrop-blur-sm border-glass-border">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Klar for ruteplanlegging</h3>
                <p className="text-muted-foreground">
                  Velg bil og angi rute for å se ladestasjonkartet
                </p>
              </Card>
            ) : (
              <ChargingMap isVisible={showRoute} />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            ElRoute - Smart ruteplanlegging for elbiler i Norge
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;