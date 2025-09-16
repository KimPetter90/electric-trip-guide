import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Clock, DollarSign } from "lucide-react";

interface RouteAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather?: any;
}



interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fastCharger: boolean;
  power: string;
  cost: number;
  distanceFromRoute?: number;
  distanceAlongRoute?: number;
  arrivalBatteryPercentage?: number;
  isRequired?: boolean;
  chargingTime?: number;
  targetBatteryPercentage?: number;
}

interface ChargingMapProps {
  isVisible: boolean;
  routeAnalysis?: RouteAnalysis | null;
  optimizedStations?: ChargingStation[];
}

export default function ChargingMap({ isVisible, routeAnalysis, optimizedStations }: ChargingMapProps) {
  if (!isVisible) return null;

  // Bruk ekte rutedata eller fallback til standardverdier
  const distance = routeAnalysis?.totalDistance ? Math.round(routeAnalysis.totalDistance) : 465;
  const totalTimeHours = routeAnalysis?.totalTime || 6.75;
  const hours = Math.floor(totalTimeHours);
  const minutes = Math.round((totalTimeHours - hours) * 60);
  const cost = routeAnalysis?.totalCost || 650;
  const stops = optimizedStations ? optimizedStations.length : (routeAnalysis ? Math.ceil(routeAnalysis.totalDistance / 300) : 3);

  // Konverter optimizedStations til riktig format for visning
  console.log('🔌 ChargingMap: optimizedStations mottatt:', optimizedStations);
  const chargingStops = optimizedStations ? optimizedStations.map((station, index) => {
    console.log('🔌 ChargingMap: Konverterer stasjon:', station.name, station);
    return {
      id: station.id,
      name: station.name,
      location: station.location,
      distance: station.distanceAlongRoute ? Math.round(station.distanceAlongRoute) : (index + 1) * 150,
      chargeTime: station.chargingTime || 30,
      chargeAmount: 35 + (index * 10),
      cost: Math.round(station.cost * 35) || 200,
      fastCharger: station.fastCharger
    };
  }) : [];
  
  console.log('🔌 ChargingMap: Finale chargingStops som vises:', chargingStops);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Ladestasjonkart</h3>
      </div>

      {/* Route Overview */}
      <Card className="p-4 bg-gradient-electric text-primary-foreground shadow-neon animate-pulse-neon">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-orbitron font-bold text-primary-foreground">{distance}</div>
            <div className="text-sm font-orbitron opacity-90">km totalt</div>
          </div>
          <div>
            <div className="text-3xl font-orbitron font-bold text-primary-foreground">{hours}t {minutes}min</div>
            <div className="text-sm font-orbitron opacity-90">kjøretid</div>
          </div>
          <div>
            <div className="text-3xl font-orbitron font-bold text-primary-foreground">{cost}</div>
            <div className="text-sm font-orbitron opacity-90">kr lading</div>
          </div>
          <div>
            <div className="text-3xl font-orbitron font-bold text-primary-foreground">{stops}</div>
            <div className="text-sm font-orbitron opacity-90">ladestopp</div>
          </div>
        </div>
      </Card>

      {/* Charging Stops */}
      <div className="space-y-3">
        {chargingStops.map((stop, index) => (
          <Card key={stop.id} className="p-6 bg-card/80 backdrop-blur-sm border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center text-lg font-bold shadow-neon">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-orbitron font-bold text-gradient">{stop.name}</h4>
                    {stop.fastCharger && (
                      <Badge variant="secondary" className="text-xs font-orbitron">
                        <Zap className="h-3 w-3 mr-1" />
                        Hurtiglader
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-orbitron text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {stop.location}, Norge
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ladestasjon langs ruten din - anbefalt stopp for optimal rekkevidde
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-orbitron font-medium text-lg">{stop.distance} km</span>
                        <p className="text-xs text-muted-foreground">fra start</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-orbitron font-medium text-lg">{stop.chargeTime} min</span>
                        <p className="text-xs text-muted-foreground">ladetid</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <Zap className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-orbitron font-medium text-lg">{stop.chargeAmount} kWh</span>
                        <p className="text-xs text-muted-foreground">energi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-orbitron font-medium text-lg">{stop.cost} kr</span>
                        <p className="text-xs text-muted-foreground">kostnad</p>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          </Card>
        ))}
      </div>
    </div>
  );
}