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

      } catch (error: any) {
        console.error('❌ Google Maps initialization failed:', error);
        onError(`Google Maps kunne ikke lastes: ${error.message}`);
        onLoadingChange(false);
      }
    };

    initializeMap();
  }, []);

  // Check if station is near route (within 2km)
  const isStationNearRoute = useCallback((station: ChargingStation): boolean => {
    if (!calculatedRoute || !window.google?.maps?.geometry) {
      return false;
    }
    
    const stationPos = new google.maps.LatLng(station.latitude, station.longitude);
    const route = calculatedRoute.routes[0];
    
    // Check distance to overview path points
    for (const point of route.overview_path) {
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        stationPos,
        point
      );
      
      if (distance <= 2000) { // 2km radius
        return true;
      }
    }
    
    // Also check distance to detailed route steps for more precision
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        // Check start and end points of each step
        const distanceToStart = window.google.maps.geometry.spherical.computeDistanceBetween(
          stationPos,
          step.start_location
        );
        const distanceToEnd = window.google.maps.geometry.spherical.computeDistanceBetween(
          stationPos,
          step.end_location
        );
        
        if (distanceToStart <= 2000 || distanceToEnd <= 2000) {
          return true;
        }
      }
    }
    
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
        
        // Prioritize stations with >50% availability
        if (availabilityA >= 0.5 && availabilityB < 0.5) return -1;
        if (availabilityB >= 0.5 && availabilityA < 0.5) return 1;
        
        // Then sort by highest availability
        return availabilityB - availabilityA;
      })[0];
    
    if (bestStation) {
      const availability = Math.round((bestStation.available / bestStation.total) * 100);
      console.log(`🎯 BESTE STASJON LANGS RUTEN: ${bestStation.name} (${availability}% tilgjengelig)`);
    }
    
    return bestStation || stationsNearRoute[0]; // Fallback to first station along route
  }, [calculatedRoute, chargingStations, isStationNearRoute]);

  // Calculate required charging locations based on range
  const getRequiredChargingStations = useCallback((): ChargingStation[] => {
    if (!calculatedRoute || !selectedCar || !routeData.batteryPercentage) {
      return [];
    }

    const route = calculatedRoute.routes[0];
    const totalDistance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;
    
    // Current range available with battery percentage
    const currentRange = (routeData.batteryPercentage / 100) * selectedCar.range;
    
    console.log(`🔋 RANGE ANALYSIS:`, {
      totalDistance: `${totalDistance.toFixed(1)} km`,
      carRange: `${selectedCar.range} km`,
      batteryLevel: `${routeData.batteryPercentage}%`,
      currentRange: `${currentRange.toFixed(1)} km`,
      needsCharging: currentRange < totalDistance
    });

    // If we can reach destination without charging, no required stops
    if (currentRange >= totalDistance) {
      console.log('✅ Kan nå destinasjon uten å lade');
      return [];
    }

    // Find the first required charging stop
    let distanceTraveled = 0;
    const requiredStations: ChargingStation[] = [];
    
    // We need to charge when we've used up our current range
    const chargeNeededAt = currentRange * 0.9; // Add 10% safety margin
    
    // Find closest charging station to the point where we need to charge
    const stationsNearRoute = chargingStations.filter(station => isStationNearRoute(station));
    
    if (stationsNearRoute.length > 0) {
      // For now, find the best station within our range
      const reachableStations = stationsNearRoute.filter(station => {
        // Calculate approximate distance to station along the route
        const routePath = route.overview_path;
        let closestDistanceToRoute = Infinity;
        
        routePath.forEach((point, index) => {
          const distanceToPoint = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(station.latitude, station.longitude),
            point
          ) / 1000; // Convert to km
          
          if (distanceToPoint < closestDistanceToRoute) {
            closestDistanceToRoute = distanceToPoint;
          }
        });
        
        // Station is reachable if it's within our current range
        return closestDistanceToRoute <= chargeNeededAt;
      });

      if (reachableStations.length > 0) {
        // Pick the best reachable station
        const bestReachableStation = reachableStations
          .sort((a, b) => {
            const availabilityA = a.available / a.total;
            const availabilityB = b.available / b.total;
            return availabilityB - availabilityA;
          })[0];
        
        requiredStations.push(bestReachableStation);
        console.log(`🚨 OBLIGATORISK LADESTASJON: ${bestReachableStation.name} - must charge here to reach destination`);
      }
    }

    return requiredStations;
  }, [calculatedRoute, chargingStations, selectedCar, routeData.batteryPercentage, isStationNearRoute]);

  // Add charging station markers
  useEffect(() => {
    if (!mapInstanceRef.current || !chargingStations || chargingStations.length === 0) {
      return;
    }

    console.log(`🔌 Legger til ${chargingStations.length} ladestasjoner på kartet`);

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Find best station along route
    const bestStationAlongRoute = getBestStationAlongRoute();

    // Find required charging stations
    const requiredChargingStations = getRequiredChargingStations();

    // Add new charging station markers
    chargingStations.forEach(station => {
      const isRecommendedAlongRoute = bestStationAlongRoute && station.id === bestStationAlongRoute.id;
      const isNearRoute = calculatedRoute && isStationNearRoute(station);
      const isRequiredForTrip = requiredChargingStations.some(req => req.id === station.id);
      
      console.log(`🔌 Station ${station.name}:`, {
        isRecommendedAlongRoute,
        isNearRoute, 
        isRequiredForTrip
      });
      
      // All stations on route and within 2km get red markers as requested
      const markerIcon = isRequiredForTrip ? {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#ff0000" stroke="#cc0000" stroke-width="2"/>
            <text x="14" y="18" text-anchor="middle" fill="white" font-size="16" font-weight="bold">!</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14)
      } : isRecommendedAlongRoute ? {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#FFD700" stroke="#cc0000" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="#000000" font-size="14" font-weight="bold">★</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      } : isNearRoute ? {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="8" fill="#ff0000" stroke="#cc0000" stroke-width="1"/>
            <text x="9" y="13" text-anchor="middle" fill="white" font-size="12" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(18, 18),
        anchor: new google.maps.Point(9, 9)
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
        title: `${station.name}\n${station.available}/${station.total} tilgjengelig (${Math.round((station.available / station.total) * 100)}%)\n${station.cost} kr/kWh${isRequiredForTrip ? '\n🚨 OBLIGATORISK LADESTOPP' : isRecommendedAlongRoute ? '\n⭐ ANBEFALT LANGS RUTEN' : ''}`,
        zIndex: isRequiredForTrip ? 2000 : (isRecommendedAlongRoute ? 1000 : (isNearRoute ? 100 : 10))
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${station.name}</h3>
            <p><strong>Tilgjengelig:</strong> ${station.available}/${station.total} (${Math.round((station.available / station.total) * 100)}%)</p>
            <p><strong>Effekt:</strong> ${station.power}</p>
            <p><strong>Pris:</strong> ${station.cost} kr/kWh</p>
            <p><strong>Leverandør:</strong> ${station.provider}</p>
            <p style="font-size: 12px; color: #666;">${station.address}</p>
            ${isRequiredForTrip ? '<div style="padding: 5px; background: #ff0000; color: white; border-radius: 3px; text-align: center; font-weight: bold;">🚨 OBLIGATORISK LADESTOPP</div>' : ''}
            ${isRecommendedAlongRoute ? '<div style="padding: 5px; background: #FFD700; border-radius: 3px; text-align: center; font-weight: bold;">⭐ ANBEFALT LANGS RUTEN</div>' : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      chargingStationMarkersRef.current.push(marker);
    });
  }, [chargingStations, calculatedRoute, getBestStationAlongRoute, getRequiredChargingStations]);

  // Calculate route when trigger changes
  const calculateRoute = useCallback(async () => {
    console.log('🛣️ STARTING ROUTE CALCULATION', {
      hasMap: !!mapInstanceRef.current,
      from: routeData.from,
      to: routeData.to,
      via: routeData.via
    });

    if (!mapInstanceRef.current || !routeData.from || !routeData.to) {
      console.log('❌ Missing requirements for route calculation');
      return;
    }

    try {
      onLoadingChange(true);
      onError(null);
      console.log('📍 Creating DirectionsService...');

      const directionsService = new google.maps.DirectionsService();
      
      const waypoints = routeData.via ? [{ location: routeData.via, stopover: true }] : [];
      
      const request: google.maps.DirectionsRequest = {
        origin: routeData.from,
        destination: routeData.to,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
      };

      console.log('🚗 Making directions request...', request);
      const result = await directionsService.route(request);
      console.log('✅ Route calculated successfully', result);
      
      if (!directionsRendererRef.current) {
        console.log('🎨 Creating new DirectionsRenderer...');
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 1000
          }
        });
        directionsRendererRef.current.setMap(mapInstanceRef.current);
        console.log('✅ DirectionsRenderer created and set to map');
      }

      console.log('🎯 Setting directions on renderer...');
      directionsRendererRef.current.setDirections(result);
      setCalculatedRoute(result);
      console.log('✅ Route set successfully');

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
      console.log('📊 Trip analysis completed', analysis);

    } catch (error: any) {
      console.error('❌ Route calculation failed:', error);
      onError(`Ruteberegning feilet: ${error.message}`);
    } finally {
      onLoadingChange(false);
      console.log('🏁 Route calculation finished');
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, selectedCar, onRouteCalculated, onLoadingChange, onError]);

  // Calculate route when trigger changes (manual route planning)
  useEffect(() => {
    console.log('🎯 routeTrigger changed:', routeTrigger);
    if (routeTrigger > 0 && !calculatedRoute) { // Only calculate if no route exists
      console.log('🚀 Triggering calculateRoute...');
      calculateRoute();
    } else if (routeTrigger > 0 && calculatedRoute) {
      console.log('🔄 Route already exists, keeping current route');
    }
  }, [calculateRoute, routeTrigger, calculatedRoute]);

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