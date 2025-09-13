import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign } from "lucide-react";
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom charging station icon
const chargingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="#00ff88"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      <path d="M10 8l3 4h-2l0 3 -3 -4h2z" fill="#00ff88"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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

// Mock route coordinates (Oslo to Bergen via charging stations)
const routeCoordinates: [number, number][] = [
  [59.9139, 10.7522], // Oslo
  [60.1939, 11.1004], // Gardermoen
  [61.1153, 10.4662], // Lillehammer
  [60.6856, 9.0072],  // Gol
  [60.3913, 5.3221]   // Bergen
];

interface RouteMapProps {
  isVisible: boolean;
}

export default function RouteMap({ isVisible }: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Interaktivt rutekart
        </h3>
        
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon">
          {!mapReady ? (
            <div className="h-full bg-background/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laster kart...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[60.5, 8.5]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Route line */}
              <Polyline
                positions={routeCoordinates}
                color="#00ff88"
                weight={4}
                opacity={0.8}
              />
              
              {/* Charging stations */}
              {mockChargingStations.map((station, index) => (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lng]}
                  icon={chargingIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <h4 className="font-semibold mb-1">{station.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{station.location}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{station.chargeTime} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>{station.chargeAmount} kWh</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{station.cost} kr</span>
                        </div>
                      </div>
                      {station.fastCharger && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          <Zap className="h-3 w-3 mr-1" />
                          Hurtiglading
                        </Badge>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Start and end markers */}
              <Marker position={[59.9139, 10.7522]}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-semibold">Start: Oslo</h4>
                    <p className="text-sm">Reisens startpunkt</p>
                  </div>
                </Popup>
              </Marker>
              
              <Marker position={[60.3913, 5.3221]}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-semibold">Mål: Bergen</h4>
                    <p className="text-sm">Reisens destinasjon</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
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
        <div className="mt-4 space-y-2">
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
      </Card>
    </div>
  );
}