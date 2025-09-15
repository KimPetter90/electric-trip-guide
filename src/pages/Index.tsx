import React, { useState } from "react";
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
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

function Index() {
  const [selectedCar, setSelectedCar] = useState<CarModel | null>({
    id: "tesla-model-3",
    brand: "Tesla",
    model: "Model 3",
    batteryCapacity: 75,
    range: 448,
    consumption: 16.7,
    image: ""
  });
  const [routeData, setRouteData] = useState<RouteData>({
    from: "Oslo",
    to: "Bergen",
    via: "",
    trailerWeight: 0,
    batteryPercentage: 80,
    travelDate: undefined
  });
  const [showRoute, setShowRoute] = useState(true);
  const [routeTrigger, setRouteTrigger] = useState(0); // Trigger for manual route updates

  const handlePlanRoute = () => {
    console.log('🚀 Planlegger rute med data:', { selectedCar, routeData });
    if (selectedCar && routeData.from && routeData.to) {
      console.log('✅ Alle kriterier oppfylt, setter showRoute til true og trigger manuell oppdatering');
      setShowRoute(true);
      setRouteTrigger(prev => prev + 1); // Trigger manuell oppdatering
    } else {
      console.log('❌ Mangler data:', { 
        harValgtBil: !!selectedCar, 
        harFra: !!routeData.from, 
        harTil: !!routeData.to 
      });
    }
  };

  // Automatisk vis kartet når alle kriterier er oppfylt
  React.useEffect(() => {
    if (selectedCar && routeData.from && routeData.to) {
      setShowRoute(true);
    }
  }, [selectedCar, routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, routeData.trailerWeight]);

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Futuristisk animert bakgrunn */}
      <div className="fixed inset-0 opacity-30">
        <div 
          className="absolute inset-0 bg-gradient-cyber animate-circuit"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(140 100% 50% / 0.15) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, hsl(180 100% 50% / 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, hsl(280 100% 50% / 0.15) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
        {/* Cyberpunk grid overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%2300ff88' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
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
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-10 w-10 text-primary animate-glow-pulse" />
              <h1 className="text-5xl md:text-7xl font-orbitron font-black text-gradient animate-glow-pulse">
                ElRoute
              </h1>
              <Zap className="h-10 w-10 text-primary animate-glow-pulse" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-exo animate-float">
              Fremtidens intelligente ruteplanlegger for elektriske kjøretøy
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-primary/30 neon-glow">
                <Car className="h-5 w-5 text-primary animate-glow-pulse" />
                <span className="font-exo font-medium">Alle elbilmodeller</span>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-secondary/30 cyber-glow animation-delay-500">
                <Route className="h-5 w-5 text-secondary animate-glow-pulse" />
                <span className="font-exo font-medium">AI-optimalisering</span>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-accent/30 neon-glow animation-delay-1000">
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
            <div className="">
              <CarSelector 
                selectedCar={selectedCar}
                onCarSelect={setSelectedCar}
              />
            </div>
            
            <div className="">
              <RouteInput
                routeData={routeData}
                onRouteChange={setRouteData}
                onPlanRoute={handlePlanRoute}
              />
            </div>

            {selectedCar && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
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
              <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border shadow-lg">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4 animate-glow-pulse" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Klar for ruteplanlegging</h3>
                <p className="text-muted-foreground">
                  Velg bil og angi rute for å se det futuristiske ladestasjonkartet
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                <RouteMap 
                  isVisible={showRoute} 
                  routeData={routeData}
                  selectedCar={selectedCar}
                  routeTrigger={routeTrigger}
                />
                <ChargingMap isVisible={showRoute} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-card/60 backdrop-blur-sm border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            ElRoute - Fremtidens ruteplanlegging for elbiler i Norge
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Index;