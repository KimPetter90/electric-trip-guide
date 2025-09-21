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

  // Initialize Google Maps only once
  useEffect(() => {
    if (typeof window === 'undefined' || isMapInitialized) return;

    const initializeMap = async () => {
      try {
        onLoadingChange(true);
        onError(null);
        console.log('🗺️ Initialiserer Google Maps...');

        // Get API key from Supabase function
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('google-maps-proxy');
        
        if (tokenError || !tokenData?.apiKey) {
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

        console.log('✅ Google Maps initialisert');
        onLoadingChange(false);

        // Trigger initial route calculation if we have route data
        if (routeData.from && routeData.to) {
          console.log('🎯 Triggering initial route calculation');
          setTimeout(() => calculateRoute(), 100);
        }

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
    
    // Optimize by checking fewer points and caching results
    const cacheKey = `${station.id}-${route.summary}`;
    if (routeDistanceCache.current.has(cacheKey)) {
      return routeDistanceCache.current.get(cacheKey);
    }
    
    // Check if station is near ANY point along the entire route path
    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      
      // Check start and end of each leg
      let distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        stationPos, leg.start_location
      );
      if (distance <= 2000) {
        routeDistanceCache.current.set(cacheKey, true);
        return true;
      }
      
      distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        stationPos, leg.end_location
      );
      if (distance <= 2000) {
        routeDistanceCache.current.set(cacheKey, true);
        return true;
      }
      
      // Check each step in detail
      for (let j = 0; j < leg.steps.length; j++) {
        const step = leg.steps[j];
        
        // Check step start and end
        distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          stationPos, step.start_location
        );
        if (distance <= 2000) {
          routeDistanceCache.current.set(cacheKey, true);
          return true;
        }
        
        distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          stationPos, step.end_location
        );
        if (distance <= 2000) {
          routeDistanceCache.current.set(cacheKey, true);
          return true;
        }
        
        // Also check path points if available
        if (step.path && step.path.length > 0) {
          for (let k = 0; k < step.path.length; k += 5) { // Sample every 5th point
            distance = window.google.maps.geometry.spherical.computeDistanceBetween(
              stationPos, step.path[k]
            );
            if (distance <= 2000) {
              routeDistanceCache.current.set(cacheKey, true);
              return true;
            }
          }
        }
      }
    }
    
    routeDistanceCache.current.set(cacheKey, false);
    return false;
    
  }, [calculatedRoute]);

  // Find best station along route
  const getBestStationAlongRoute = useCallback((): ChargingStation | null => {
    if (!calculatedRoute || !chargingStations.length) return null;
    
    // Find all stations near the route
    const stationsNearRoute = chargingStations.filter(station => isStationNearRoute(station));
    
    if (stationsNearRoute.length === 0) return null;
    
    // Choose best station based on availability and fast charging
    const bestStation = stationsNearRoute
      .filter(s => s.fast_charger) // Only fast charging
      .sort((a, b) => {
        const availabilityA = a.available / a.total;
        const availabilityB = b.available / b.total;
        return availabilityB - availabilityA; // Highest availability first
      })[0];
    
    if (bestStation) {
      console.log(`🎯 BESTE STASJON LANGS RUTEN: ${bestStation.name}`);
    }
    
    return bestStation || stationsNearRoute[0]; // Fallback to first station along route
  }, [calculatedRoute, chargingStations, isStationNearRoute]);

  // Add charging station markers
  useEffect(() => {
    if (!mapInstanceRef.current || !chargingStations || chargingStations.length === 0) {
      return;
    }

    console.log(`🔌 Legger til ${chargingStations.length} ladestasjoner på kartet`);
    
    // Clear distance cache when recalculating
    routeDistanceCache.current.clear();

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Find best station along route
    const bestStationAlongRoute = getBestStationAlongRoute();

    // Add new charging station markers
    chargingStations.forEach(station => {
      const isRecommendedAlongRoute = bestStationAlongRoute && station.id === bestStationAlongRoute.id;
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
            <circle cx="8" cy="8" r="7" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
            <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8)
      } : {
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
        icon: markerIcon,
        title: `${station.name}\n${station.available}/${station.total} tilgjengelig\n${station.cost} kr/kWh${isRecommendedAlongRoute ? '\n⭐ ANBEFALT LANGS RUTEN' : ''}`,
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
            ${isRecommendedAlongRoute ? '<div style="padding: 5px; background: #FFD700; border-radius: 3px; text-align: center; font-weight: bold;">⭐ ANBEFALT LANGS RUTEN</div>' : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      chargingStationMarkersRef.current.push(marker);
    });
  }, [chargingStations, calculatedRoute, getBestStationAlongRoute]);

  // Calculate route when trigger changes
  const calculateRoute = useCallback(async () => {
    console.log('🔄 calculateRoute called with:', {
      hasMap: !!mapInstanceRef.current,
      from: routeData.from,
      to: routeData.to,
      selectedRouteId,
      routeTrigger
    });
    
    if (!mapInstanceRef.current || !routeData.from || !routeData.to) {
      console.log('❌ Missing requirements for route calculation');
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
      
      console.log(`🗺️ Beregner ${selectedRouteId || 'standard'} rute med:`, {
        avoidHighways,
        avoidTolls,
        optimizeWaypoints
      });
      
      const request: google.maps.DirectionsRequest = {
        origin: routeData.from,
        destination: routeData.to,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        optimizeWaypoints: optimizeWaypoints,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls
      };

      const result = await directionsService.route(request);
      console.log('✅ Route calculated successfully for:', selectedRouteId, 'with distance:', result.routes[0].legs[0].distance?.text);
      
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: selectedRouteId === 'eco' ? '#8b5cf6' : selectedRouteId === 'shortest' ? '#10b981' : '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      } else {
        // Update line color for existing renderer
        directionsRendererRef.current.setOptions({
          polylineOptions: {
            strokeColor: selectedRouteId === 'eco' ? '#8b5cf6' : selectedRouteId === 'shortest' ? '#10b981' : '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
      }

      console.log('🗺️ Setting directions on renderer...', directionsRendererRef.current);
      directionsRendererRef.current.setDirections(result);
      console.log('✅ Directions set successfully');
      
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

    } catch (error: any) {
      console.error('❌ Route calculation failed:', error);
      onError(`Ruteberegning feilet: ${error.message}`);
    } finally {
      onLoadingChange(false);
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, selectedCar, selectedRouteId, onRouteCalculated, onLoadingChange, onError]);

  useEffect(() => {
    console.log('🎯 Route trigger changed to:', routeTrigger, 'for route:', selectedRouteId);
    calculateRoute();
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