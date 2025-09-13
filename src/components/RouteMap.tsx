import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign } from "lucide-react";

// Simple static map component without Leaflet for now
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
    // Simple timeout to simulate map loading
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
        
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon bg-background/20 flex items-center justify-center">
          {!mapReady ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laster kart...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-electric opacity-20 animate-pulse-neon mx-auto mb-4"></div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Kart kommer snart!</h4>
              <p className="text-muted-foreground">Interaktivt kart med rute og ladestasjonmarkeringer</p>
              
              {/* Show charging stations as cards instead */}
              <div className="mt-6 space-y-2">
                {mockChargingStations.map((station, index) => (
                  <div key={station.id} className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      <h5 className="font-semibold text-sm">{station.name}</h5>
                      {station.fastCharger && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Hurtig
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
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
      </Card>
    </div>
  );
}