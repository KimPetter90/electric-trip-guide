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

    if (!destination) return routes;

    const dest = destination.toLowerCase();
    
    // Sjekk for Kvalsvik/Nerlandsøy ruter (populær på Sunnmøre)
    if (dest.includes('kvalsvik') || dest.includes('nerlandsøy') || dest.includes('sunnmøre')) {
      const nextDep = new Date();
      nextDep.setHours(currentHour, Math.ceil(currentMinute / 30) * 30, 0, 0);
      if (nextDep.getTime() <= now.getTime()) {
        nextDep.setMinutes(nextDep.getMinutes() + 30);
      }
      
      const followingDep = new Date(nextDep);
      followingDep.setMinutes(nextDep.getMinutes() + 30);

      routes.push({
        route: 'Sulesund-Hareid',
        from: 'Sulesund',
        to: 'Hareid',
        nextDeparture: nextDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        followingDeparture: followingDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        travelTimeToFerry: calculateTravelTimeToFerry(currentLocation, 'sulesund'),
        probability: 0
      });
    }

    // Bergen/Vestlandet ruter
    if (dest.includes('ålesund') || dest.includes('bergen') || dest.includes('vestnes') || dest.includes('molde')) {
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

    // Stavanger/Sørlandet ruter
    if (dest.includes('kristiansand') || dest.includes('stavanger') || dest.includes('mortavika')) {
      const nextDep = new Date();
      nextDep.setHours(currentHour + 1, 45, 0, 0);
      
      const followingDep = new Date(nextDep);
      followingDep.setMinutes(nextDep.getMinutes() + 45);

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

    // Trondheim/Nord-Norge ruter
    if (dest.includes('trondheim') || dest.includes('bodø') || dest.includes('flakk')) {
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

    // Fallback: Vis en generisk fergerute hvis ingen matcher
    if (routes.length === 0) {
      const nextDep = new Date();
      nextDep.setHours(currentHour, Math.ceil(currentMinute / 15) * 15, 0, 0);
      if (nextDep.getTime() <= now.getTime()) {
        nextDep.setMinutes(nextDep.getMinutes() + 15);
      }
      
      const followingDep = new Date(nextDep);
      followingDep.setMinutes(nextDep.getMinutes() + 30);

      routes.push({
        route: 'Nærmeste ferge',
        from: 'Fra',
        to: 'Til',
        nextDeparture: nextDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        followingDeparture: followingDep.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
        travelTimeToFerry: 20,
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
    if (!currentPos || !ferryPort) return 25; // Default 25 min

    // Forenklet beregning basert på fergekai
    const distances: { [key: string]: number } = {
      'molde': 25,      // 25 min kjøring
      'mortavika': 60,  // 60 min kjøring  
      'flakk': 40,      // 40 min kjøring
      'sulesund': 15,   // 15 min kjøring
      'default': 25
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
      console.log('🚢 Sjekker fergeruter for destinasjon:', destination);
      setLoading(true);
      // Simuler lasting
      setTimeout(() => {
        const routes = getFerryRoutes(destination);
        console.log('🚢 Fergeruter funnet:', routes);
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
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 w-64">
      <Card className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="h-3 w-3 text-blue-400" />
            <span className="font-medium text-xs">Neste ferge</span>
          </div>

          {loading ? (
            <div className="text-xs text-muted-foreground">Laster...</div>
          ) : (
            <div className="space-y-2">
              {ferryInfo.slice(0, 1).map((ferry) => (
                <div key={ferry.route} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{ferry.route}</span>
                    <Badge {...getProbabilityBadge(ferry.probability)} className="text-xs py-0 px-1">
                      {ferry.probability}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{ferry.nextDeparture}</span>
                    <span className="text-muted-foreground">({ferry.travelTimeToFerry} min)</span>
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