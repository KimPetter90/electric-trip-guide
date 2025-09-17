import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Thermometer, Wind, Car, Battery, TrendingUp, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
}

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fastCharger: boolean;
  power: string;
  cost: number;
  distanceFromRoute?: number;
  distanceAlongRoute?: number;
  arrivalBatteryPercentage?: number;
  isRequired?: boolean;
  chargingTime?: number;
  targetBatteryPercentage?: number;
}

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel | null;
  routeTrigger: number;
  selectedRouteId: string | null;
  onChargingStationUpdate: (station: any, showButton: boolean, optimizedStations?: any[]) => void;
  onRouteAnalysisUpdate: (analysis: any) => void;
}

interface TripAnalysis {
  totalDistance: number;
  totalTime: number;
  totalChargingTime: number;
  totalCost: number;
  batteryUsage: number;
  requiredStops: number;
  weatherImpact: string;
  routeEfficiency: string;
}

// Map component wrapper
const MapComponent: React.FC<{
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapLoad: (map: google.maps.Map) => void;
  chargingStations: ChargingStation[];
}> = ({ center, zoom, onMapLoad, chargingStations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      mapInstanceRef.current = map;
      onMapLoad(map);
    }
  }, [center, zoom, onMapLoad]);

  // Add charging station markers
  useEffect(() => {
    if (mapInstanceRef.current && chargingStations.length > 0) {
      console.log('🔌 Adding', chargingStations.length, 'charging station markers');
      
      chargingStations.forEach(station => {
        const marker = new google.maps.Marker({
          position: { lat: station.latitude, lng: station.longitude },
          map: mapInstanceRef.current,
          title: station.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10b981" stroke="#059669" stroke-width="2"/>
                <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
          }
        });

        // Add click listener for charging modal
        marker.addListener('click', () => {
          if ((window as any).openChargingModal) {
            (window as any).openChargingModal(
              station.id, 
              station.name, 
              station.distanceFromRoute || 0, 
              70 // default arrival battery
            );
          }
        });
      });
    }
  }, [chargingStations]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

// Fetch charging stations from Supabase
const fetchNorwegianChargingStations = async (): Promise<ChargingStation[]> => {
  console.log('🔌 Fetching charging stations from Supabase...');
  
  const { data: stations, error } = await supabase
    .from('charging_stations')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Error fetching charging stations:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!stations || stations.length === 0) {
    console.warn('⚠️ No charging stations found in database');
    return [];
  }

  return stations.map(station => ({
    id: station.id,
    name: station.name,
    location: station.location || station.address || 'Ukjent lokasjon',
    latitude: parseFloat(station.latitude.toString()),
    longitude: parseFloat(station.longitude.toString()),
    available: station.available || 0,
    total: station.total || 6,
    fastCharger: station.fast_charger !== false,
    power: station.power || '150 kW',
    cost: parseFloat(station.cost?.toString() || '4.50'),
  }));
};

