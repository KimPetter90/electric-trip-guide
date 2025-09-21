import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { RouteOptimizer, type OptimizedChargingPlan } from '@/utils/routeCalculation';
import { type RouteOption } from '@/components/RouteSelector';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, LocateFixed, Navigation, Ship, Clock } from "lucide-react";
import { toast } from "sonner";
import ComprehensiveFerrySchedule from '@/components/ComprehensiveFerrySchedule';

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
  estimatedTime: number;
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
  selectedRouteId?: string | null;
  routeOptions?: RouteOption[];
  routeTrigger: number;
  onRouteCalculated: (analysis: TripAnalysis) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
}> = ({ center, zoom, onMapLoad, chargingStations, routeData, selectedCar, selectedRouteId, routeOptions, routeTrigger, onRouteCalculated, onLoadingChange, onError }) => {
  
  // Refs and state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const allMarkersRef = useRef<google.maps.Marker[]>([]);
  const chargingStationMarkersRef = useRef<google.maps.Marker[]>([]);
  const userLocationMarker = useRef<google.maps.Marker | null>(null);
  const routeDistanceCache = useRef(new Map());
  const watchId = useRef<number | null>(null);
  
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [allFerryTimes, setAllFerryTimes] = useState<any[]>([]);
  const [loadedStations, setLoadedStations] = useState<ChargingStation[]>([]);

  // KRITISK FIX: Last ladestasjoner fra database
  useEffect(() => {
    const loadChargingStations = async () => {
      try {
        console.log('🔌 GoogleRouteMap: STARTER HENTING AV LADESTASJONER...');
        const { data, error } = await supabase
          .from('charging_stations')
          .select('*');
        
        if (error) {
          console.error('❌ FEIL ved henting av ladestasjoner:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log(`✅ GoogleRouteMap: HENTET ${data.length} LADESTASJONER`);
          const mappedStations: ChargingStation[] = data.map(station => ({
            id: station.id,
            name: station.name,
            location: station.location,
            latitude: station.latitude,
            longitude: station.longitude,
            available: station.available,
            total: station.total,
            fast_charger: station.fast_charger,
            power: station.power,
            cost: station.cost,
            provider: station.provider || 'Ukjent',
            address: station.address || station.location
          }));
          setLoadedStations(mappedStations);
        }
      } catch (err) {
        console.error('💥 GoogleRouteMap: EXCEPTION ved henting:', err);
      }
    };

    loadChargingStations();
  }, []);

  // Initialize Google Maps only once
  useEffect(() => {
    if (typeof window === 'undefined' || isMapInitialized) return;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Starting Google Maps initialization...');
        onLoadingChange(true);
        onError(null);
        
        // Get API key from Supabase function
        console.log('🔑 Fetching Google Maps API key...');
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('google-maps-proxy');
        
        console.log('🔑 API key response:', { tokenData, tokenError });
        
        if (tokenError || !tokenData?.apiKey) {
          console.error('❌ API key fetch failed:', tokenError);
          throw new Error('Kunne ikke hente Google Maps API-nøkkel');
        }

        const loader = new Loader({
          apiKey: tokenData.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();
        
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          zoomControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
              google.maps.MapTypeId.HYBRID,
              google.maps.MapTypeId.TERRAIN
            ]
          },
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
        });

        mapInstanceRef.current = map;
        setIsMapInitialized(true);

        if (onMapLoad) {
          onMapLoad(map);
        }

        onLoadingChange(false);

      } catch (error: any) {
        console.error('❌ Google Maps initialization failed:', error);
        onError(`Google Maps kunne ikke lastes: ${error.message}`);
        onLoadingChange(false);
      }
    };

    initializeMap();
  }, []);

  // Check if station is near route - OPTIMIZED VERSION
  const isStationNearRoute = useCallback((station: ChargingStation): boolean => {
    if (!calculatedRoute || !window.google?.maps?.geometry) {
      return false;
    }

    const stationPos = new google.maps.LatLng(station.latitude, station.longitude);
    const route = calculatedRoute.routes[0];
    
    // Quick check using overview path only (much faster)
    const overviewPath = route.overview_path;
    if (overviewPath && overviewPath.length > 0) {
      let minDistance = Infinity;
      
      // Sample every 5th point instead of every point for performance
      for (let i = 0; i < overviewPath.length; i += 5) {
        const pathPoint = overviewPath[i];
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          stationPos, pathPoint
        );
        minDistance = Math.min(minDistance, distance);
        
        // Early exit if we find a close station
        if (minDistance <= 3000) return true;
      }
    }
    
    return false;
  }, [calculatedRoute]);

  // Find best station along route using advanced optimization - CACHED
  const getBestStationAlongRoute = useCallback(async (): Promise<ChargingStation | null> => {
    if (!calculatedRoute || !chargingStations.length || !selectedCar) return null;
    
    // Find all stations near the route (optimized)
    const stationsNearRoute = chargingStations.filter(station => isStationNearRoute(station));
    
    console.log('🗺️ Route and station analysis:', {
      totalStations: chargingStations.length,
      stationsNearRoute: stationsNearRoute.length,
      nearRouteStations: stationsNearRoute.map(s => `${s.name} (${s.location})`),
      routeLegs: calculatedRoute?.routes[0]?.legs?.map(leg => `${leg.start_address} → ${leg.end_address}`)
    });
    
    if (stationsNearRoute.length === 0) return null;
    
    // Skip optimization service if route is short to improve performance
    const routeDistance = calculatedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;
    if (routeDistance < 50) {
      return getSimpleBestStation(stationsNearRoute);
    }
    
    try {
      console.log('🔋 Optimization request data:', {
        routeDistance,
        batteryPercentage: routeData.batteryPercentage,
        carRange: selectedCar.range,
        currentBatteryRange: (selectedCar.range * routeData.batteryPercentage) / 100
      });
      
      // Call optimization service with weather, trailer, and battery data
      const { data, error } = await supabase.functions.invoke('optimize-charging-station', {
        body: {
          stations: stationsNearRoute,
          routeData: {
            from: routeData.from,
            to: routeData.to,
            trailerWeight: routeData.trailerWeight,
            batteryPercentage: routeData.batteryPercentage,
            totalDistance: routeDistance,
            estimatedTime: calculatedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60
          },
          carData: {
            range: selectedCar.range,
            consumption: selectedCar.consumption,
            batteryCapacity: selectedCar.batteryCapacity
          }
        }
      });
      
      if (error) {
        return getSimpleBestStation(stationsNearRoute);
      }
      
      const result = data?.recommendedStation;
      
      console.log('🎯 Optimization result:', data);
      
      // Check if charging is not needed
      if (data?.analysis?.chargingNeeded === false) {
        console.log('✅ No charging needed according to optimization service');
        return null; // No charging station recommended
      }
      
      if (result) {
        return result;
      }
      
      return getSimpleBestStation(stationsNearRoute);
      
    } catch (error) {
      return getSimpleBestStation(stationsNearRoute);
    }
  }, [calculatedRoute, chargingStations, isStationNearRoute, selectedCar, routeData]);
  
  // Simple fallback logic - prioriterer stasjoner langs ruten
  const getSimpleBestStation = (stationsNearRoute: ChargingStation[]): ChargingStation | null => {
    // Først prøv hurtigladere med god tilgjengelighet
    const fastChargersWithAvailability = stationsNearRoute
      .filter(s => s.fast_charger && (s.available / s.total) > 0.3)
      .sort((a, b) => {
        const availabilityA = a.available / a.total;
        const availabilityB = b.available / b.total;
        return availabilityB - availabilityA; // Høyest tilgjengelighet først
      });
    
    if (fastChargersWithAvailability.length > 0) {
      return fastChargersWithAvailability[0];
    }
    
    // Fallback til beste tilgjengelige stasjon
    const bestAvailable = stationsNearRoute
      .sort((a, b) => (b.available / b.total) - (a.available / a.total))[0];
    
    return bestAvailable || stationsNearRoute[0];
  };

  // Add charging station markers - SHOW IMMEDIATELY WHEN MAP LOADS
  useEffect(() => {
    const stationsToUse = loadedStations.length > 0 ? loadedStations : chargingStations;
    console.log('🗺️ Charging stations effect triggered:', {
      mapExists: !!mapInstanceRef.current,
      loadedStationsCount: loadedStations.length,
      propsStationsCount: chargingStations?.length || 0,
      usingStations: stationsToUse?.length || 0
    });
    
    if (!mapInstanceRef.current) {
      console.log('❌ Skipping charging stations - map not ready');
      return;
    }
    
    if (!stationsToUse || stationsToUse.length === 0) {
      console.log('❌ Skipping charging stations - no stations available');
      return;
    }
    
    console.log('✅ Adding charging station markers to map');
    
    // Clear distance cache when recalculating
    routeDistanceCache.current.clear();

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Find best station along route (async)
    let bestStationAlongRoute: ChargingStation | null = null;
    
    
    const findBestStationAndRender = async () => {
      bestStationAlongRoute = await getBestStationAlongRoute();
      
      // Add new charging station markers - BRUK STATIONSTOUSE
      stationsToUse.forEach(station => {
        const isRecommendedAlongRoute = bestStationAlongRoute && 
          (station.id === bestStationAlongRoute.id || station.name === bestStationAlongRoute.name);
        const isNearRoute = calculatedRoute && isStationNearRoute(station);
        
        // Choose marker icon
        const markerIcon = isRecommendedAlongRoute ? {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="#000000" font-size="14" font-weight="bold">★</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        } : isNearRoute ? {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill="#ff0000" stroke="#990000" stroke-width="2"/>
              <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⚡</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(16, 16),
          anchor: new google.maps.Point(8, 8)
        } : {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="#00ff41" stroke="#00cc33" stroke-width="1"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(12, 12),
          anchor: new google.maps.Point(6, 6)
        };

        const marker = new google.maps.Marker({
          position: { lat: station.latitude, lng: station.longitude },
          map: mapInstanceRef.current!,
          icon: markerIcon,
          title: `${station.name}\n${station.available}/${station.total} tilgjengelig\n${station.cost} kr/kWh${isRecommendedAlongRoute ? '\n⭐ OPTIMALISERT ANBEFALING' : ''}`,
          zIndex: isRecommendedAlongRoute ? 1000 : (isNearRoute ? 100 : 10)
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${station.name}</h3>
              <p><strong>Tilgjengelig:</strong> ${station.available}/${station.total}</p>
              <p><strong>Effekt:</strong> ${station.power}</p>
              <p><strong>Pris:</strong> ${station.cost} kr/kWh</p>
              <p><strong>Leverandør:</strong> ${station.provider}</p>
              <p style="font-size: 12px; color: #666;">${station.address}</p>
              ${isRecommendedAlongRoute ? '<div style="padding: 5px; background: #FFD700; border-radius: 3px; text-align: center; font-weight: bold;">⭐ OPTIMALISERT ANBEFALING</div>' : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        chargingStationMarkersRef.current.push(marker);
      });
    };
    
    // Execute async function
    findBestStationAndRender();
    
  }, [loadedStations, chargingStations, calculatedRoute, getBestStationAlongRoute, isStationNearRoute]);

  // Force re-render markers when route changes

  // Calculate route when trigger changes
  const calculateRoute = useCallback(async () => {
    console.log('🛣️ CALCULATEROUTE STARTET:', { 
      mapExists: !!mapInstanceRef.current, 
      from: routeData.from, 
      to: routeData.to 
    });
    
    if (!mapInstanceRef.current || !routeData.from || !routeData.to) {
      console.log('❌ CALCULATEROUTE AVBRUTT - manglende requirements');
      return;
    }

    try {
      onLoadingChange(true);
      onError(null);

      const directionsService = new google.maps.DirectionsService();
      
      const waypoints = routeData.via ? [{ location: routeData.via, stopover: true }] : [];
      
      // Configure route parameters based on selected route type
      let avoidHighways = false;
      let avoidTolls = false;
      let optimizeWaypoints = true;
      
      if (selectedRouteId === 'eco') {
        // Eco route: avoid highways and tolls for more efficient driving
        avoidHighways = true;
        avoidTolls = true;
      } else if (selectedRouteId === 'shortest') {
        // Shortest route: focus on distance optimization
        optimizeWaypoints = true;
        avoidHighways = false;
        avoidTolls = false;
      } else {
        // Fastest route (default): use highways for speed
        avoidHighways = false;
        avoidTolls = false;
      }
      
      // Rens stedsnavn - fjern alt etter (
      const cleanOrigin = routeData.from.split('(')[0].trim();
      const cleanDestination = routeData.to.split('(')[0].trim();
      const cleanVia = routeData.via ? routeData.via.split('(')[0].trim() : undefined;
      
      const cleanedWaypoints = cleanVia ? [{ location: cleanVia, stopover: true }] : [];
      
      const request: google.maps.DirectionsRequest = {
        origin: cleanOrigin,
        destination: cleanDestination,
        waypoints: cleanedWaypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        optimizeWaypoints: optimizeWaypoints,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls
      };

      console.log('🔍 SENDER DIRECTIONS REQUEST (rensede navn):', { 
        originalFrom: routeData.from, 
        cleanOrigin: cleanOrigin,
        originalTo: routeData.to,
        cleanDestination: cleanDestination,
        request 
      });
      
      directionsService.route(request, (result, status) => {
        console.log('📍 DIRECTIONS RESPONS:', { status, result: !!result });
        
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('✅ Route calculated successfully for:', selectedRouteId, 'with distance:', result.routes[0].legs[0].distance?.text);
          
          if (!directionsRendererRef.current) {
            console.log('🔧 Creating new DirectionsRenderer');
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: selectedRouteId === 'eco' ? '#8b5cf6' : selectedRouteId === 'shortest' ? '#10b981' : '#2563eb',
                strokeWeight: 6,
                strokeOpacity: 1.0
              },
              markerOptions: {
                visible: true
              }
            });
          } else {
            // Update line color for existing renderer
            directionsRendererRef.current.setOptions({
              polylineOptions: {
                strokeColor: selectedRouteId === 'eco' ? '#8b5cf6' : selectedRouteId === 'shortest' ? '#10b981' : '#2563eb',
                strokeWeight: 6,
                strokeOpacity: 1.0
              },
              markerOptions: {
                visible: true
              }
            });
          }

          // ALWAYS set map again to ensure it's attached
          directionsRendererRef.current.setMap(mapInstanceRef.current);
          console.log('🗺️ Setting directions on renderer...');
          directionsRendererRef.current.setDirections(result);
          console.log('✅ Directions set successfully');
          
          // Adjust map viewport to show the entire route
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapInstanceRef.current!.fitBounds(bounds);
          console.log('📍 Map viewport adjusted to show route');
          
          setCalculatedRoute(result);

          // Calculate trip analysis
          const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;
          const totalTime = result.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60;
          
          const analysis: TripAnalysis = {
            totalDistance,
            estimatedTime: totalTime,
            batteryUsage: selectedCar ? (totalDistance / selectedCar.range) * 100 : 0,
            requiredStops: selectedCar ? Math.max(0, Math.ceil((totalDistance / selectedCar.range) - (routeData.batteryPercentage / 100))) : 0,
            weatherImpact: 'Moderat',
            routeEfficiency: 'God'
          };

          onRouteCalculated(analysis);
          onLoadingChange(false);
        } else {
          console.error('❌ Directions request failed:', status);
          onError(`Ruteberegning feilet: ${status}`);
          onLoadingChange(false);
        }
      });

    } catch (error: any) {
      console.error('❌ Route calculation failed:', error);
      onError(`Ruteberegning feilet: ${error.message}`);
      onLoadingChange(false);
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, selectedCar, selectedRouteId, onRouteCalculated, onLoadingChange, onError]);

  useEffect(() => {
    // KUN beregn rute når routeTrigger er eksplisitt satt (ikke 0)
    if (routeTrigger > 0) {
      console.log('🎯 Route trigger changed to:', routeTrigger, 'for route:', selectedRouteId);
      console.log('🛣️ KALLER CALCULATEROUTE fra useEffect - MANUELL TRIGGER');
      calculateRoute();
    }
  }, [calculateRoute, routeTrigger, selectedRouteId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      allMarkersRef.current.forEach(marker => marker.setMap(null));
      chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (userLocationMarker.current) {
        userLocationMarker.current.setMap(null);
      }
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
    </div>
  );
};

export default GoogleRouteMap;