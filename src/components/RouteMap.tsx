import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign, MapPin } from "lucide-react";

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

// Norske byer med posisjoner
const cityPositions: Record<string, { top: string; left: string; region: string }> = {
  'oslo': { top: '70%', left: '55%', region: 'Østlandet' },
  'bergen': { top: '65%', left: '20%', region: 'Vestlandet' },
  'trondheim': { top: '35%', left: '48%', region: 'Trøndelag' },
  'stavanger': { top: '78%', left: '22%', region: 'Vestlandet' },
  'tromsø': { top: '15%', left: '52%', region: 'Nord-Norge' },
  'ålesund': { top: '52%', left: '25%', region: 'Vestlandet' },
  'kristiansand': { top: '85%', left: '35%', region: 'Sørlandet' },
  'drammen': { top: '72%', left: '52%', region: 'Østlandet' },
  'fredrikstad': { top: '75%', left: '58%', region: 'Østlandet' },
  'lillehammer': { top: '60%', left: '50%', region: 'Østlandet' },
  'bodø': { top: '25%', left: '45%', region: 'Nord-Norge' },
  'molde': { top: '48%', left: '28%', region: 'Vestlandet' }
};

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
  routeData: RouteData;
  selectedCar: CarModel | null;
}

export default function RouteMap({ isVisible, routeData, selectedCar }: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Finn posisjoner for fra og til byer
  const fromCity = routeData.from.toLowerCase().trim();
  const toCity = routeData.to.toLowerCase().trim();
  
  const fromPosition = cityPositions[fromCity];
  const toPosition = cityPositions[toCity];

  // Beregn forbruk og rekkevidde
  const calculateTripInfo = () => {
    if (!selectedCar) return null;
    
    const baseDistance = 500; // Estimert distanse
    const extraConsumption = routeData.trailerWeight > 0 ? routeData.trailerWeight * 0.15 / 1000 : 0;
    const totalConsumption = selectedCar.consumption + extraConsumption;
    const maxRange = selectedCar.range * (routeData.batteryPercentage / 100);
    const needsCharging = baseDistance > maxRange;
    
    return {
      distance: baseDistance,
      consumption: totalConsumption,
      range: maxRange,
      needsCharging
    };
  };

  const tripInfo = calculateTripInfo();

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          Rutevisning: {routeData.from || 'Start'} → {routeData.to || 'Destinasjon'}
        </h3>
        
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon relative">
          {!mapReady ? (
            <div className="h-full bg-background/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Beregner rute...</p>
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
                {/* Start point */}
                {fromPosition && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={fromPosition}>
                    <div className="w-6 h-6 bg-green-500 rounded-full shadow-lg animate-pulse border-2 border-white">
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-400 whitespace-nowrap bg-background/80 px-2 py-1 rounded">
                        {routeData.from} (Start)
                      </div>
                    </div>
                  </div>
                )}
                
                {/* End point */}
                {toPosition && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={toPosition}>
                    <div className="w-6 h-6 bg-red-500 rounded-full shadow-lg animate-pulse border-2 border-white">
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-red-400 whitespace-nowrap bg-background/80 px-2 py-1 rounded">
                        {routeData.to} (Mål)
                      </div>
                    </div>
                  </div>
                )}

                {/* Charging stations - kun vis hvis vi trenger lading */}
                {tripInfo?.needsCharging && mockChargingStations.map((station, index) => {
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
                      <div className="w-6 h-6 bg-gradient-electric rounded-full shadow-neon animate-pulse-neon flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-white">
                        ⚡
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
                
                {/* Animated route line between start and end */}
                {fromPosition && toPosition && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4"/>
                      </linearGradient>
                    </defs>
                    <line 
                      x1={fromPosition.left} 
                      y1={fromPosition.top}
                      x2={toPosition.left} 
                      y2={toPosition.top}
                      stroke="url(#routeGradient)" 
                      strokeWidth="3" 
                      strokeDasharray="10,5"
                      className="animate-pulse"
                    />
                  </svg>
                )}
              </div>
              
              {/* Map info overlay */}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-glass-border rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Ruteinformasjon</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {routeData.from && routeData.to ? (
                    <>
                      <div>Rute: {routeData.from} → {routeData.to}</div>
                      {selectedCar && (
                        <div>Bil: {selectedCar.brand} {selectedCar.model}</div>
                      )}
                      {tripInfo && (
                        <>
                          <div>Rekkevidde: {Math.round(tripInfo.range)} km</div>
                          {tripInfo.needsCharging && <div className="text-yellow-400">⚡ Lading kreves</div>}
                        </>
                      )}
                    </>
                  ) : (
                    <div>Skriv inn start og destinasjon</div>
                  )}
                </div>
              </div>

              {/* Show missing city warning */}
              {routeData.from && !fromPosition && (
                <div className="absolute top-4 left-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 text-xs">
                  By ikke funnet: {routeData.from}
                </div>
              )}
              {routeData.to && !toPosition && (
                <div className="absolute top-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 text-xs">
                  By ikke funnet: {routeData.to}
                </div>
              )}
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

        {/* Trip information */}
        {selectedCar && tripInfo && (
          <div className="mt-4 p-3 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Reiseinformasjon</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Forbruk:</span>
                <div className="font-semibold">{tripInfo.consumption.toFixed(1)} kWh/100km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Rekkevidde:</span>
                <div className="font-semibold">{Math.round(tripInfo.range)} km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Batteri:</span>
                <div className="font-semibold">{routeData.batteryPercentage}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Henger:</span>
                <div className="font-semibold">{routeData.trailerWeight > 0 ? `${routeData.trailerWeight} kg` : 'Nei'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Charging stations summary - kun hvis vi trenger lading */}
        {tripInfo?.needsCharging && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Anbefalte ladestopp:</h4>
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
        )}
      </Card>
    </div>
  );
}