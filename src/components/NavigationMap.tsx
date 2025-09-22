import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG } from '@/config/app';

interface NavigationMapProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  };
  routeData?: {
    from: string;
    to: string;
  };
  navigationMode?: boolean;
  zoom?: number;
  center?: { lat: number; lng: number };
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  userLocation,
  routeData,
  navigationMode = false,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  center = MAP_CONFIG.DEFAULT_CENTER,
  onMapLoad
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/functions/v1/mapbox-token', {
          headers: {
            'Authorization': `Bearer ${(window as any).supabaseAnonKey}`
          }
        });
        const data = await response.json();
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: zoom,
      pitch: navigationMode ? 60 : 0, // Bil-perspektiv når i navigasjonsmodus
      bearing: 0,
      antialias: true
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
        showZoom: !navigationMode // Skjul zoom i navigasjonsmodus
      }),
      'top-right'
    );

    map.current.on('load', () => {
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
      
      // Add user location source
      map.current?.addSource('user-location', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {}
        }
      });

      // Add user location layer with arrow
      map.current?.addLayer({
        id: 'user-location-arrow',
        type: 'symbol',
        source: 'user-location',
        layout: {
          'icon-image': 'airport', // Temporary, will be replaced with custom arrow
          'icon-size': navigationMode ? 1.5 : 1,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        },
        paint: {
          'icon-color': '#1E40AF',
          'icon-halo-color': '#FFFFFF',
          'icon-halo-width': 2
        }
      });

      // Add accuracy circle
      map.current?.addLayer({
        id: 'user-location-accuracy',
        type: 'circle',
        source: 'user-location',
        paint: {
          'circle-radius': {
            base: 1.75,
            stops: [[12, 2], [22, 180]]
          },
          'circle-color': '#1E40AF',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#1E40AF',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.3
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, navigationMode]);

  // Update user location
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const coordinates: [number, number] = [userLocation.longitude, userLocation.latitude];
    
    // Update source data
    const source = map.current.getSource('user-location') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          bearing: userLocation.heading || 0,
          speed: userLocation.speed || 0,
          accuracy: userLocation.accuracy || 0
        }
      });
    }

    // In navigation mode, follow user with bearing
    if (navigationMode) {
      map.current.easeTo({
        center: coordinates,
        zoom: MAP_CONFIG.NAVIGATION_ZOOM,
        bearing: userLocation.heading || 0,
        pitch: 60,
        duration: 1000
      });
    }
  }, [userLocation, navigationMode]);

  // Update map center and zoom
  useEffect(() => {
    if (!map.current || navigationMode) return; // Don't override in navigation mode

    map.current.easeTo({
      center: [center.lng, center.lat],
      zoom: zoom,
      duration: 1000
    });
  }, [center, zoom, navigationMode]);

  return (
    <div ref={mapContainer} className="w-full h-full relative">
      {navigationMode && (
        <div className="absolute top-4 left-4 z-10 bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Navigasjons-modus
          </div>
          {userLocation?.speed && (
            <div className="text-xs opacity-80 mt-1">
              {Math.round((userLocation.speed || 0) * 3.6)} km/t
            </div>
          )}
        </div>
      )}
    </div>
  );
};