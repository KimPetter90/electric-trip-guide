import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CarSelector from "@/components/CarSelector";
import RouteInput from "@/components/RouteInput";
import RouteSelector from "@/components/RouteSelector";
import ChargingMap from "@/components/ChargingMap";
import RouteMap from "@/components/RouteMap";
import { Zap, Route, MapPin, Car, Battery, LogIn, User, CreditCard, LogOut, AlertTriangle } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";
import { type RouteOption } from "@/components/RouteSelector";

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

interface RouteAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather?: any;
}

function Index() {
  const { user, subscription, signOut, loading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    from: "",
    to: "",
    via: "",
    trailerWeight: 0,
    batteryPercentage: 0,
    travelDate: undefined
  });
  const [showRoute, setShowRoute] = useState(false);
  const [routeTrigger, setRouteTrigger] = useState(0); // Trigger for manual route updates
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  
  // Ladestasjon state for å vise ladeknapp
  const [showChargingButton, setShowChargingButton] = useState(false);
  const [currentChargingStation, setCurrentChargingStation] = useState<any>(null);
  const [chargingProgress, setChargingProgress] = useState(0);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<any[]>([]);

  
  // Funksjon for å motta ladestasjon data fra RouteMap
  const handleChargingStationUpdate = (station: any, showButton: boolean, optimizedStations?: any[]) => {
    console.log('🔋 INDEX: Mottatt ladestasjon oppdatering:', station?.name, 'show:', showButton);
    console.log('🔋 INDEX: Mottatt optimizedStations:', optimizedStations);
    setCurrentChargingStation(station);
    setShowChargingButton(showButton);
    if (optimizedStations) {
      console.log('🔋 INDEX: Setter optimizedStations til:', optimizedStations);
      setOptimizedStations(optimizedStations);
    }
  };
  
  // Funksjon for å motta routeAnalysis fra RouteMap
  const handleRouteAnalysisUpdate = (analysis: RouteAnalysis | null) => {
    console.log('📊 INDEX: Mottatt routeAnalysis:', analysis);
    setRouteAnalysis(analysis);
  };
  // Generer rutevalg når ruten planlegges
  const generateRouteOptions = async () => {
    if (!selectedCar || !routeData.from || !routeData.to) return;

    setLoadingRoutes(true);
    console.log('🚀 Genererer rutevalg...');

    // Simuler API-kall for å hente 3 forskjellige ruter
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockRoutes: RouteOption[] = [
      {
        id: 'fastest',
        name: 'Raskeste rute',
        distance: 463,
        duration: 420, // minutter
        chargingStops: 2,
        estimatedCost: 280,
        description: 'Hovedveier og motorveier. Minimale stopp, men mer kostbare ladestasjoner.',
        routeType: 'fastest'
      },
      {
        id: 'shortest',
        name: 'Korteste rute',
        distance: 441,
        duration: 465, // minutter
        chargingStops: 1,
        estimatedCost: 240,
        description: 'Direkteste vei mellom destinasjonene. Noen mindre veier, men kortere avstand.',
        routeType: 'shortest'
      },
      {
        id: 'eco',
        name: 'Miljøvennlig rute',
        distance: 478,
        duration: 485, // minutter
        chargingStops: 3,
        estimatedCost: 195,
        description: 'Optimalisert for lavest energiforbruk. Bruker rimelige ladestasjoner med fornybar energi.',
        routeType: 'eco'
      }
    ];

    setRouteOptions(mockRoutes);
    setSelectedRouteId('fastest'); // Velg raskeste som standard
    setLoadingRoutes(false);
    console.log('✅ Rutevalg generert, default valgt: fastest');
  };

  const handleRouteSelect = (routeId: string) => {
    console.log('🎯 Index.tsx: Nytt rutevalg mottatt:', routeId);
    setSelectedRouteId(routeId);
    console.log('🔄 Index.tsx: selectedRouteId oppdatert til:', routeId);
  };

  const handlePlanRoute = async () => {
    console.log('🚀 Planlegger rute med data:', { selectedCar, routeData });
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Logg inn for å planlegge ruter",
        description: "Du må være innlogget for å bruke ruteplanleggeren.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check route limits
    if (subscription && subscription.route_limit !== -1 && subscription.route_count >= subscription.route_limit) {
      toast({
        title: "Rutegrense nådd",
        description: `Du har brukt opp alle dine ${subscription.route_limit} ruter for denne måneden. Oppgrader for flere ruter.`,
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }
    
    if (selectedCar && routeData.from && routeData.to) {
      console.log('✅ Alle kriterier oppfylt, setter showRoute til true og trigger manuell oppdatering');
      
        // Increment route count if user is authenticated
        if (user && subscription) {
          try {
            await supabase.rpc('increment_route_count', { user_uuid: user.id });
            // Refresh subscription to update count
            setTimeout(() => {
              refreshSubscription();
            }, 100);
          } catch (error) {
            console.error('Error incrementing route count:', error);
          }
        }
      
      setShowRoute(true);
      setRouteTrigger(prev => prev + 1); // Trigger manuell oppdatering
      generateRouteOptions(); // Generer rutevalg
      
      toast({
        title: "Rute planlagt!",
        description: subscription ? `Ruter brukt: ${subscription.route_count + 1} / ${subscription.route_limit === -1 ? '∞' : subscription.route_limit}` : "Gratis rute planlagt",
      });
    } else {
      console.log('❌ Mangler data:', { 
        harValgtBil: !!selectedCar, 
        harFra: !!routeData.from, 
        harTil: !!routeData.to 
      });
    }
  };

  // Vis kartet kun når "Planlegg rute" trykkes - ikke automatisk
  // (Fjernet automatisk visning)

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut.",
      });
    } catch (error) {
      toast({
        title: "Feil ved utlogging",
        description: "Noe gikk galt.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Header with Auth */}
      <header className="relative z-50 border-b border-border/20 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                ElRoute
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {subscription?.subscription_status === 'free' ? 'Oppgrader' : 'Abonnement'}
                  </Button>
                  
                  {subscription && (
                    <Badge variant={subscription.subscription_status === 'free' ? 'secondary' : 'default'}>
                      {subscription.subscription_status === 'free' && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {subscription.route_count} / {subscription.route_limit === -1 ? '∞' : subscription.route_limit} ruter
                    </Badge>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

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
              Smart ruteplanlegging for mer effektiv elbilkjøring
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
                <RouteSelector
                  routes={routeOptions}
                  selectedRoute={selectedRouteId}
                  onRouteSelect={handleRouteSelect}
                  isLoading={loadingRoutes}
                />
                
                <RouteMap 
                  isVisible={showRoute} 
                  routeData={routeData}
                  selectedCar={selectedCar}
                  routeTrigger={routeTrigger}
                  selectedRouteId={selectedRouteId}
                  onChargingStationUpdate={handleChargingStationUpdate}
                  onRouteAnalysisUpdate={handleRouteAnalysisUpdate}
                />
                
                {/* Fjernet kritisk batterinivå-seksjonen */}
                
                
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