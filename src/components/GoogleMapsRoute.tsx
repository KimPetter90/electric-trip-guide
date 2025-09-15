import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Battery, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  batteryPercentage: number;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  chargeTime: number;
  chargeAmount: number;
  cost: number;
  fastCharger: boolean;
  requiredStop: boolean;
}

interface GoogleMapsRouteProps {
  isVisible: boolean;
  selectedCar: CarModel | null;
  routeData: RouteData;
}

// Load charging stations from database
const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);

export default function GoogleMapsRoute({ isVisible, selectedCar, routeData }: GoogleMapsRouteProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [requiredStations, setRequiredStations] = useState<ChargingStation[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [batteryStatus, setBatteryStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load charging stations from database
  useEffect(() => {
    const loadChargingStations = async () => {
      try {
        console.log('🔌 Starter henting av ladestasjoner fra database...');
        const { data, error } = await supabase
          .from('charging_stations')
          .select('*');
        
        if (error) {
          console.error('❌ Feil ved henting av ladestasjoner:', error);
          return;
        }

        console.log('✅ Hentet ladestasjoner fra database:', data?.length || 0);
        
        if (!data || data.length === 0) {
          console.warn('⚠️ Ingen ladestasjoner funnet i database');
          return;
        }

        // Transform database data to component format
        const stations: ChargingStation[] = data.map(station => ({
          id: station.id,
          name: station.name,
          location: station.location,
          lat: Number(station.latitude),
          lng: Number(station.longitude),
          chargeTime: station.fast_charger ? 30 : 60, // Estimate based on charger type
          chargeAmount: station.fast_charger ? 50 : 35, // Estimate based on charger type
          cost: Number(station.cost),
          fastCharger: station.fast_charger,
          requiredStop: false // Will be calculated based on route
        }));

        console.log('🔄 Transformerte ladestasjoner:', stations.length);
        setChargingStations(stations);
        
        // Log første 3 stasjoner for debugging
        console.log('📊 Første 3 stasjoner:', stations.slice(0, 3).map(s => ({ 
          name: s.name, 
          location: s.location, 
          lat: s.lat, 
          lng: s.lng 
        })));
        
      } catch (error) {
        console.error('❌ Uventet feil ved henting av ladestasjoner:', error);
      }
    };

    console.log('🚀 useEffect for ladestasjoner kjører...');
    loadChargingStations();
  }, []);

  // Calculate if charging is needed based on battery percentage and route
  const calculateChargingNeeds = (distance: number, car: CarModel, batteryPercentage: number, trailerWeight: number) => {
    if (!car) return { needsCharging: false, stations: [], isCritical: false };

    // Calculate actual range with current battery and trailer
    const trailerPenalty = trailerWeight > 0 ? 1 + (trailerWeight * 0.15 / 1000) : 1;
    const actualRange = (car.range * (batteryPercentage / 100)) / trailerPenalty;
    
    const needsCharging = distance > actualRange;
    const isCritical = batteryPercentage <= 10; // Kritisk når batteriet er 10% eller mindre
    
    if (needsCharging) {
      // Mark stations as required based on distance
      const stationsWithRequirement = chargingStations.map(station => ({
        ...station,
        requiredStop: distance > actualRange,
        isCritical: isCritical
      }));
      
      return { 
        needsCharging: true, 
        stations: stationsWithRequirement,
        actualRange,
        shortfall: distance - actualRange,
        isCritical
      };
    }
    
    return { 
      needsCharging: false, 
      stations: chargingStations.map(s => ({ ...s, requiredStop: false, isCritical: isCritical })),
      actualRange,
      isCritical
    };
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up markers
      markers.forEach(marker => {
        if (marker) {
          marker.setMap(null);
        }
      });
      
      // Clean up directions renderer
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      
      // Clean up map
      if (map && mapRef.current) {
        try {
          // Clear the map container safely
          const mapContainer = mapRef.current;
          if (mapContainer && mapContainer.firstChild) {
            mapContainer.innerHTML = '';
          }
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, [map, directionsRenderer, markers]);

  useEffect(() => {
    if (!isVisible || !mapRef.current || isInitialized) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get API key from Supabase edge function
        console.log('Fetching Google Maps API key...');
        const { data, error: apiError } = await supabase.functions.invoke('google-maps-proxy');
        
        console.log('API response:', { data, apiError });
        
        if (apiError) {
          console.error('Supabase function error:', apiError);
          throw new Error(`Supabase feil: ${apiError.message}`);
        }
        
        if (!data?.apiKey) {
          console.error('No API key in response:', data);
          throw new Error('Ingen API-nøkkel mottatt fra server');
        }

        console.log('Got API key, loading Google Maps...');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: "weekly",
          libraries: ["geometry"]
        });

        await loader.load();

        // Check if the component is still mounted and visible
        if (!isVisible || !mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 60.472, lng: 8.4689 }, // Center of Norway
          zoom: 6,
          styles: [
            {
              "featureType": "all",
              "elementType": "geometry",
              "stylers": [{ "color": "#1e1e1e" }]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#888888" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#000000" }]
            }
          ]
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#00ff88",
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setIsLoading(false);
        setIsInitialized(true);

      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Kunne ikke laste Google Maps');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [isVisible, isInitialized]);

  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !routeData.from || !routeData.to) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    directionsService.route({
      origin: routeData.from,
      destination: routeData.to,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const distance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) / 1000; // Convert to km
        setRouteDistance(distance);

        if (selectedCar) {
          const chargingNeeds = calculateChargingNeeds(distance, selectedCar, routeData.batteryPercentage, routeData.trailerWeight);
          setRequiredStations(chargingNeeds.stations);
          
          if (chargingNeeds.needsCharging) {
            if (chargingNeeds.isCritical) {
              setBatteryStatus(`🚨 KRITISK BATTERINIVÅ! ${routeData.batteryPercentage}% batteri - mangler ${Math.round(chargingNeeds.shortfall || 0)} km rekkevidde`);
            } else {
              setBatteryStatus(`Trenger lading! Mangler ${Math.round(chargingNeeds.shortfall || 0)} km rekkevidde`);
            }
          } else {
            setBatteryStatus(`Rekkevidde OK! ${Math.round(chargingNeeds.actualRange || 0)} km tilgjengelig`);
          }
        }

        // IKKE fjern eksisterende markører her - la dem være
        console.log('🛣️ Rute beregnet, beholder alle ladestasjonsmarkører');
        
        // Legg bare til spesielle markører for optimerte stasjoner
        if (requiredStations.length > 0) {
          console.log('⚡ Legger til spesielle markører for optimerte stasjoner...');
          requiredStations.forEach((station, index) => {
            // Bestem farge basert på batteristatus og stasjonsstatus
            const isCriticalBattery = routeData.batteryPercentage <= 10;
            let markerColor = '#00ff41'; // Neon grønn som standard for ALLE
            let markerScale = 12;
            let strokeWeight = 2;
            
            // BARE hvis det er en obligatorisk stasjon OG batteriet er kritisk, da blir den rød
            if (station.requiredStop && isCriticalBattery) {
              markerColor = '#ff0000'; // Rød kun for obligatoriske ved kritisk batteri
              markerScale = 16;
              strokeWeight = 4;
              console.log(`🚨 KRITISK: ${station.name} vises rød (obligatorisk + batteriet på ${routeData.batteryPercentage}%)`);
            } else {
              console.log(`✅ ${station.name} vises neon grønn (${station.requiredStop ? 'obligatorisk men ikke kritisk' : 'anbefalt'})`);
            }
            
            // Legg til større, mer synlig markør for optimerte stasjoner
            const optimizedMarker = new google.maps.Marker({
              position: { lat: station.lat, lng: station.lng },
              map: map,
              title: `${station.requiredStop ? 'OBLIGATORISK' : 'ANBEFALT'}: ${station.name}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: markerScale,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: strokeWeight
              },
              zIndex: 1000 // Sørg for at de vises over andre markører
            });

            const optimizedPopup = new google.maps.InfoWindow({
              content: `
                <div style="color: black; font-family: Arial, sans-serif; min-width: 250px;">
                  <h3 style="margin: 0 0 8px 0; color: ${station.requiredStop ? '#dc2626' : '#2563eb'};">
                    ${station.requiredStop ? '⚠️ OBLIGATORISK' : '🔄 ANBEFALT'} ${station.name}
                  </h3>
                  <p style="margin: 4px 0;"><strong>📍 Lokasjon:</strong> ${station.location}</p>
                  <p style="margin: 4px 0;"><strong>🛣️ Ladetid:</strong> ${station.chargeTime} min</p>
                  <p style="margin: 4px 0;"><strong>⚡ Energi:</strong> ${station.chargeAmount} kWh</p>
                  <p style="margin: 4px 0;"><strong>💰 Kostnad:</strong> ${station.cost} kr</p>
                  ${station.requiredStop ? '<p style="color: #dc2626; font-weight: bold; margin-top: 8px;">Du MÅ lade her!</p>' : '<p style="color: #2563eb; margin-top: 8px;">Anbefalt ladestasjon for denne ruten</p>'}
                </div>
              `
            });

            optimizedMarker.addListener('click', () => {
              optimizedPopup.open(map, optimizedMarker);
            });

            // Legg til i markers-arrayet så de kan ryddes opp senere
            setMarkers(prev => [...prev, optimizedMarker]);
          });
          
          console.log(`✅ Lagt til ${requiredStations.length} optimerte rutemarkører`);
        }
      }
    });
  }, [map, directionsService, directionsRenderer, routeData, selectedCar, chargingStations]);

  // Show ALL charging stations when map is loaded - BATCHED FOR PERFORMANCE
  useEffect(() => {
    console.log('🗺️ ALL STATIONS useEffect kjører...', { 
      harKart: !!map, 
      antallStasjoner: chargingStations.length
    });
    
    if (!map || chargingStations.length === 0) {
      console.log('🚫 Returnerer tidlig - mangler kart eller stasjoner');
      return;
    }

    console.log(`📍 LEGGER TIL ALLE ${chargingStations.length} LADESTASJONER PÅ KARTET...`);
    console.log('🔍 Første 3 stasjoner:', chargingStations.slice(0, 3).map(s => ({ name: s.name, lat: s.lat, lng: s.lng })));
    
    // Rydd bare ladestasjonsmarkører, ikke rute-markører
    markers.forEach(marker => {
      const title = marker.getTitle();
      if (!title?.includes('OBLIGATORISK') && !title?.includes('ANBEFALT')) {
        marker.setMap(null);
      }
    });
    
    const newMarkers: google.maps.Marker[] = [];
    let markersCreated = 0;
    const BATCH_SIZE = 50; // Legg til markører i batches for bedre performance
    
    // Funksjon for å legge til markører i batches
    const addMarkersBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + BATCH_SIZE, chargingStations.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const station = chargingStations[i];
        try {
          if (i < 10) { // Log første 10 for debugging
            console.log(`📍 Batch ${Math.floor(i/BATCH_SIZE)+1}: Oppretter markør ${i + 1}: ${station.name} på lat:${station.lat}, lng:${station.lng}`);
          }
          
          const marker = new google.maps.Marker({
            position: { lat: station.lat, lng: station.lng },
            map: map,
            title: station.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: station.fastCharger ? 8 : 6,
              fillColor: "#00ff41", // Neon grønn for alle ladestasjoner
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 1
            },
            zIndex: 1,
            optimized: true // Bruk Google Maps optimisering
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: black; font-family: Arial, sans-serif; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0;">${station.name}</h3>
                <p style="margin: 4px 0;"><strong>📍 Lokasjon:</strong> ${station.location}</p>
                <p style="margin: 4px 0;"><strong>⚡ Type:</strong> ${station.fastCharger ? 'Hurtiglader' : 'Standard lader'}</p>
                <p style="margin: 4px 0;"><strong>💰 Pris:</strong> ${station.cost} kr/kWh</p>
                <p style="margin: 4px 0;"><strong>📊 Tilgjengelig:</strong> ${Math.floor(Math.random() * 4) + 1}/${Math.floor(Math.random() * 6) + 4} ladepunkter</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
          markersCreated++;
          
        } catch (error) {
          console.error(`❌ Feil ved opprettelse av markør ${i}:`, error);
        }
      }
      
      // Legg til neste batch med en liten forsinkelse for bedre performance
      if (endIndex < chargingStations.length) {
        setTimeout(() => addMarkersBatch(endIndex), 10);
      } else {
        console.log(`✅ FERDIG! OPPRETTET ${markersCreated} AV ${chargingStations.length} MARKØRER`);
        console.log(`✅ TOTALT ${newMarkers.length} VANLIGE LADESTASJONSMARKØRER LAGT TIL`);
        
        // Oppdater markers state med alle nye markører
        setMarkers(prev => {
          const routeMarkers = prev.filter(m => {
            const title = m.getTitle();
            return title?.includes('OBLIGATORISK') || title?.includes('ANBEFALT');
          });
          return [...routeMarkers, ...newMarkers];
        });
      }
    };
    
    // Start med første batch
    addMarkersBatch(0);
    
  }, [map, chargingStations]); // Trigger når kart eller stasjoner endres

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Google Maps Rutekart
          <Badge variant="secondary" className="ml-2">
            {chargingStations.length} ladestasjoner
          </Badge>
        </h3>
        
        {/* Battery Status Alert */}
        {batteryStatus && selectedCar && (
          <div className={`mb-4 p-3 rounded-lg border ${
            batteryStatus.includes('🚨 KRITISK') 
              ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' 
              : batteryStatus.includes('Trenger lading') 
                ? 'bg-destructive/10 border-destructive text-destructive' 
                : 'bg-primary/10 border-primary text-primary'
          }`}>
            <div className="flex items-center gap-2">
              {batteryStatus.includes('🚨 KRITISK') ? (
                <AlertTriangle className="h-4 w-4 animate-pulse" />
              ) : batteryStatus.includes('Trenger lading') ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Battery className="h-4 w-4" />
              )}
              <span className="font-medium">{batteryStatus}</span>
            </div>
            <div className="text-sm mt-1 opacity-80">
              Rute: {Math.round(routeDistance)} km | Batteri: {routeData.batteryPercentage}%
              {routeData.trailerWeight > 0 && ` | Henger: ${routeData.trailerWeight}kg`}
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef}
          className="h-96 rounded-lg overflow-hidden border border-border shadow-lg bg-background/20"
          style={{ minHeight: '384px' }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laster Google Maps...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
              <div className="text-center text-destructive">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                <p className="font-medium">Kunne ikke laste kartet</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gradient-electric opacity-80"></div>
              <span>Planlagt rute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-electric"></div>
              <span>Anbefalt ladestasjon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span>Nødvendig ladestasjon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Normal lader</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Charging Stations List */}
      {requiredStations.length > 0 && (
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
          <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Ladestasjoner på ruten
          </h4>
          
          <div className="space-y-3">
            {requiredStations.map((station, index) => (
              <div 
                key={station.id} 
                className={`bg-background/50 rounded-lg p-3 border ${
                  station.requiredStop 
                    ? 'border-destructive bg-destructive/5' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    station.requiredStop 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-gradient-electric text-primary-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <h5 className="font-semibold text-sm flex-1">{station.name}</h5>
                  {station.requiredStop && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Nødvendig
                    </Badge>
                  )}
                  {station.fastCharger && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Hurtig
                    </Badge>
                  )}
                </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📍 {station.location}</span>
            <span>🔌 {station.fastCharger ? 'Hurtiglader' : 'Normal lader'}</span>
            <span>⚡ Tilgjengelig: {Math.floor(Math.random() * 4) + 1}/{Math.floor(Math.random() * 6) + 4}</span>
          </div>
                
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Ladetid: {station.chargeTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span>Energi: {station.chargeAmount} kWh</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span>Kostnad: {station.cost} kr</span>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs mr-2">
              {station.fastCharger ? '⚡ Hurtiglader' : '🔌 Normal lader'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Tilgjengelig: {Math.floor(Math.random() * 4) + 1}/{Math.floor(Math.random() * 6) + 4}
            </Badge>
          </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}