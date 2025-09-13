import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Clock, DollarSign } from "lucide-react";

interface ChargingStop {
  id: string;
  name: string;
  location: string;
  distance: number;
  chargeTime: number;
  chargeAmount: number;
  cost: number;
  fastCharger: boolean;
}

const mockChargingStops: ChargingStop[] = [
  {
    id: "1",
    name: "Circle K Gardermoen",
    location: "Jessheim",
    distance: 45,
    chargeTime: 25,
    chargeAmount: 35,
    cost: 175,
    fastCharger: true
  },
  {
    id: "2", 
    name: "Ionity Lillehammer",
    location: "Lillehammer",
    distance: 180,
    chargeTime: 30,
    chargeAmount: 45,
    cost: 225,
    fastCharger: true
  },
  {
    id: "3",
    name: "Mer Gol",
    location: "Gol",
    distance: 280,
    chargeTime: 35,
    chargeAmount: 50,
    cost: 250,
    fastCharger: true
  }
];

interface ChargingMapProps {
  isVisible: boolean;
}

export default function ChargingMap({ isVisible }: ChargingMapProps) {
  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Ladestasjonkart</h3>
      </div>

      {/* Route Overview */}
      <Card className="p-4 bg-gradient-electric text-primary-foreground shadow-neon animate-pulse-neon">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">465</div>
            <div className="text-sm opacity-90">km totalt</div>
          </div>
          <div>
            <div className="text-2xl font-bold">6t 45min</div>
            <div className="text-sm opacity-90">kjøretid</div>
          </div>
          <div>
            <div className="text-2xl font-bold">650</div>
            <div className="text-sm opacity-90">kr lading</div>
          </div>
          <div>
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm opacity-90">ladestopp</div>
          </div>
        </div>
      </Card>

      {/* Charging Stops */}
      <div className="space-y-3">
        {mockChargingStops.map((stop, index) => (
          <Card key={stop.id} className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border hover:shadow-neon hover:border-primary/50 transition-all duration-300 animate-float" style={{ animationDelay: `${index * 200}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-electric text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-neon animate-pulse-neon">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{stop.name}</h4>
                    {stop.fastCharger && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Hurtiglader
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stop.location}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{stop.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{stop.chargeTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span>{stop.chargeAmount} kWh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{stop.cost} kr</span>
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