const GoogleRouteMap: React.FC<RouteMapProps> = ({ 
  isVisible, 
  routeData, 
  selectedCar, 
  routeTrigger, 
  selectedRouteId, 
  onChargingStationUpdate, 
  onRouteAnalysisUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [chargingModal, setChargingModal] = useState({
    isOpen: false,
    stationId: '',
    stationName: '',
    distance: 0,
    arrivalBattery: 70,
    targetBattery: 90,
  });
  const { toast } = useToast();

  // Set up global charging modal function
  useEffect(() => {
    (window as any).openChargingModal = (stationId: string, stationName: string, distance: number, arrivalBattery: number) => {
      console.log('🔧 Opening charging modal for station:', stationName);
      setChargingModal({
        isOpen: true,
        stationId,
        stationName,
        distance,
        arrivalBattery,
        targetBattery: 90,
      });
    };

    return () => {
      delete (window as any).openChargingModal;
    };
  }, []);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('🔑 Fetching Google Maps API key...');
        const { data, error } = await supabase.functions.invoke('google-maps-proxy');
        if (error) {
          console.error('❌ Google Maps API key error:', error);
          throw error;
        }
        console.log('✅ Google Maps API key fetched successfully');
        setApiKey(data.apiKey);
      } catch (error) {
        console.error('❌ Error fetching Google Maps API key:', error);
        setError('Kunne ikke hente Google Maps API-nøkkel');
      }
    };

    fetchApiKey();
  }, []);

  // Load charging stations
  useEffect(() => {
    console.log('🔌 useEffect for ladestasjoner starter...');
    const loadChargingStations = async () => {
      try {
        console.log('🚀 Starter lasting av ladestasjoner...');
        console.log('🔌 GoogleRouteMap: Henter ladestasjoner fra database...');
        const stations = await fetchNorwegianChargingStations();
        console.log('📋 Leste', stations.length, 'stasjoner fra database');
        console.log('✅ GoogleRouteMap: Hentet', stations.length, 'ladestasjoner fra database');
        
        if (stations.length > 0) {
          console.log('📊 GoogleRouteMap: Første 3 stasjoner:', stations.slice(0, 3).map(s => s.name));
          console.log('🔄 GoogleRouteMap: Konverterte', stations.length, 'stasjoner til intern format');
        }
        
        setChargingStations(stations);
        console.log('✅ Ladestasjoner satt i state:', stations.length);
      } catch (error) {
        console.error('❌ Feil ved lasting av ladestasjoner:', error);
        setError('Kunne ikke laste ladestasjoner');
      }
    };

    loadChargingStations();
  }, []);

  // Initialize Google Maps services when map loads
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log('🗺️ Google Maps loaded successfully');
    setMapInstance(map);
    
    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      draggable: false,
      suppressMarkers: false,
    });
    renderer.setMap(map);
    
    setDirectionsService(service);
    setDirectionsRenderer(renderer);
  }, []);

  // Calculate route when trigger changes
  useEffect(() => {
    const calculateRoute = async () => {
      if (!mapInstance || !directionsService || !directionsRenderer || !routeData.from || !routeData.to || !selectedCar) {
        console.log('⏸️ Mangler requirements for ruteberegning');
        return;
      }

      console.log('🚀 STARTER GOOGLE MAPS RUTEPLANLEGGING');
      console.log('📍 Fra:', routeData.from, 'Til:', routeData.to);
      
      setLoading(true);
      setError(null);

      try {
        const request: google.maps.DirectionsRequest = {
          origin: routeData.from,
          destination: routeData.to,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'NO',
        };

        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            console.log('✅ Google Maps rute beregnet');
            directionsRenderer.setDirections(result);
            
            // Extract route information
            const route = result.routes[0];
            const leg = route.legs[0];
            
            // Create trip analysis
            const analysis: TripAnalysis = {
              totalDistance: leg.distance?.value ? leg.distance.value / 1000 : 0, // Convert to km
              totalTime: leg.duration?.value ? leg.duration.value / 60 : 0, // Convert to minutes
              totalChargingTime: 30, // Estimate
              totalCost: 100, // Estimate
              batteryUsage: 50, // Estimate based on car
              requiredStops: 1, // Estimate
              weatherImpact: 'Normalt',
              routeEfficiency: 'God',
            };

            onRouteAnalysisUpdate(analysis);
            
            toast({
              title: "✅ Rute beregnet",
              description: `${leg.distance?.text} - ${leg.duration?.text}`,
            });
          } else {
            console.error('❌ Google Maps rute feil:', status);
            setError(`Kunne ikke beregne rute: ${status}`);
            toast({
              title: "❌ Rutefeil",
              description: "Kunne ikke beregne rute. Prøv andre destinasjoner.",
              variant: "destructive",
            });
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('❌ Feil ved ruteberegning:', error);
        setError('Feil ved ruteberegning');
        setLoading(false);
      }
    };

    if (routeTrigger > 0) {
      calculateRoute();
    }
  }, [routeTrigger, mapInstance, directionsService, directionsRenderer, routeData, selectedCar, onRouteAnalysisUpdate, toast]);

  // Render loading state
  const renderLoadingMap = () => (
    <div className="w-full h-96 bg-muted/20 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Laster Google Maps...</p>
      </div>
    </div>
  );

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Don't render if not visible
  if (!isVisible) {
    console.log('🚫 GoogleRouteMap ikke synlig - isVisible:', isVisible);
    return null;
  }

  console.log('✅ GoogleRouteMap rendrer - isVisible:', isVisible, 'hasApiKey:', !!apiKey, 'loading:', loading);

  return (
    <div data-testid="route-map" className="space-y-6">
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary animate-glow-pulse" />
        <h2 className="text-xl font-semibold">Google Maps Ruteplanlegger</h2>
        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />}
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            {!apiKey ? (
              renderLoadingMap()
            ) : (
              <Wrapper apiKey={apiKey} render={renderLoadingMap}>
                <MapComponent
                  center={{ lat: 60.472, lng: 8.4689 }} // Norway center
                  zoom={6}
                  onMapLoad={handleMapLoad}
                  chargingStations={chargingStations}
                />
              </Wrapper>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm text-muted-foreground">Beregner rute...</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>Ladestasjoner: {chargingStations.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-blue-500" />
              <span>Google Maps</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Optimalisert rute</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Charging Modal */}
      <Dialog open={chargingModal.isOpen} onOpenChange={(open) => setChargingModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚡ Lading ved {chargingModal.stationName}</DialogTitle>
            <DialogDescription>
              Planlegg lading ved denne stasjonen. Avstand fra rute: {chargingModal.distance.toFixed(1)} km
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ankomst batteri: {chargingModal.arrivalBattery}%</label>
              <Progress value={chargingModal.arrivalBattery} className="mt-2" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Ønsket batteri etter lading: {chargingModal.targetBattery}%</label>
              <Slider
                value={[chargingModal.targetBattery]}
                onValueChange={(value) => setChargingModal(prev => ({ ...prev, targetBattery: value[0] }))}
                max={100}
                min={chargingModal.arrivalBattery}
                step={5}
                className="mt-2"
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p>Estimert ladetid: {Math.max(5, (chargingModal.targetBattery - chargingModal.arrivalBattery) * 0.5)} min</p>
              <p>Estimert kostnad: {((chargingModal.targetBattery - chargingModal.arrivalBattery) * 2.5).toFixed(0)} kr</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargingModal(prev => ({ ...prev, isOpen: false }))}>
              Avbryt
            </Button>
            <Button onClick={() => {
              toast({
                title: "✅ Lading planlagt",
                description: `Lading ved ${chargingModal.stationName} lagt til ruten`,
              });
              setChargingModal(prev => ({ ...prev, isOpen: false }));
            }}>
              Legg til lading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoogleRouteMap;