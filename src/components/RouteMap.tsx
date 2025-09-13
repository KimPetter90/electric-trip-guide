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
            <div className="h-full bg-gradient-to-br from-blue-50 via-slate-100 to-green-50 relative overflow-hidden">
              {/* Simplified Norway Map Background */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 500" className="w-full h-full">
                  <path 
                    d="M200 50 L250 100 L280 150 L270 200 L250 250 L220 300 L200 350 L180 300 L150 250 L130 200 L140 150 L170 100 Z" 
                    fill="hsl(var(--primary))" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="1" 
                    opacity="0.3"
                  />
                </svg>
              </div>
              
              {/* Route visualization */}
              <div className="absolute inset-0">
                {/* Start point */}
                {fromPosition && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={fromPosition}>
                    <div className="w-10 h-10 bg-green-500 rounded-full shadow-xl animate-pulse border-4 border-white flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🚗</span>
                    </div>
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-700 whitespace-nowrap bg-white/90 px-3 py-2 rounded-lg shadow-lg border-2 border-green-500">
                      START: {routeData.from.toUpperCase()}
                    </div>
                  </div>
                )}
                
                {/* End point */}
                {toPosition && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={toPosition}>
                    <div className="w-10 h-10 bg-red-500 rounded-full shadow-xl animate-pulse border-4 border-white flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🏁</span>
                    </div>
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-sm font-bold text-red-700 whitespace-nowrap bg-white/90 px-3 py-2 rounded-lg shadow-lg border-2 border-red-500">
                      MÅL: {routeData.to.toUpperCase()}
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
                      <div className="w-8 h-8 bg-yellow-400 rounded-full shadow-xl animate-bounce border-3 border-white flex items-center justify-center">
                        <span className="text-yellow-900 font-bold text-lg">⚡</span>
                      </div>
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs font-bold text-yellow-700 whitespace-nowrap bg-white/90 px-2 py-1 rounded shadow-lg">
                        LADING {index + 1}
                      </div>
                      
                      {/* Forbedret tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 hidden group-hover:block z-10">
                        <div className="bg-white border-2 border-yellow-400 rounded-lg p-3 shadow-xl backdrop-blur-sm min-w-40">
                          <h5 className="font-bold text-sm text-gray-800">{station.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">{station.location}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">⚡ {station.chargeAmount} kWh</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">⏱️ {station.chargeTime} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">💰 {station.cost} kr</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Forbedret rutelinje mellem start og slutt */}
                {fromPosition && toPosition && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8"/>
                      </linearGradient>
                    </defs>
                    <line 
                      x1={fromPosition.left} 
                      y1={fromPosition.top}
                      x2={toPosition.left} 
                      y2={toPosition.top}
                      stroke="url(#routeGradient)" 
                      strokeWidth="6" 
                      strokeDasharray="15,10"
                      className="animate-pulse"
                    />
                  </svg>
                )}
              </div>
              
              {/* Forbedret info overlay */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border-2 border-primary rounded-lg p-4 shadow-xl max-w-64">
                <div className="flex items-center gap-2 text-base font-bold">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-gray-800">RUTEINFORMASJON</span>
                </div>
                <div className="text-sm text-gray-700 mt-2 space-y-1 font-medium">
                  {routeData.from && routeData.to ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Rute:</span> 
                        <span>{routeData.from} → {routeData.to}</span>
                      </div>
                      {selectedCar && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Bil:</span> 
                          <span>{selectedCar.brand} {selectedCar.model}</span>
                        </div>
                      )}
                      {tripInfo && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">Rekkevidde:</span> 
                            <span className="text-blue-600">{Math.round(tripInfo.range)} km</span>
                          </div>
                          {tripInfo.needsCharging && (
                            <div className="text-yellow-600 font-bold flex items-center gap-1">
                              ⚡ LADING KREVES
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">Skriv inn start og destinasjon</div>
                  )}
                </div>
              </div>

              {/* Forbedret advarsel for manglende byer */}
              {routeData.from && !fromPosition && (
                <div className="absolute top-4 left-4 bg-red-100 border-2 border-red-500 rounded-lg p-3 text-sm font-bold text-red-700">
                  ❌ By ikke funnet: {routeData.from}
                </div>
              )}
              {routeData.to && !toPosition && (
                <div className="absolute top-4 right-4 bg-red-100 border-2 border-red-500 rounded-lg p-3 text-sm font-bold text-red-700">
                  ❌ By ikke funnet: {routeData.to}
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