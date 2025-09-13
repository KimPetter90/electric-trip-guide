import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign } from "lucide-react";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom charging station icon
const chargingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="11" fill="#00ff88" stroke="#ffffff" stroke-width="2"/>
      <path d="M13 8v8m-4-4l8 0" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
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
  useEffect(() => {
    // Ensure Leaflet CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
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
          <MapContainer
            center={[60.5, 9.5]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Route polyline */}
            <Polyline
              positions={routeCoordinates}
              color="#00ff88"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
            
            {/* Charging station markers */}
            {mockChargingStations.map((station) => (
              <Marker
                key={station.id}
                position={[station.lat, station.lng]}
                icon={chargingIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-48">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{station.name}</h4>
                      {station.fastCharger && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Hurtig
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                    
                    <div className="grid grid-cols-1 gap-1 text-xs">
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
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
      </Card>
    </div>
  );
}