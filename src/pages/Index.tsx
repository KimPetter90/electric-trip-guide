import React, { useState, useEffect } from "react";
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
  const { user, subscription, favoriteCar, signOut, loading, refreshSubscription } = useAuth();
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

  // Auto-select favorite car when user logs in
  useEffect(() => {
    if (user && favoriteCar && !selectedCar) {
      const favoriteCarModel: CarModel = {
        id: favoriteCar.car_id,
        brand: favoriteCar.car_brand,
        model: favoriteCar.car_model,
        batteryCapacity: favoriteCar.battery_capacity,
        range: favoriteCar.range_km,
        consumption: favoriteCar.consumption,
        image: favoriteCar.car_image || '/placeholder.svg'
      };
      setSelectedCar(favoriteCarModel);
      toast({
        title: "Favorittbil lastet",
        description: `${favoriteCar.car_brand} ${favoriteCar.car_model} er valgt automatisk`,
      });
    }
  }, [user, favoriteCar, selectedCar, toast]);
  
  // Funksjon for å nullstille rutevalg når rute-input endres
  const handleRouteDataChange = () => {
    console.log('🔄 Route data endret, nullstiller rutevalg');
    if (routeOptions.length > 0) {
      setRouteOptions([]);
      setSelectedRouteId(null);
      setShowRoute(false);
    }
  };
  
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
        distance: 456,
        duration: 420, // minutter
        chargingStops: 2,
        estimatedCost: 280,
        description: 'Tar hovedveier og motorveier. Færrest ladestoppene, men litt lengre distanse.',
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
      
      toast({
        title: "Manglende informasjon",
        description: "Velg bil og skriv inn start- og sluttsted for å planlegge rute.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-electric animate-glow-pulse">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-orbitron font-bold text-gradient animate-glow-pulse">
                ElRoute
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Badge variant="outline" className="font-orbitron">
                    {subscription?.subscription_status || 'Laster...'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="font-orbitron"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Oppgrader
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="font-orbitron"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logg ut
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-electric text-primary-foreground hover:shadow-neon font-orbitron"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed opacity-20" 
             style={{ backgroundImage: `url(${futuristicBg})` }} />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-orbitron font-bold text-gradient mb-6 animate-glow-pulse">
            Fremtidens ruteplanlegger
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Avansert ruteplanlegging for elbiler med AI-optimerte ladestasjoner, 
            værdata og kostnadsberegning
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 glass-card neon-glow border-primary/30 animate-fade-up">
              <Zap className="h-10 w-10 mx-auto mb-4 text-primary animate-glow-pulse" />
              <h3 className="text-lg font-orbitron font-bold mb-2">Smart lading</h3>
              <p className="text-sm text-muted-foreground">
                AI finner de beste ladestasjonene på ruten din
              </p>
            </Card>
            
            <Card className="p-6 glass-card neon-glow border-primary/30 animate-fade-up [animation-delay:200ms]">
              <Route className="h-10 w-10 mx-auto mb-4 text-primary animate-glow-pulse" />
              <h3 className="text-lg font-orbitron font-bold mb-2">Optimerte ruter</h3>
              <p className="text-sm text-muted-foreground">
                Flere rutealternativer basert på dine preferanser
              </p>
            </Card>
            
            <Card className="p-6 glass-card neon-glow border-primary/30 animate-fade-up [animation-delay:400ms]">
              <MapPin className="h-10 w-10 mx-auto mb-4 text-primary animate-glow-pulse" />
              <h3 className="text-lg font-orbitron font-bold mb-2">Sanntidsdata</h3>
              <p className="text-sm text-muted-foreground">
                Værdata, trafikk og tilgjengelighet på ladestasjoner
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
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
                  onRouteDataChange={handleRouteDataChange}
                />
              </div>

              {selectedCar && (
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
                  <h4 className="font-semibold mb-2 text-primary">Valgt bil:</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedCar.image}</span>
                    <div>
                      <p className="font-medium">{selectedCar.brand} {selectedCar.model}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{selectedCar.batteryCapacity} kWh</span>
                        <span>{selectedCar.range} km rekkevidde</span>
                        <span>{selectedCar.consumption} kWh/100km</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Route Options */}
              {routeOptions.length > 0 && (
                <RouteSelector
                  routes={routeOptions}
                  selectedRoute={selectedRouteId}
                  onRouteSelect={handleRouteSelect}
                  isLoading={loadingRoutes}
                />
              )}
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {showRoute && selectedCar && routeData.from && routeData.to ? (
              <RouteMap 
                isVisible={true}
                routeData={routeData}
                selectedCar={selectedCar}
                routeTrigger={routeTrigger}
                selectedRouteId={selectedRouteId}
                onChargingStationUpdate={handleChargingStationUpdate}
                onRouteAnalysisUpdate={handleRouteAnalysisUpdate}
              />
            ) : (
              <ChargingMap isVisible={true} />
            )}

            {routeAnalysis && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
                <h4 className="font-semibold mb-3 text-primary">Ruteanalyse</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total avstand:</span>
                    <span className="font-medium">{Math.round(routeAnalysis.totalDistance)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reisetid:</span>
                    <span className="font-medium">{Math.round(routeAnalysis.totalTime / 60)} t {routeAnalysis.totalTime % 60} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ladetid:</span>
                    <span className="font-medium">{Math.round(routeAnalysis.chargingTime)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimerte kostnader:</span>
                    <span className="font-medium">{Math.round(routeAnalysis.totalCost)} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CO₂ spart:</span>
                    <span className="font-medium text-green-500">{Math.round(routeAnalysis.co2Saved)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effektivitet:</span>
                    <span className="font-medium">{routeAnalysis.efficiency.toFixed(1)} kWh/100km</span>
                  </div>
                </div>
              </Card>
            )}

            {showChargingButton && currentChargingStation && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
                <h4 className="font-semibold mb-3 text-primary">Ladestasjon</h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{currentChargingStation.name}</p>
                  <p className="text-muted-foreground">{currentChargingStation.location}</p>
                  <div className="flex justify-between">
                    <span>Effekt:</span>
                    <span className="font-medium">{currentChargingStation.power}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tilgjengelig:</span>
                    <span className="font-medium">{currentChargingStation.available}/{currentChargingStation.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pris:</span>
                    <span className="font-medium">{currentChargingStation.cost} kr/kWh</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-orbitron font-bold text-lg">ElRoute</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Norges mest avanserte ruteplanlegger for elbiler
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Tjenester</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Ruteplanlegging</p>
                <p>Ladestasjon-søk</p>
                <p>Værprognoser</p>
                <p>Kostnadskalkulatorer</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Juridisk</h4>
              <div className="space-y-1 text-sm">
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy')}>
                  Personvernerklæring
                </Button>
                <br />
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/terms')}>
                  Vilkår og betingelser
                </Button>
                {user && (
                  <>
                    <br />
                    <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/test-user-admin')}>
                      Testbruker admin
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Kontakt</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Elroutesup@gmail.com</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ElRoute. Alle rettigheter forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;