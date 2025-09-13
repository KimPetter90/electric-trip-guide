import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign, MapPin } from "lucide-react";

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

interface RouteMapProps {
  isVisible: boolean;
}

export default function RouteMap({ isVisible }: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
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
        
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon relative">
          {!mapReady ? (
            <div className="h-full bg-background/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laster kart...</p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              {/* Stylized Norway Map Background */}
              <div className="absolute inset-0 opacity-30">
                <svg viewBox="0 0 400 500" className="w-full h-full">
                  <path 
                    d="M200 50 L250 100 L280 150 L270 200 L250 250 L220 300 L200 350 L180 300 L150 250 L130 200 L140 150 L170 100 Z" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="2" 
                    opacity="0.5"
                  />
                </svg>
              </div>
              
              {/* Route visualization */}
              <div className="absolute inset-0">
                {/* Start point - Oslo */}
                <div className="absolute top-[70%] left-[55%] transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg animate-pulse">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-400 whitespace-nowrap">
                      Oslo (Start)
                    </div>
                  </div>
                </div>
                
                {/* Charging stations */}
                {mockChargingStations.map((station, index) => {
                  const positions = [
                    { top: '60%', left: '58%' }, // Gardermoen
                    { top: '40%', left: '52%' }, // Lillehammer  
                    { top: '55%', left: '42%' }  // Gol
                  ];
                  
                  return (
                    <div 
                      key={station.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={positions[index]}
                    >
                      <div className="w-6 h-6 bg-gradient-electric rounded-full shadow-neon animate-pulse-neon flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-background border border-glass-border rounded-lg p-2 shadow-lg backdrop-blur-sm min-w-32">
                          <h5 className="font-semibold text-xs">{station.name}</h5>
                          <p className="text-xs text-muted-foreground">{station.location}</p>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span>⚡ {station.chargeAmount} kWh</span>
                            <span>⏱️ {station.chargeTime} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* End point - Bergen */}
                <div className="absolute top-[65%] left-[20%] transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg animate-pulse">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-red-400 whitespace-nowrap">
                      Bergen (Mål)
                    </div>
                  </div>
                </div>
                
                {/* Animated route line effect */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 220 350 Q 232 300 250 250 Q 260 200 208 200 Q 168 240 80 325" 
                    fill="none" 
                    stroke="url(#routeGradient)" 
                    strokeWidth="3" 
                    strokeDasharray="10,5"
                    className="animate-pulse"
                  />
                </svg>
              </div>
              
              {/* Map info overlay */}
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-glass-border rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Norge Rutekart</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Oslo → Bergen via ladestasjoner
                </div>
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

        {/* Charging stations summary */}
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-sm">Planlagte ladestopp:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {mockChargingStations.map((station, index) => (
              <div key={station.id} className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <h5 className="font-semibold text-xs">{station.name}</h5>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                
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
                
                {station.fastCharger && (
                  <Badge variant="secondary" className="text-xs mt-2">
                    <Zap className="h-3 w-3 mr-1" />
                    Hurtig
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}