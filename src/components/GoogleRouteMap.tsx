import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Zap, Clock, DollarSign, MapPin, AlertCircle, Route, Navigation } from "lucide-react";
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
  routeData: RouteData;
  selectedCar: CarModel | null;
  routeTrigger: number;
  onRouteCalculated: (analysis: TripAnalysis) => void;
}> = ({ center, zoom, onMapLoad, chargingStations, routeData, selectedCar, routeTrigger, onRouteCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      console.log('🗺️ Initialiserer Google Maps...');
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      
      mapInstanceRef.current = map;
      
      // Initialize directions service and renderer
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      directionsRendererRef.current.setMap(map);
      
      onMapLoad(map);
      console.log('✅ Google Maps initialisert');
    }
  }, [center, zoom, onMapLoad]);

  // Add charging station markers
  useEffect(() => {
    if (mapInstanceRef.current && chargingStations.length > 0) {
      console.log('🔌 Legger til', chargingStations.length, 'ladestasjoner');
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      chargingStations.forEach(station => {
        const marker = new google.maps.Marker({
          position: { lat: station.latitude, lng: station.longitude },
          map: mapInstanceRef.current,
          title: station.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#059669',
            strokeWeight: 2,
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${station.name}</h3>
              <p style="margin: 4px 0; font-size: 12px;">📍 ${station.location}</p>
              <p style="margin: 4px 0; font-size: 12px;">⚡ ${station.power}</p>
              <p style="margin: 4px 0; font-size: 12px;">💰 ${station.cost} kr/kWh</p>
              <p style="margin: 4px 0; font-size: 12px;">🔌 ${station.available}/${station.total} tilgjengelig</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          if ((window as any).openChargingModal) {
            (window as any).openChargingModal(
              station.id, 
              station.name, 
              station.distanceFromRoute || 0, 
              70 // default arrival battery
            );
          }
        });

        markersRef.current.push(marker);
      });
    }
  }, [chargingStations]);

  // Calculate route when trigger changes
  useEffect(() => {
    const calculateRoute = async () => {
      if (!mapInstanceRef.current || !directionsServiceRef.current || !directionsRendererRef.current || 
          !routeData.from || !routeData.to || !selectedCar || routeTrigger === 0) {
        console.log('⏸️ Mangler requirements for ruteberegning');
        return;
      }

      console.log('🚀 STARTER GOOGLE MAPS RUTEPLANLEGGING');
      console.log('📍 Fra:', routeData.from, 'Til:', routeData.to);

      try {
        const request: google.maps.DirectionsRequest = {
          origin: routeData.from + ', Norge',
          destination: routeData.to + ', Norge',
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'NO',
          avoidHighways: false,
          avoidTolls: false,
        };

        if (routeData.via && routeData.via.trim()) {
          request.waypoints = [{
            location: routeData.via + ', Norge',
            stopover: true
          }];
        }

        directionsServiceRef.current.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            console.log('✅ Google Maps rute beregnet');
            directionsRendererRef.current!.setDirections(result);
            
            // Extract route information
            const route = result.routes[0];
            let totalDistance = 0;
            let totalTime = 0;
            
            route.legs.forEach(leg => {
              totalDistance += leg.distance?.value || 0;
              totalTime += leg.duration?.value || 0;
            });
            
            // Convert to appropriate units
            const distanceKm = totalDistance / 1000;
            const timeMinutes = totalTime / 60;
            
            // Calculate battery usage based on car and distance
            const batteryUsagePercent = Math.min(100, (distanceKm / selectedCar.range) * 100);
            const remainingBattery = Math.max(0, routeData.batteryPercentage - batteryUsagePercent);
            
            // Estimate charging needs
            const needsCharging = remainingBattery < 20; // Need charging if below 20%
            const requiredStops = needsCharging ? Math.ceil(batteryUsagePercent / 60) : 0; // Rough estimate
            
            // Create trip analysis
            const analysis: TripAnalysis = {
              totalDistance: distanceKm,
              totalTime: timeMinutes,
              totalChargingTime: requiredStops * 30, // 30 min per stop
              totalCost: requiredStops * 150, // 150 kr per charging session
              batteryUsage: batteryUsagePercent,
              requiredStops: requiredStops,
              weatherImpact: 'Normalt',
              routeEfficiency: distanceKm > 300 ? 'God' : 'Meget god',
            };

            onRouteCalculated(analysis);
            
            // Adjust map bounds to show entire route
            const bounds = new google.maps.LatLngBounds();
            route.legs.forEach(leg => {
              leg.steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
            });
            mapInstanceRef.current!.fitBounds(bounds);
            
            console.log('📊 Rute: ', {
              distance: `${distanceKm.toFixed(0)} km`,
              time: `${Math.round(timeMinutes)} min`,
              batteryUsage: `${batteryUsagePercent.toFixed(0)}%`,
              stops: requiredStops
            });
            
          } else {
            console.error('❌ Google Maps rute feil:', status);
            
            let errorMessage = 'Kunne ikke beregne rute';
            
            switch (status) {
              case google.maps.DirectionsStatus.NOT_FOUND:
                errorMessage = 'Fant ikke rute mellom destinasjonene';
                break;
              case google.maps.DirectionsStatus.ZERO_RESULTS:
                errorMessage = 'Ingen rute funnet. Sjekk destinasjonene.';
                break;
              case google.maps.DirectionsStatus.REQUEST_DENIED:
                errorMessage = 'API-nøkkelen mangler tilgang til Directions API. Kontakt administrator.';
                break;
              case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                errorMessage = 'For mange forespørsler. Prøv igjen senere.';
                break;
              default:
                errorMessage = `Rutefeil: ${status}`;
            }
            
            // Show map with markers only, no route
            if (mapInstanceRef.current) {
              // Create simple markers for start and end
              try {
                const geocoder = new google.maps.Geocoder();
                
                // Geocode start location
                geocoder.geocode({ address: routeData.from + ', Norge' }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    new google.maps.Marker({
                      position: results[0].geometry.location,
                      map: mapInstanceRef.current,
                      title: 'Start: ' + routeData.from,
                      icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#22c55e',
                        fillOpacity: 1,
                        strokeColor: '#16a34a',
                        strokeWeight: 2,
                      }
                    });
                  }
                });
                
                // Geocode end location  
                geocoder.geocode({ address: routeData.to + ', Norge' }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    new google.maps.Marker({
                      position: results[0].geometry.location,
                      map: mapInstanceRef.current,
                      title: 'Mål: ' + routeData.to,
                      icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#ef4444',
                        fillOpacity: 1,
                        strokeColor: '#dc2626',
                        strokeWeight: 2,
                      }
                    });
                    
                    // Center map on end location
                    mapInstanceRef.current?.setCenter(results[0].geometry.location);
                    mapInstanceRef.current?.setZoom(8);
                  }
                });
              } catch (geocodeError) {
                console.warn('Kunne ikke geocode adresser:', geocodeError);
              }
            }
            
            // Still show some analysis even without route
            const estimatedDistance = 400; // km estimate
            const batteryUsagePercent = (estimatedDistance / selectedCar.range) * 100;
            const requiredStops = Math.ceil(batteryUsagePercent / 60);
            
            const analysis: TripAnalysis = {
              totalDistance: estimatedDistance,
              totalTime: estimatedDistance * 1.2, // rough estimate
              totalChargingTime: requiredStops * 30,
              totalCost: requiredStops * 150,
              batteryUsage: batteryUsagePercent,
              requiredStops: requiredStops,
              weatherImpact: 'Ukjent',
              routeEfficiency: 'Ukjent - ' + errorMessage,
            };

            onRouteCalculated(analysis);
          }
        });
      } catch (error) {
        console.error('❌ Feil ved ruteberegning:', error);
        throw error;
      }
    };

    if (routeTrigger > 0) {
      calculateRoute().catch(console.error);
    }
  }, [routeTrigger, routeData, selectedCar, onRouteCalculated]);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

