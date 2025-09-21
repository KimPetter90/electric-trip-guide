import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Clock, MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FerryInfo {
  route: string;
  from: string;
  to: string;
  nextDeparture: string;
  followingDeparture: string;
  travelTimeToFerry: number; // minutter
  probability: number; // 0-100
}

interface NavigationFerryInfoProps {
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  destination?: string;
  isVisible: boolean;
}

export const NavigationFerryInfo: React.FC<NavigationFerryInfoProps> = ({
  currentLocation,
  destination,
  isVisible
}) => {
  const [ferryInfo, setFerryInfo] = useState<FerryInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Relevante fergeruter basert på destinasjon
  const getFerryRoutes = (destination?: string): FerryInfo[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Mock ferge-data basert på populære ruter
    const routes: FerryInfo[] = [];

    if (destination?.toLowerCase().includes('ålesund') || destination?.toLowerCase().includes('bergen')) {
      // Molde-Vestnes rute (relevant for Ålesund-Bergen)
      const nextDep = new Date();
      nextDep.setHours(currentHour + 1, 15, 0, 0);
      if (nextDep.getTime() < now.getTime()) {
        nextDep.setHours(currentHour + 2, 15, 0, 0);
      }
      
      const followingDep = new Date(nextDep);
      followingDep.setHours(nextDep.getHours() + 1);

      routes.push({
        route: 'Molde-Vestnes',
        from: 'Molde',
        to: 'Vestnes',
        nextDeparture: nextDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        followingDeparture: followingDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        travelTimeToFerry: calculateTravelTimeToFerry(currentLocation, 'molde'),
        probability: 0
      });
    }

    if (destination?.toLowerCase().includes('kristiansand') || destination?.toLowerCase().includes('stavanger')) {
      // Hirtshals-Kristiansand (hvis relevant)
      const nextDep = new Date();
      nextDep.setHours(currentHour + 2, 45, 0, 0);
      
      const followingDep = new Date(nextDep);
      followingDep.setDate(nextDep.getDate() + 1);

      routes.push({
        route: 'Mortavika-Arsvågen',
        from: 'Mortavika',
        to: 'Arsvågen', 
        nextDeparture: nextDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        followingDeparture: followingDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        travelTimeToFerry: calculateTravelTimeToFerry(currentLocation, 'mortavika'),
        probability: 0
      });
    }

    if (destination?.toLowerCase().includes('trondheim') || destination?.toLowerCase().includes('bodø')) {
      // Hurtigruten eller Trondheim-relevante ferger
      const nextDep = new Date();
      nextDep.setHours(currentHour + 1, 30, 0, 0);
      
      const followingDep = new Date(nextDep);
      followingDep.setHours(nextDep.getHours() + 2);

      routes.push({
        route: 'Flakk-Rørvik',
        from: 'Flakk',
        to: 'Rørvik',
        nextDeparture: nextDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        followingDeparture: followingDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        travelTimeToFerry: calculateTravelTimeToFerry(currentLocation, 'flakk'),
        probability: 0
      });
    }

    // Beregn sannsynlighet for å rekke fergen
    return routes.map(route => ({
      ...route,
      probability: calculateFerryProbability(route.travelTimeToFerry, route.nextDeparture)
    }));
  };

  const calculateTravelTimeToFerry = (currentPos?: { latitude: number; longitude: number }, ferryPort?: string): number => {
    if (!currentPos || !ferryPort) return 45; // Default 45 min

    // Forenklet beregning basert på fergekai
    const distances: { [key: string]: number } = {
      'molde': 25,      // 25 min kjøring
      'mortavika': 60,  // 60 min kjøring  
      'flakk': 40,      // 40 min kjøring
      'default': 45
    };

    return distances[ferryPort] || distances['default'];
  };

  const calculateFerryProbability = (travelTime: number, departureTime: string): number => {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departure = new Date();
    departure.setHours(hours, minutes, 0, 0);
    
    // Hvis avgangen er i morgen
    if (departure.getTime() < now.getTime()) {
      departure.setDate(departure.getDate() + 1);
    }

    const timeUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60); // minutter
    const buffer = 10; // 10 min buffer for boarding
    const timeNeeded = travelTime + buffer;

    if (timeUntilDeparture <= timeNeeded) {
      return 15; // Lav sannsynlighet
    } else if (timeUntilDeparture <= timeNeeded + 15) {
      return 65; // Middels sannsynlighet
    } else {
      return 95; // Høy sannsynlighet
    }
  };

  useEffect(() => {
    if (isVisible && destination) {
      setLoading(true);
      // Simuler lasting
      setTimeout(() => {
        const routes = getFerryRoutes(destination);
        setFerryInfo(routes);
        setLoading(false);
      }, 1000);
    }
  }, [isVisible, destination, currentLocation]);

  const getProbabilityColor = (probability: number): string => {
    if (probability >= 80) return 'text-green-400';
    if (probability >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProbabilityBadge = (probability: number): { variant: any, text: string } => {
    if (probability >= 80) return { variant: 'default', text: 'Rekker lett' };
    if (probability >= 50) return { variant: 'secondary', text: 'Kan rekke' };
    return { variant: 'destructive', text: 'Vanskelig' };
  };

  if (!isVisible || ferryInfo.length === 0) return null;

  return (
    <div className="absolute top-16 left-3 right-3 z-10">
      <Card className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-sm">Kommende ferger</h3>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Henter fergetider...</div>
          ) : (
            <div className="space-y-3">
              {ferryInfo.slice(0, 2).map((ferry, index) => (
                <div 
                  key={ferry.route} 
                  className={cn(
                    "border rounded-lg p-3 space-y-2",
                    index === 0 ? "border-primary/30 bg-primary/5" : "border-border/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{ferry.route}</span>
                    </div>
                    <Badge {...getProbabilityBadge(ferry.probability)} className="text-xs">
                      {getProbabilityBadge(ferry.probability).text}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Neste:</span>
                      <span className="font-medium">{ferry.nextDeparture}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={cn("h-3 w-3", getProbabilityColor(ferry.probability))} />
                      <span className={cn("font-medium", getProbabilityColor(ferry.probability))}>
                        {ferry.probability}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{ferry.from} → {ferry.to}</span>
                    <span>Deretter: {ferry.followingDeparture}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Kjøretid til ferge: {ferry.travelTimeToFerry} min
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};