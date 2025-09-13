import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CarSelector from "@/components/CarSelector";
import RouteInput from "@/components/RouteInput";
import ChargingMap from "@/components/ChargingMap";
import RouteMap from "@/components/RouteMap";
import { Zap, Route, MapPin, Car } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Circuit Background */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 animate-circuit"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(140 100% 45% / 0.1) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, hsl(180 100% 45% / 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, hsl(220 100% 45% / 0.1) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${futuristicBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-85" />
        
        {/* Floating Energy Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-4 h-4 bg-primary rounded-full animate-float shadow-neon"></div>
          <div className="absolute top-40 right-1/3 w-3 h-3 bg-secondary rounded-full animate-float animation-delay-1000 shadow-glow"></div>
          <div className="absolute bottom-40 left-1/3 w-5 h-5 bg-accent rounded-full animate-float animation-delay-2000 shadow-neon"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6 animate-glow-pulse">
              <Zap className="h-8 w-8 text-primary animate-pulse-neon" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground bg-gradient-neon bg-clip-text text-transparent">
                ElRoute
              </h1>
              <Zap className="h-8 w-8 text-primary animate-pulse-neon" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-float">
              Intelligent ruteplanlegging for fremtidens elbiler
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 bg-glass-bg backdrop-blur-sm rounded-full px-4 py-2 border border-glass-border animate-pulse-neon">
                <Car className="h-5 w-5 text-primary" />
                <span>Alle elbilmodeller</span>
              </div>
              <div className="flex items-center gap-2 bg-glass-bg backdrop-blur-sm rounded-full px-4 py-2 border border-glass-border animate-pulse-neon animation-delay-500">
                <Route className="h-5 w-5 text-secondary" />
                <span>AI-optimalisering</span>
              </div>
              <div className="flex items-center gap-2 bg-glass-bg backdrop-blur-sm rounded-full px-4 py-2 border border-glass-border animate-pulse-neon animation-delay-1000">
                <MapPin className="h-5 w-5 text-accent" />
                <span>Sanntids data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-8">
            <div className="animate-float">
              <CarSelector 
                selectedCar={selectedCar}
                onCarSelect={setSelectedCar}
              />
            </div>
            
            <div className="animate-float animation-delay-500">
              <RouteInput
                routeData={routeData}
                onRouteChange={setRouteData}
                onPlanRoute={handlePlanRoute}
              />
            </div>

            {selectedCar && (
              <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border shadow-electric animate-pulse-neon">
                <h4 className="font-semibold mb-2 text-primary">Valgt bil:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCar.brand} {selectedCar.model} - {selectedCar.batteryCapacity} kWh, {selectedCar.range} km rekkevidde
                </p>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-8">
            {!showRoute ? (
              <Card className="p-8 text-center bg-glass-bg backdrop-blur-sm border-glass-border shadow-glow animate-float">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4 animate-glow-pulse" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Klar for ruteplanlegging</h3>
                <p className="text-muted-foreground">
                  Velg bil og angi rute for å se det futuristiske ladestasjonkartet
                </p>
              </Card>
            ) : (
              <div className="space-y-6 animate-float animation-delay-300">
                <RouteMap isVisible={showRoute} />
                <ChargingMap isVisible={showRoute} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-glass-bg backdrop-blur-sm border-t border-glass-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            ElRoute - Fremtidens ruteplanlegging for elbiler i Norge
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;