// Fetch charging stations from Supabase
const fetchNorwegianChargingStations = async (): Promise<ChargingStation[]> => {
  console.log('🔌 Henter ladestasjoner fra Supabase...');
  
  const { data: stations, error } = await supabase
    .from('charging_stations')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Feil ved henting av ladestasjoner:', error);
    throw new Error(`Database feil: ${error.message}`);
  }

  if (!stations || stations.length === 0) {
    console.warn('⚠️ Ingen ladestasjoner funnet i database');
    return [];
  }

  console.log('✅ Hentet', stations.length, 'ladestasjoner fra database');

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
      console.log('🔧 Åpner lademodal for stasjon:', stationName);
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
        console.log('🔑 Henter Google Maps API-nøkkel...');
        const { data, error } = await supabase.functions.invoke('google-maps-proxy');
        if (error) {
          console.error('❌ Google Maps API-nøkkel feil:', error);
          throw error;
        }
        console.log('✅ Google Maps API-nøkkel hentet');
        setApiKey(data.apiKey);
      } catch (error) {
        console.error('❌ Feil ved henting av Google Maps API-nøkkel:', error);
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
        const stations = await fetchNorwegianChargingStations();
        setChargingStations(stations);
        console.log('✅ Ladestasjoner satt i state:', stations.length);
      } catch (error) {
        console.error('❌ Feil ved lasting av ladestasjoner:', error);
        setError('Kunne ikke laste ladestasjoner');
      }
    };

    loadChargingStations();
  }, []);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log('🗺️ Google Maps lastet');
    setMapInstance(map);
  }, []);

  // Handle route calculation
  const handleRouteCalculated = useCallback((analysis: TripAnalysis) => {
    onRouteAnalysisUpdate(analysis);
    setLoading(false);
    
    toast({
      title: "✅ Rute beregnet",
      description: `${analysis.totalDistance.toFixed(0)} km - ${Math.round(analysis.totalTime)} min`,
    });
  }, [onRouteAnalysisUpdate, toast]);

  // Set loading when route calculation starts
  useEffect(() => {
    if (routeTrigger > 0 && routeData.from && routeData.to && selectedCar) {
      setLoading(true);
      setError(null);
      
      // Auto-clear loading after 10 seconds if no response
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Ruteberegning tok for lang tid. Prøv igjen.');
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [routeTrigger, routeData.from, routeData.to, selectedCar]);

  // Render loading state
  const renderLoadingMap = () => (
    <div className="w-full h-[500px] bg-muted/20 rounded-lg flex items-center justify-center">
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
    console.log('🚫 GoogleRouteMap ikke synlig');
    return null;
  }

  console.log('✅ GoogleRouteMap rendrer - visible:', isVisible, 'hasApiKey:', !!apiKey, 'loading:', loading);

  return (
    <div data-testid="route-map" className="space-y-6">
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Google Maps Ruteplanlegger</h2>
        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />}
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="w-full rounded-lg overflow-hidden border">
            {!apiKey ? (
              renderLoadingMap()
            ) : (
              <Wrapper apiKey={apiKey} render={renderLoadingMap}>
                <MapComponent
                  center={{ lat: 60.472, lng: 8.4689 }} // Norge sentrum
                  zoom={6}
                  onMapLoad={handleMapLoad}
                  chargingStations={chargingStations}
                  routeData={routeData}
                  selectedCar={selectedCar}
                  routeTrigger={routeTrigger}
                  onRouteCalculated={handleRouteCalculated}
                />
              </Wrapper>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm text-muted-foreground">Beregner rute med Google Maps...</span>
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