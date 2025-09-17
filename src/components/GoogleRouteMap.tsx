import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

// Interfaces
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

  // Initialize Google Maps
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
          region: 'NO',
          language: 'no'
        });

        await loader.load();
        console.log('✅ Google Maps API lastet');

        if (!mapRef.current) {
          onError('Kartcontainer ikke tilgjengelig');
          onLoadingChange(false);
          return;
        }

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControl: true,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        
        // Initialize directions service and renderer
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
        
        directionsRendererRef.current.setMap(map);

        console.log('✅ Google Maps initialisert');
        onLoadingChange(false);
        onMapLoad?.(map);

      } catch (err) {
        console.error('❌ Feil ved initialisering av Google Maps:', err);
        onError('Kunne ikke laste Google Maps. Sjekk internetforbindelsen.');
        onLoadingChange(false);
      }
    };

    initializeMap();
  }, [center, zoom, onMapLoad, onLoadingChange, onError]);

  // Add charging station markers
  useEffect(() => {
    if (!mapInstanceRef.current || !chargingStations || chargingStations.length === 0) {
      return;
    }

    console.log(`🔌 Legger til ${chargingStations.length} ladestasjoner på kartet`);

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Add new charging station markers
    chargingStations.forEach(station => {
      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: mapInstanceRef.current!,
        title: `${station.name}\n${station.available}/${station.total} tilgjengelig\n${station.cost} kr/kWh`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 7h10v10H7z"></path>
              <path d="m12 4-2 3h4l-2-3z"></path>
              <path d="M12 14v3"></path>
            </svg>
          `),
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10)
        }
      });

      chargingStationMarkersRef.current.push(marker);
    });
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
        
        // Adjust map bounds to show entire route
        const bounds = new google.maps.LatLngBounds();
        route.legs.forEach(leg => {
          leg.steps.forEach(step => {
            bounds.extend(step.start_location);
            bounds.extend(step.end_location);
          });
        });
        mapInstanceRef.current!.fitBounds(bounds);
        
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
    };

    calculateRoute();
  }, [routeData, selectedCar, routeTrigger, onRouteCalculated, onLoadingChange, onError]);

  return <div 
    ref={mapRef} 
    id="google-map-container" 
    style={{ width: '100%', height: '500px' }} 
  />;
};

export default GoogleRouteMap;