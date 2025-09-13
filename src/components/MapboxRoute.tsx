import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Clock, DollarSign, AlertCircle } from "lucide-react";

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

interface MapboxRouteProps {
  isVisible: boolean;
  selectedCar: CarModel | null;
  routeData: RouteData;
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
}

const mockChargingStations: ChargingStation[] = [
  {
    id: "1",
    name: "Circle K Gardermoen",
    location: "Jessheim",
    lat: 60.1939,
    lng: 11.1004,
    chargeTime: 25,
    chargeAmount: 35,
    cost: 175,
    fastCharger: true
  },
  {
    id: "2", 
    name: "Ionity Lillehammer",
    location: "Lillehammer",
    lat: 61.1153,
    lng: 10.4662,
    chargeTime: 30,
    chargeAmount: 45,
    cost: 225,
    fastCharger: true
  },
  {
    id: "3",
    name: "Mer Gol",
    location: "Gol", 
    lat: 60.6856,
    lng: 9.0072,
    chargeTime: 35,
    chargeAmount: 50,
    cost: 250,
    fastCharger: true
  }
];

function MapboxRoute({ isVisible, selectedCar, routeData }: MapboxRouteProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token from Supabase Edge Function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/mapbox-proxy`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTQ0MDgsImV4cCI6MjA3MzM3MDQwOH0.KdDS_tT7LV7HuXN8Nw3dxUU3YRGobsJrkE2esDxgJH8`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.token) {
          setMapToken(data.token);
        } else {
          throw new Error('Ingen token mottatt');
        }
      } catch (err) {
        console.error('Feil ved henting av Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Ukjent feil');
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchMapboxToken();
    }
  }, [isVisible]);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapToken || !isVisible) return;

    // Cleanup existing map
    if (map.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current.remove();
      map.current = null;
    }

    try {
      mapboxgl.accessToken = mapToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [10.7522, 59.9139], // Oslo center
        zoom: 6,
        pitch: 45,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        if (!map.current) return;

        // Add charging stations as markers
        mockChargingStations.forEach((station, index) => {
          const el = document.createElement('div');
          el.className = 'charging-marker';
          el.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00ff88, #00ccff);
            border: 2px solid white;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
          `;
          el.textContent = (index + 1).toString();
          
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)';
            el.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.8)';
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
          });

          const marker = new mapboxgl.Marker(el)
            .setLngLat([station.lng, station.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px; color: #333;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${station.name}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${station.location}</p>
                  <div style="display: flex; gap: 8px; font-size: 11px;">
                    <span>⚡ ${station.chargeAmount} kWh</span>
                    <span>⏱️ ${station.chargeTime} min</span>
                    <span>💰 ${station.cost} kr</span>
                  </div>
                </div>
              `))
            .addTo(map.current!);

          markers.current.push(marker);
        });

        // Add route line
        map.current!.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [10.7522, 59.9139], // Oslo
                [11.1004, 60.1939], // Gardermoen
                [10.4662, 61.1153], // Lillehammer
                [9.0072, 60.6856],  // Gol
                [5.3221, 60.3913]   // Bergen
              ]
            }
          }
        });

        map.current!.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#00ff88',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Add animated route
        map.current!.addLayer({
          'id': 'route-glow',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#00ff88',
            'line-width': 8,
            'line-opacity': 0.3,
            'line-blur': 2
          }
        });
      });

    } catch (err) {
      console.error('Feil ved initialisering av kart:', err);
      setError('Kunne ikke initialisere kartet');
    }

    return () => {
      if (map.current) {
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapToken, isVisible]);

  if (!isVisible) return null;

  return (
    <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
        Interaktivt rutekart
      </h3>
      
      {loading && (
        <div className="h-96 rounded-lg border border-glass-border shadow-neon bg-background/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster kart...</p>
          </div>
        </div>
      )}

      {error && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kunne ikke laste kartet: {error}
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gradient-electric opacity-80"></div>
                <span>Planlagt rute</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-electric"></div>
                <span>Ladestasjoner</span>
              </div>
            </div>
          </div>
          
          {/* Charging stations summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Planlagte ladestopp:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {mockChargingStations.map((station, index) => (
                <div key={station.id} className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <h5 className="font-semibold text-xs">{station.name}</h5>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{station.chargeTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span>{station.chargeAmount} kWh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{station.cost} kr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default MapboxRoute;