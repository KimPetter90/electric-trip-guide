import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { RouteOptimizer, type OptimizedChargingPlan } from '@/utils/routeCalculation';
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

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fast_charger: boolean;
  power: string;
  cost: number;
  provider: string;
  address: string;
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

// Component
const GoogleRouteMap: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  onMapLoad?: (map: google.maps.Map) => void;
  chargingStations: ChargingStation[];
  routeData: RouteData;
  selectedCar: CarModel | null;
  routeTrigger: number;
  onRouteCalculated: (analysis: TripAnalysis) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
}> = ({ center, zoom, onMapLoad, chargingStations, routeData, selectedCar, routeTrigger, onRouteCalculated, onLoadingChange, onError }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const allMarkersRef = useRef<google.maps.Marker[]>([]);
  const chargingStationMarkersRef = useRef<google.maps.Marker[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<google.maps.DirectionsResult | null>(null);

  // Clear markers on unmount
  useEffect(() => {
    return () => {
      allMarkersRef.current.forEach(marker => marker.setMap(null));
      chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  // Initialize Google Maps only once
  useEffect(() => {
    if (typeof window === 'undefined' || isMapInitialized) return;

    const initializeMap = async () => {
      try {
        onLoadingChange(true);
        onError(null);
        console.log('🗺️ Initialiserer Google Maps...');

        // Get API key from Supabase function
        const { data, error } = await supabase.functions.invoke('google-maps-proxy');
        
        if (error || !data?.apiKey) {
          console.error('❌ Feil ved henting av API-nøkkel:', error);
          onError('Kunne ikke laste Google Maps. Prøv igjen senere.');
          onLoadingChange(false);
          return;
        }

        console.log('✅ API-nøkkel mottatt, laster Google Maps...');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          region: 'NO', // Norge
          language: 'no' // Norsk for å sikre norske stedsnavn
        });

        console.log('🔧 Loading Google Maps JavaScript API...');
        const google = await loader.load();
        console.log('✅ Google Maps JavaScript API loaded successfully');

        if (!mapRef.current) {
          console.error('❌ Map container element not found');
          onError('Kartcontainer ikke tilgjengelig');
          onLoadingChange(false);
          return;
        }

        console.log('🗺️ Creating Google Maps instance...');
        
        // Initialize map with explicit error handling
        try {
          const map = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: Math.max(zoom, 12), // Høy zoom for å sikre stedsnavn i HYBRID
            mapTypeId: google.maps.MapTypeId.HYBRID, // Tilbake til HYBRID (satellitt med navn)
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
            },
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'auto',
            keyboardShortcuts: false,
            clickableIcons: true,
            disableDoubleClickZoom: false,
            scrollwheel: false,
            restriction: {
              latLngBounds: {
                north: 72,
                south: 58,
                west: 4,
                east: 32
              },
              strictBounds: false
            }
          });

          console.log('✅ Google Maps instance created successfully');
          mapInstanceRef.current = map;
          
          // INGEN CSS-manipulering som kan skjule stedsnavn!
          // La Google Maps vise ALT som normalt
          
          console.log('✅ Google Maps instance created successfully');
          mapInstanceRef.current = map;
          
          // Initialize directions service and renderer
          directionsServiceRef.current = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true, // Vi lager egne start/slutt-markører
            polylineOptions: {
              strokeColor: '#3b82f6', // Blå farge som på det gamle kartet
              strokeWeight: 6, // Samme tykkelse som det gamle kartet  
              strokeOpacity: 0.8 // Samme opasitet som det gamle kartet
            }
          });
          
          directionsRendererRef.current.setMap(map);
          console.log('✅ Google Maps DirectionsService and DirectionsRenderer initialized');

          setIsMapInitialized(true);
          onLoadingChange(false);
          onMapLoad?.(map);
          
          // Reduser størrelsen på kart/satellitt knappene med CSS
          const observer = new MutationObserver(() => {
            const mapTypeButtons = document.querySelectorAll('.gm-style .gm-style-mtc > div');
            mapTypeButtons.forEach((button: any) => {
              if (button) {
                button.style.fontSize = '10px';
                button.style.padding = '2px 4px';
                button.style.minWidth = '30px';
                button.style.height = '20px';
                button.style.lineHeight = '16px';
              }
            });
          });
          
          // Start observing for changes
          observer.observe(mapRef.current, { childList: true, subtree: true });
          
          // Initial styling
          setTimeout(() => {
            const mapTypeButtons = document.querySelectorAll('.gm-style .gm-style-mtc > div');
            mapTypeButtons.forEach((button: any) => {
              if (button) {
                button.style.fontSize = '10px';
                button.style.padding = '2px 4px';
                button.style.minWidth = '30px';
                button.style.height = '20px';
                button.style.lineHeight = '16px';
              }
            });
          }, 500);
          
        } catch (mapInitError: any) {
          console.error('❌ Error creating Google Maps instance:', mapInitError);
          onError(`Kunne ikke initialisere Google Maps: ${mapInitError.message}`);
          onLoadingChange(false);
        }

      } catch (err) {
        console.error('❌ Feil ved initialisering av Google Maps:', err);
        onError('Kunne ikke laste Google Maps. Sjekk internetforbindelsen.');
        onLoadingChange(false);
      }
    };

    initializeMap();
  }, []);

  // Hjelpefunksjon for å sjekke om stasjon er nær ruten
  const isStationNearRoute = useCallback((station: ChargingStation): boolean => {
    if (!calculatedRoute || !window.google?.maps?.geometry) {
      return false;
    }
    
    const stationPos = new google.maps.LatLng(station.latitude, station.longitude);
    const route = calculatedRoute.routes[0];
    
    // Øk grense til 15km for å fange opp flere stasjoner langs hovedveier
    let minDistance = Infinity;
    
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        // Bruk start og slutt av hvert steg + mellompunkter
        const stepStart = step.start_location;
        const stepEnd = step.end_location;
        
        // Sjekk start og slutt av steget + MANGE flere mellompunkter for nøyaktighet
        let startDistance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, stepStart);
        let endDistance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, stepEnd);
        minDistance = Math.min(minDistance, startDistance, endDistance);
        
        // Sjekk 50 punkter langs segmentet for MEGET høy nøyaktighet
        for (let i = 1; i <= 49; i++) {
          const ratio = i / 50;
          const lat = stepStart.lat() + (stepEnd.lat() - stepStart.lat()) * ratio;
          const lng = stepStart.lng() + (stepEnd.lng() - stepStart.lng()) * ratio;
          const routePoint = new google.maps.LatLng(lat, lng);
          
          const distance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, routePoint);
          minDistance = Math.min(minDistance, distance);
        }
        
        // EKSTRA: Sjekk punkter i radius rundt hvert rutepunkt  
        for (let i = 0; i <= 50; i++) {
          const ratio = i / 50;
          const lat = stepStart.lat() + (stepEnd.lat() - stepStart.lat()) * ratio;
          const lng = stepStart.lng() + (stepEnd.lng() - stepStart.lng()) * ratio;
          
          // Sjekk 8 punkter i radius rundt hvert rutepunkt (for å fange E6/hovedveier)
          for (let angle = 0; angle < 360; angle += 45) {
            const radiusOffset = 500; // 500 meter radius
            const offsetLat = lat + (radiusOffset / 111000) * Math.cos(angle * Math.PI / 180);
            const offsetLng = lng + (radiusOffset / (111000 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle * Math.PI / 180);
            const offsetPoint = new google.maps.LatLng(offsetLat, offsetLng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, offsetPoint);
            minDistance = Math.min(minDistance, distance);
          }
        }
      });
    });
    
    const isNear = minDistance <= 5000; // 5km grense som ønsket
    console.log(`🔍 Stasjon ${station.name}: minste avstand=${(minDistance/1000).toFixed(1)}km, nær rute=${isNear}`);
    
    // SPESIELL SJEKK: Debug for Tesla stasjoner som burde være på ruten
    if (station.name.includes('Tesla') && (station.name.includes('Ringebu') || station.name.includes('Larvik'))) {
      console.log(`🚨 TESLA DEBUG ${station.name}:`);
      console.log(`   - Koordinater: lat=${station.latitude}, lng=${station.longitude}`);
      console.log(`   - Minste avstand til rute: ${(minDistance/1000).toFixed(1)}km`);
      console.log(`   - Blir klassifisert som: ${isNear ? 'RØD (nær rute)' : 'GRØNN (langt fra rute)'}`);
      console.log(`   - Rute har ${calculatedRoute?.routes[0]?.legs?.length} legs med totalt ${calculatedRoute?.routes[0]?.legs?.reduce((sum, leg) => sum + leg.steps.length, 0)} steps`);
    }
    
    return isNear;
  }, [calculatedRoute]);

  // Hjelpefunksjon for å finne nærmeste punkt på ruten
  const findNearestPointOnRoute = useCallback((clickedPos: google.maps.LatLng, route: google.maps.DirectionsResult): google.maps.LatLng => {
    if (!window.google?.maps?.geometry) {
      return clickedPos;
    }
    
    let minDistance = Infinity;
    let nearestPoint = clickedPos;
    
    route.routes[0].legs.forEach(leg => {
      leg.steps.forEach(step => {
        // Check multiple points along each step for high accuracy
        const stepStart = step.start_location;
        const stepEnd = step.end_location;
        
        // Check 20 points along this step
        for (let i = 0; i <= 20; i++) {
          const ratio = i / 20;
          const lat = stepStart.lat() + (stepEnd.lat() - stepStart.lat()) * ratio;
          const lng = stepStart.lng() + (stepEnd.lng() - stepStart.lng()) * ratio;
          const routePoint = new google.maps.LatLng(lat, lng);
          
          const distance = google.maps.geometry.spherical.computeDistanceBetween(clickedPos, routePoint);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = routePoint;
          }
        }
      });
    });
    
    console.log(`🎯 Snappet til ruten, avstand: ${minDistance.toFixed(0)}m`);
    return nearestPoint;
  }, []);

  // Hjelpefunksjon for å beregne avstand til en posisjon på ruten
  const calculateDistanceToPosition = useCallback((position: google.maps.LatLng, route: google.maps.DirectionsResult): number => {
    if (!route || !selectedCar) return 0;
    
    let totalDistance = 0;
    let found = false;
    
    route.routes[0].legs.forEach(leg => {
      if (!found) {
        leg.steps.forEach(step => {
          if (!found) {
            // Check if position is close to this step
            const distanceToStep = google.maps.geometry.spherical.computeDistanceBetween(
              position, 
              step.start_location
            );
            
            if (distanceToStep < 100) { // Within 100 meters
              found = true;
              return;
            }
            
            totalDistance += (step.distance?.value || 0);
          }
        });
      }
    });
    
    return totalDistance / 1000; // Return in kilometers
  }, [selectedCar]);

  // Hjelpefunksjon for å beregne avstand for et gitt batterinivå
  const calculateDistanceForBatteryLevel = useCallback((targetBatteryLevel: number, startBatteryLevel: number, carRange: number): number => {
    const batteryUsed = startBatteryLevel - targetBatteryLevel;
    const distanceForBatteryUsed = (batteryUsed / 100) * carRange;
    return distanceForBatteryUsed;
  }, []);

  // Hjelpefunksjon for å finne posisjon på gitt avstand på ruten
  const findPositionAtDistance = useCallback((targetDistance: number, route: google.maps.DirectionsResult): google.maps.LatLng | null => {
    if (!route || targetDistance <= 0) return null;
    
    let accumulatedDistance = 0;
    
    for (const leg of route.routes[0].legs) {
      for (const step of leg.steps) {
        const stepDistance = (step.distance?.value || 0) / 1000;
        
        if (accumulatedDistance + stepDistance >= targetDistance) {
          const remainingDistance = targetDistance - accumulatedDistance;
          const ratio = remainingDistance / stepDistance;
          
          const startLat = step.start_location.lat();
          const startLng = step.start_location.lng();
          const endLat = step.end_location.lat();
          const endLng = step.end_location.lng();
          
          const targetLat = startLat + (endLat - startLat) * ratio;
          const targetLng = startLng + (endLng - startLng) * ratio;
          
          return new google.maps.LatLng(targetLat, targetLng);
        }
        
        accumulatedDistance += stepDistance;
      }
    }
    
    return route.routes[0].legs[route.routes[0].legs.length - 1].end_location;
  }, []);



  // Hjelpefunksjon for å finne de beste anbefalte ladestasjonene med avansert optimalisering
  const getOptimizedChargingPlan = useCallback((): OptimizedChargingPlan[] => {
    if (!calculatedRoute || !selectedCar || !routeData || !chargingStations) {
      return [];
    }

    // Få total rutedistanse fra Google Maps
    const totalDistance = calculatedRoute.routes[0].legs.reduce((sum, leg) => {
      return sum + (leg.distance?.value || 0);
    }, 0) / 1000; // Konverter til km

    // Hent værdata (kan utvides senere med faktisk API-kall)
    const mockWeatherData = {
      temperature: 5, // 5°C
      windSpeed: 8, // 8 m/s
      precipitation: 0, // Ingen nedbør
      humidity: 70,
      conditions: 'cloudy'
    };

    // Bruk RouteOptimizer for avansert beregning
    const optimizedPlan = RouteOptimizer.calculateOptimalChargingPlan(
      selectedCar,
      routeData,
      chargingStations,
      mockWeatherData,
      totalDistance
    );

    // FIKSET: Ta alltid anbefalte stasjoner fra RouteOptimizer, uavhengig av avstand til rute
    console.log(`🔧 Bruker ${optimizedPlan.length} anbefalte stasjoner fra RouteOptimizer`);
    
    optimizedPlan.forEach((plan, index) => {
      const isNearRoute = isStationNearRoute(plan.station);
      console.log(`🔍 Stasjon ${plan.station.name}: nær rute=${isNearRoute}, avstand=${plan.distanceFromStart.toFixed(0)}km, batteri=${plan.batteryLevelOnArrival.toFixed(1)}%`);
    });

    const finalPlan = optimizedPlan; // Bruk ALLE anbefalte stasjoner
    console.log(`🎯 Bruker ${finalPlan.length} anbefalte stasjoner`);
    
    finalPlan.forEach((plan, index) => {
      console.log(`🔄 Anbefalt: ${plan.station.name} - ${plan.distanceFromStart.toFixed(0)}km fra start`);
    });

    finalPlan.forEach((plan, index) => {
      console.log(`  📍 ${index + 1}. ${plan.station.name} - ${plan.distanceFromStart.toFixed(0)}km fra start`);
      console.log(`      ID: ${plan.station.id}`);
    });

    return finalPlan;
  }, [calculatedRoute, selectedCar, routeData, chargingStations, isStationNearRoute]);

  // Hjelpefunksjon for å sjekke om stasjon er anbefalt for lading
  const isRecommendedStation = useCallback((station: ChargingStation): boolean => {
    const optimizedPlan = getOptimizedChargingPlan();
    const isRecommended = optimizedPlan.some(plan => plan.station.id === station.id);
    console.log(`🔍 ${station.name}: i optimal plan=${isRecommended}, plan har ${optimizedPlan.length} stasjoner`);
    return isRecommended;
  }, [getOptimizedChargingPlan]);

  // Hjelpefunksjon for å sjekke om stasjon er kritisk ved 10% batteri
  const checkIfCriticalStation = useCallback((station: ChargingStation): boolean => {
    if (!calculatedRoute || !selectedCar || routeData.batteryPercentage <= 10) {
      console.log(`⚠️ checkIfCriticalStation: mangler data - route=${!!calculatedRoute}, car=${!!selectedCar}, battery=${routeData.batteryPercentage}%`);
      return false;
    }
    
    // Få optimalisert ladeplan først
    const optimizedPlan = getOptimizedChargingPlan();
    console.log(`📋 Optimalisert plan har ${optimizedPlan.length} stasjoner`);
    
    // Hvis ingen anbefalte stasjoner er nær ruten, bruk de anbefalte uansett
    if (optimizedPlan.length === 0) {
      console.log(`⚠️ Ingen anbefalte stasjoner nær ruten - bruker alternativ logikk`);
      return false; // Ingen stasjoner å velge fra
    }
    
    // Beregn avstand hvor batteriet vil være på 10%
    const batteryUsed = routeData.batteryPercentage - 10; // Prosent brukt
    const distanceAt10Percent = (batteryUsed / 100) * selectedCar.range; // km kjørt
    
    console.log(`🔍 Sjekker stasjon ${station.name}: 10% batteri ved ${distanceAt10Percent.toFixed(0)}km`);
    
    // Sjekk om denne stasjonen er i den anbefalte listen
    const stationPlan = optimizedPlan.find(plan => plan.station.id === station.id);
    
    if (!stationPlan) {
      console.log(`❌ ${station.name} er ikke i anbefalte liste`);
      return false; // Stasjonen er ikke anbefalt
    }
    
    console.log(`✅ ${station.name} ER anbefalt - sjekker avstand til 10% punkt`);
    
    // Sjekk om stasjonen er nær 10% punktet (±50km)
    const distanceFromCritical = Math.abs(stationPlan.distanceFromStart - distanceAt10Percent);
    
    if (distanceFromCritical <= 50) {
      console.log(`🔵 KRITISK stasjon funnet: ${station.name} ved ${stationPlan.distanceFromStart.toFixed(0)}km (${distanceFromCritical.toFixed(0)}km fra 10% punkt)`);
      return true;
    }
    
    return false;
  }, [calculatedRoute, selectedCar, routeData.batteryPercentage, getOptimizedChargingPlan, isStationNearRoute]);
  

  // Add charging station markers - update when route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !chargingStations || chargingStations.length === 0) {
      console.log('❌ Ingen ladestasjoner å vise eller kart ikke klar');
      return;
    }

    console.log(`🔌 Legger til ${chargingStations.length} ladestasjoner på kartet`);

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Add new charging station markers
    chargingStations.forEach(station => {
      // Sjekk kategorier for markør-type
      const isRecommended = isRecommendedStation(station);
      const isNearRoute = !isRecommended && calculatedRoute && isStationNearRoute(station);
      
      // Check if this station is critical for 10% battery
      const isCriticalFor10Percent = checkIfCriticalStation(station);
      
      console.log(`🏪 ${station.name}: anbefalt=${isRecommended}, nær rute=${isNearRoute}, kritisk=${isCriticalFor10Percent}`);
      
      const markerIcon = isCriticalFor10Percent ? {
        // Helt blå markør med gult lyn for kritisk ladestasjon ved 10% batteri
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#0066ff" stroke="#ffffff" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="#ffff00" font-size="12" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      } : isRecommended ? {
        // Vanlige anbefalte ladestasjoner (mindre blå)
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="#0066ff" stroke="#004499" stroke-width="1"/>
            <text x="10" y="14" text-anchor="middle" fill="white" font-size="11" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(20, 20),
        anchor: new google.maps.Point(10, 10)
      } : isNearRoute ? {
        // Røde markører for stasjoner nær ruten
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
            <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8)
      } : {
        // Grønne markører for stasjoner langt fra ruten
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" fill="#00ff41" stroke="#00cc33" stroke-width="1"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(8, 8),
        anchor: new google.maps.Point(4, 4)
      };

      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: mapInstanceRef.current!,
        title: `${station.name}\n${station.available}/${station.total} tilgjengelig\n${station.cost} kr/kWh${isCriticalFor10Percent ? '\n🚨 KRITISK - SISTE SJANSE FØR/VED 10%!' : isRecommended ? '\n💙 ANBEFALT LADESTASJON' : isNearRoute ? '\n🔴 NÆR RUTEN' : '\n🟢 LANGT FRA RUTEN'}`,
        icon: markerIcon
      });


      // Legg til klikk-event for ladestasjon-markør
      marker.addListener('click', () => {
        // Finn batteriprosent for anbefalte stasjoner
        const optimizedPlan = getOptimizedChargingPlan();
        const stationPlan = optimizedPlan.find(plan => plan.station.id === station.id);
        const batteryAtArrival = stationPlan ? stationPlan.batteryLevelOnArrival.toFixed(1) : null;
        
        const statusColor = station.available > 0 ? 'hsl(140 100% 50%)' : 'hsl(0 84% 60%)';
        const statusText = station.available > 0 ? 'TILGJENGELIG' : 'OPPTATT';
        const routeIndicator = isRecommended ? 'ANBEFALT LADESTASJON' : isNearRoute ? 'PÅ RUTEN' : 'LADESTASJON';
        const routeColor = isRecommended ? 'hsl(240 100% 60%)' : isNearRoute ? 'hsl(0 84% 60%)' : 'hsl(140 100% 50%)';
        
        const infoWindow = new google.maps.InfoWindow({
          maxWidth: 200,
          disableAutoPan: false,
          pixelOffset: new google.maps.Size(0, -10),
          zIndex: 10000,
          content: `
            <style>
              .gm-style .gm-style-iw-c {
                background: transparent !important;
                z-index: 10000 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                padding: 0 !important;
                overflow: visible !important;
                max-height: none !important;
              }
              .gm-style .gm-style-iw-d {
                overflow: visible !important;
                max-height: none !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              .gm-style .gm-style-iw-d::-webkit-scrollbar {
                display: none !important;
              }
              .gm-style .gm-style-iw-tc {
                display: none !important;
              }
            </style>
            <div style="
              font-family: Inter, system-ui, sans-serif; 
              padding: 0; 
              line-height: 1.4; 
              width: 360px; 
              max-height: none;
              overflow: visible;
              background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(180 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
              border: 1px solid ${isNearRoute ? 'hsl(0 84% 60% / 0.5)' : 'hsl(140 100% 50% / 0.5)'};
              border-radius: 12px;
              box-shadow: 0 8px 32px ${isNearRoute ? 'hsl(0 84% 60% / 0.2)' : 'hsl(140 100% 50% / 0.2)'}, 0 0 0 1px ${isNearRoute ? 'hsl(0 84% 60% / 0.15)' : 'hsl(140 100% 50% / 0.15)'};
              backdrop-filter: blur(16px);
            ">
              <div style="
                background: linear-gradient(135deg, ${routeColor} 0%, ${isNearRoute ? 'hsl(320 100% 60%)' : 'hsl(120 100% 60%)'} 100%);
                color: hsl(225 25% 6%);
                padding: 16px;
                position: relative;
                overflow: hidden;
              ">
                <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  background: hsl(225 25% 6% / 0.3);
                  border: 1px solid hsl(225 25% 6% / 0.2);
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 700;
                  color: hsl(225 25% 6%);
                  z-index: 10;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: radial-gradient(circle at ${isNearRoute ? '20% 80%' : '70% 20%'}, ${isNearRoute ? 'hsl(320 100% 70% / 0.3)' : 'hsl(120 100% 70% / 0.3)'} 0%, transparent 50%);
                "></div>
                <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">${isRecommended ? '💙' : isNearRoute ? '🔴' : '⚡'} ${station.name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${station.address || station.location || 'Ukjent adresse'}</p>
                <div style="margin-top: 8px; position: relative; z-index: 1; display: flex; gap: 8px;">
                  <span style="
                    background: hsl(225 25% 6% / 0.2);
                    color: hsl(225 25% 6%);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid hsl(225 25% 6% / 0.1);
                  ">${routeIndicator}</span>
                  <span style="
                    background: ${statusColor}20;
                    color: hsl(225 25% 6%);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid ${statusColor}40;
                  ">${statusText}</span>
                </div>
              </div>
              <div style="padding: 16px; background: transparent;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                  <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">🔋 Tilgjengelighet</span>
                  <span style="font-weight: 600; font-size: 13px; color: ${station.available > 0 ? 'hsl(140 100% 80%)' : 'hsl(0 84% 70%)'};">${station.available}/${station.total} ledige</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                  <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">⚡ Ladeeffekt</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.power || 'Ikke oppgitt'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                  <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">💰 Kostnad</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.cost || 'Gratis'} kr/kWh</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(45 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(45 100% 50%);">
                  <span style="color: hsl(45 100% 80%); font-size: 13px; font-weight: 500;">🏢 Leverandør</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.provider || 'Ukjent'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(120 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(120 100% 50%);">
                  <span style="color: hsl(120 100% 80%); font-size: 13px; font-weight: 500;">🚀 Hurtiglader</span>
                  <span style="font-weight: 600; font-size: 13px; color: ${station.fast_charger ? 'hsl(140 100% 80%)' : 'hsl(0 84% 70%)'};">${station.fast_charger ? 'Ja' : 'Nei'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(200 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(200 100% 50%);">
                  <span style="color: hsl(200 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}</span>
                </div>
                ${isRecommended && batteryAtArrival ? `
                <div style="
                  margin: 12px 0 0 0; 
                  padding: 12px; 
                  background: linear-gradient(135deg, hsl(240 100% 60% / 0.15) 0%, hsl(260 100% 50% / 0.15) 100%); 
                  border-radius: 8px; 
                  border: 1px solid hsl(240 100% 60% / 0.3);
                  position: relative;
                  overflow: hidden;
                ">
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 80% 20%, hsl(240 100% 60% / 0.1) 0%, transparent 70%);
                  "></div>
                  <div style="position: relative; z-index: 1;">
                    <p style="
                      margin: 0 0 8px 0; 
                      color: hsl(240 100% 70%); 
                      font-weight: 700; 
                      font-size: 14px;
                    ">💙 OPTIMAL LADESTOPPUNKT</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                      <span style="color: hsl(240 100% 80%); font-size: 13px; font-weight: 500;">🔋 Batteri ved ankomst</span>
                      <span style="font-weight: 700; font-size: 15px; color: hsl(240 100% 80%);">${batteryAtArrival}%</span>
                    </div>
                    <p style="
                      margin: 6px 0 0 0; 
                      color: hsl(240 100% 85%); 
                      font-size: 12px;
                      opacity: 0.9;
                    ">Beregnet med værforhold og hengerlast</p>
                  </div>
                </div>
                ` : ''}
                ${isNearRoute ? `
                <div style="
                  margin: 12px 0 0 0; 
                  padding: 12px; 
                  background: linear-gradient(135deg, hsl(0 84% 60% / 0.15) 0%, hsl(320 100% 50% / 0.15) 100%); 
                  border-radius: 8px; 
                  border: 1px solid hsl(0 84% 60% / 0.3);
                  position: relative;
                  overflow: hidden;
                ">
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 80% 20%, hsl(0 84% 60% / 0.1) 0%, transparent 70%);
                  "></div>
                  <p style="
                    margin: 0; 
                    color: hsl(0 84% 70%); 
                    font-weight: 700; 
                    font-size: 14px;
                    position: relative;
                    z-index: 1;
                  ">⚡ Denne ladestasjonen ligger strategisk langs ruten din!</p>
                </div>
                ` : ''}
              </div>
            </div>
          `
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      chargingStationMarkersRef.current.push(marker);
    });
  }, [chargingStations?.length, calculatedRoute, isStationNearRoute, getOptimizedChargingPlan]); // Oppdater når rute endres

  // Calculate route when trigger changes - ROBUST and FOOLPROOF
  const calculateRoute = useCallback(async () => {
    console.log('🔍 ROBUST ruteberegning startet');
    
    // Wait for map to be fully initialized
    let attempts = 0;
    const maxAttempts = 20;
    
    while ((!mapInstanceRef.current || !directionsServiceRef.current || !directionsRendererRef.current) && attempts < maxAttempts) {
      console.log(`⏳ Venter på kart initialisering (forsøk ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    // Final validation
    if (!mapInstanceRef.current || !directionsServiceRef.current || !directionsRendererRef.current || 
        !routeData.from || !routeData.to || !selectedCar || routeTrigger === 0) {
      console.log('⏸️ Requirements fortsatt ikke oppfylt etter venting:');
      console.log('📊 mapInstanceRef.current:', !!mapInstanceRef.current);
      console.log('📊 directionsServiceRef.current:', !!directionsServiceRef.current);
      console.log('📊 directionsRendererRef.current:', !!directionsRendererRef.current);
      console.log('📊 routeData.from:', routeData.from);
      console.log('📊 routeData.to:', routeData.to);
      console.log('📊 selectedCar:', !!selectedCar);
      console.log('📊 routeTrigger:', routeTrigger);
      return;
    }

    console.log('🚀 STARTER GOOGLE MAPS RUTEPLANLEGGING');
    console.log('📍 Fra:', routeData.from, 'Til:', routeData.to);
    onLoadingChange(true);
    onError(null);

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

      console.log('📞 Sender Google Directions API-forespørsel...');
      
      // Create Promise wrapper for Directions API call with timeout
      const directionsPromise = new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('💥 Google Directions API TIMEOUT etter 20 sekunder');
          reject(new Error('API_TIMEOUT'));
        }, 20000);

        directionsServiceRef.current!.route(request, (result, status) => {
          clearTimeout(timeout);
          console.log('🗺️ Google Directions API respons:', status);
          
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(status));
          }
        });
      });

      const result = await directionsPromise;
      
      console.log('✅ Google Maps rute beregnet');
      console.log('🗺️ Setter rute på kartet med DirectionsRenderer...');
      
      // Sørg for at DirectionsRenderer er koblet til kartet
      if (directionsRendererRef.current && mapInstanceRef.current) {
        directionsRendererRef.current.setMap(mapInstanceRef.current);
        directionsRendererRef.current.setDirections(result);
        
        // Lag egne start og slutt-markører som på det gamle kartet
        const route = result.routes[0];
        const leg = route.legs[0];
        
        // Start-markør (grønn som på det gamle kartet)
        const startMarker = new google.maps.Marker({
          position: leg.start_location,
          map: mapInstanceRef.current,
          title: `Start: ${routeData.from}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
        
        // Legg til klikk-event for start-markør
        startMarker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            maxWidth: 250,
            disableAutoPan: false,
            pixelOffset: new google.maps.Size(0, -10),
            zIndex: 10000,
            content: `
              <style>
                .gm-style .gm-style-iw-c {
                  background: transparent !important;
                  z-index: 10000 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                .gm-style .gm-style-iw-d {
                  overflow: visible !important;
                  max-height: none !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .gm-style .gm-style-iw-d::-webkit-scrollbar {
                  display: none !important;
                }
                .gm-style .gm-style-iw-tc {
                  display: none !important;
                }
              </style>
              <div style="
                font-family: Inter, system-ui, sans-serif; 
                padding: 0; 
                line-height: 1.4; 
                width: 320px; 
                max-height: none;
                overflow: visible;
                background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(140 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
                border: 1px solid hsl(140 100% 50% / 0.4);
                border-radius: 12px;
                box-shadow: 0 8px 32px hsl(140 100% 50% / 0.2), 0 0 0 1px hsl(140 100% 50% / 0.15);
                backdrop-filter: blur(16px);
              ">
                <div style="
                  background: linear-gradient(135deg, hsl(140 100% 50%) 0%, hsl(120 100% 60%) 100%);
                  color: hsl(225 25% 6%);
                  padding: 16px;
                  position: relative;
                  overflow: hidden;
                ">
                  <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: hsl(225 25% 6% / 0.3);
                    border: 1px solid hsl(225 25% 6% / 0.2);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    color: hsl(225 25% 6%);
                    z-index: 10;
                    transition: all 0.2s ease;
                  " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 30% 20%, hsl(120 100% 70% / 0.3) 0%, transparent 50%);
                  "></div>
                  <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">🟢 STARTPUNKT</h4>
                  <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${routeData.from}</p>
                  <div style="margin-top: 8px; position: relative; z-index: 1;">
                    <span style="
                      background: hsl(225 25% 6% / 0.2);
                      color: hsl(225 25% 6%);
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: 600;
                      border: 1px solid hsl(225 25% 6% / 0.1);
                    ">RUTE START</span>
                  </div>
                </div>
                <div style="padding: 16px; background: transparent;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                    <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${leg.start_location.lat().toFixed(4)}, ${leg.start_location.lng().toFixed(4)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                    <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">📏 Total avstand</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.distance?.text || 'Beregner...'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                    <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">⏰ Estimert tid</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.duration?.text || 'Beregner...'}</span>
                  </div>
                </div>
              </div>
            `
          });
          infoWindow.open(mapInstanceRef.current, startMarker);
        });
        
        // Slutt-markør (rød som på det gamle kartet)
        const endMarker = new google.maps.Marker({
          position: leg.end_location,
          map: mapInstanceRef.current,
          title: `Slutt: ${routeData.to}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">M</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
        
        // Legg til klikk-event for slutt-markør
        endMarker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            maxWidth: 250,
            disableAutoPan: false,
            pixelOffset: new google.maps.Size(0, -10),
            zIndex: 10000,
            content: `
              <style>
                .gm-style .gm-style-iw-c {
                  background: transparent !important;
                  z-index: 10000 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                .gm-style .gm-style-iw-d {
                  overflow: visible !important;
                  max-height: none !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .gm-style .gm-style-iw-d::-webkit-scrollbar {
                  display: none !important;
                }
                .gm-style .gm-style-iw-tc {
                  display: none !important;
                }
              </style>
              <div style="
                font-family: Inter, system-ui, sans-serif; 
                padding: 0; 
                line-height: 1.4; 
                width: 320px; 
                max-height: none;
                overflow: visible;
                background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(280 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
                border: 1px solid hsl(280 100% 50% / 0.4);
                border-radius: 12px;
                box-shadow: 0 8px 32px hsl(280 100% 50% / 0.2), 0 0 0 1px hsl(280 100% 50% / 0.15);
                backdrop-filter: blur(16px);
              ">
                <div style="
                  background: linear-gradient(135deg, hsl(280 100% 50%) 0%, hsl(320 100% 60%) 100%);
                  color: hsl(225 25% 6%);
                  padding: 16px;
                  position: relative;
                  overflow: hidden;
                ">
                  <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: hsl(225 25% 6% / 0.3);
                    border: 1px solid hsl(225 25% 6% / 0.2);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    color: hsl(225 25% 6%);
                    z-index: 10;
                    transition: all 0.2s ease;
                  " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 70% 20%, hsl(320 100% 70% / 0.3) 0%, transparent 50%);
                  "></div>
                  <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">🔴 MÅLPUNKT</h4>
                  <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${routeData.to}</p>
                  <div style="margin-top: 8px; position: relative; z-index: 1;">
                    <span style="
                      background: hsl(225 25% 6% / 0.2);
                      color: hsl(225 25% 6%);
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: 600;
                      border: 1px solid hsl(225 25% 6% / 0.1);
                    ">DESTINASJON</span>
                  </div>
                </div>
                <div style="padding: 16px; background: transparent;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                    <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${leg.end_location.lat().toFixed(4)}, ${leg.end_location.lng().toFixed(4)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                    <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">📏 Total avstand</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.distance?.text || 'Beregner...'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                    <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">⏰ Total tid</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.duration?.text || 'Beregner...'}</span>
                  </div>
                </div>
              </div>
            `
          });
          infoWindow.open(mapInstanceRef.current, endMarker);
        });
        
        // Lagre markørene for cleanup
        allMarkersRef.current.push(startMarker, endMarker);
        
        // Lagre den beregnede ruten for ladestasjon-filtrering
        setCalculatedRoute(result);
        
        console.log('🎯 Rute er satt på kartet - ladestasjoner vil oppdateres automatisk!');
      } else {
        console.error('❌ DirectionsRenderer eller kart ikke tilgjengelig');
      }
      
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
      const needsCharging = remainingBattery < 20;
      const requiredStops = needsCharging ? Math.ceil(batteryUsagePercent / 60) : 0;
      
      // Create trip analysis
      const analysis: TripAnalysis = {
        totalDistance: distanceKm,
        totalTime: timeMinutes,
        totalChargingTime: requiredStops * 30,
        totalCost: requiredStops * 150,
        batteryUsage: batteryUsagePercent,
        requiredStops: requiredStops,
        weatherImpact: 'Normalt',
        routeEfficiency: distanceKm > 300 ? 'God' : 'Meget god',
      };

      onRouteCalculated(analysis);
      onLoadingChange(false);
      
      // Adjust map bounds to show entire route - men ikke hvis det overskriver ruten
      const bounds = new google.maps.LatLngBounds();
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
      });
      
      // Sett bounds med litt padding og etter en kort delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, 50);
        }
      }, 500);
      
      console.log('📊 Rute:', {
        distance: `${distanceKm.toFixed(0)} km`,
        time: `${Math.round(timeMinutes)} min`,
        batteryUsage: `${batteryUsagePercent.toFixed(0)}%`,
        stops: requiredStops
      });

    } catch (error: any) {
      console.error('❌ GOOGLE DIRECTIONS FEIL:', error);
      onLoadingChange(false);
      
      let errorMessage = 'Kunne ikke beregne rute';
      
      if (error.message === 'API_TIMEOUT') {
        errorMessage = 'Ruteberegning tok for lang tid. Google Maps svarer ikke.';
      } else {
        switch (error.message) {
          case google.maps.DirectionsStatus.NOT_FOUND:
            errorMessage = 'Fant ikke rute mellom destinasjonene';
            break;
          case google.maps.DirectionsStatus.ZERO_RESULTS:
            errorMessage = 'Ingen rute funnet. Sjekk destinasjonene.';
            break;
          case google.maps.DirectionsStatus.REQUEST_DENIED:
            errorMessage = 'API-nøkkelen mangler tilgang til Directions API.';
            break;
          case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
            errorMessage = 'For mange forespørsler til Google Maps. Vent litt.';
            break;
          default:
            errorMessage = `Rutefeil: ${error.message}`;
        }
      }
      
      onError(errorMessage);
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, selectedCar, routeTrigger, onRouteCalculated, onLoadingChange, onError]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      <div 
        ref={mapRef} 
        id="google-map-container" 
        style={{ 
          width: '100%', 
          height: '600px',
          backgroundColor: '#f0f0f0',
          border: '2px solid #007bff',
          borderRadius: '8px',
          minHeight: '600px' // Ensure minimum height
        }} 
      />
      {/* STATUSKARTET ER FULLSTENDIG SKJULT - INGENTING VISES! */}
      <div style={{
        display: 'none',
        visibility: 'hidden',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        position: 'absolute',
        left: -9999,
        top: -9999,
        zIndex: -1000
      } as React.CSSProperties}>
        SKJULT
      </div>
      
      {/* Loading overlay */}
      {!isMapInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(240, 240, 240, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#666',
          borderRadius: '8px',
          zIndex: 999
        }}>
          🔄 Laster Google Maps...
        </div>
      )}
    </div>
  );
};

export default GoogleRouteMap;