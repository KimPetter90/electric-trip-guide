import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface FirstPersonNavigationProps {
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
  isActive: boolean;
  onExit: () => void;
}

export const FirstPersonNavigation: React.FC<FirstPersonNavigationProps> = ({
  userLocation,
  routeData,
  isActive,
  onExit
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // For now, use a placeholder - you'll need to set up the token
        const response = await fetch('/api/mapbox-token');
        const data = await response.json();
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Fallback - you can set your token here temporarily
        setMapboxToken('pk.your_mapbox_token_here');
      }
    };
    fetchToken();
  }, []);

  // Initialize map with street-level view
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !isActive) return;

    mapboxgl.accessToken = mapboxToken;

    const initialLat = userLocation?.latitude || 59.9139;
    const initialLng = userLocation?.longitude || 10.7522;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 19, // Very close zoom for street level
      pitch: 0, // Completely flat - ground level view
      bearing: userLocation?.heading || 0,
      antialias: true,
      dragRotate: false, // Disable manual rotation
      dragPan: false, // Disable manual panning
      scrollZoom: false, // Disable zoom
      doubleClickZoom: false,
      touchZoomRotate: false
    });

    // Remove all controls for immersive experience
    map.current.on('load', () => {
      // Add user location indicator
      map.current?.addSource('user-location', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [initialLng, initialLat]
          },
          properties: {}
        }
      });

      // Add car icon
      map.current?.addLayer({
        id: 'user-car',
        type: 'symbol',
        source: 'user-location',
        layout: {
          'icon-image': 'car', // You'd need to load a car icon
          'icon-size': 1.5,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isActive]);

  // Update location and camera position
  useEffect(() => {
    if (!map.current || !userLocation || !isActive) return;

    const coordinates: [number, number] = [userLocation.longitude, userLocation.latitude];
    
    // Update user location
    const source = map.current.getSource('user-location') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          bearing: userLocation.heading || 0
        }
      });
    }

    // Move camera to follow user exactly - ground level perspective
    map.current.easeTo({
      center: coordinates,
      zoom: 20, // Maximum zoom for street-level detail
      bearing: userLocation.heading || 0,
      pitch: 0, // Completely flat, ground-level view
      duration: 1000
    });
  }, [userLocation, isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Map container - full screen */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top status bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-shadow">
          <div className="bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              GPS Aktiv
            </div>
          </div>
          <div className="bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
            {new Date().toLocaleTimeString('no-NO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        {/* Large navigation instruction - center top */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-white">
          <div className="bg-blue-600/95 px-8 py-6 rounded-xl shadow-2xl backdrop-blur-sm border border-blue-400/50">
            <div className="text-center">
              <div className="text-5xl mb-3">↱</div>
              <div className="text-3xl font-bold mb-2">500m</div>
              <div className="text-xl font-semibold">Sving til høyre</div>
              <div className="text-lg opacity-90">på Kongens gate</div>
            </div>
          </div>
        </div>
        
        {/* Speed and progress - bottom */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/80 rounded-xl p-6 backdrop-blur-sm border border-white/20">
            <div className="grid grid-cols-3 gap-6 text-center text-white">
              <div>
                <div className="text-4xl font-bold text-green-400">
                  {Math.round((userLocation?.speed || 0) * 3.6)}
                </div>
                <div className="text-sm opacity-80 mt-1">km/t</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">12.5</div>
                <div className="text-sm opacity-80 mt-1">km igjen</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-400">15:42</div>
                <div className="text-sm opacity-80 mt-1">ankomst</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: '35%' }} />
            </div>
          </div>
        </div>

        {/* Additional info - left side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white">
          <div className="bg-black/70 p-4 rounded-lg backdrop-blur-sm space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{routeData?.to || 'Destinasjon'}</div>
              <div className="text-sm opacity-80">via E6</div>
            </div>
            <div className="text-center border-t border-white/20 pt-3">
              <div className="text-lg font-semibold">12 min</div>
              <div className="text-xs opacity-80">raskeste rute</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit button - top right */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-60 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors pointer-events-auto text-lg font-semibold"
      >
        Avslutt kjøring
      </button>
      
      {/* Car dashboard effect */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};