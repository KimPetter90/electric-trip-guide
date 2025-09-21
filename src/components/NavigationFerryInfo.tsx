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
      followingDep.setMinutes(nextDep.getMinutes() + 60);

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
    if (!ferryPort) return 25; // Default 25 min

    const now = new Date();
    const currentHour = now.getHours();
    const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 15 && currentHour <= 18);
    
    // Fergekai-koordinater (omtrentlige)
    const ferryLocations: { [key: string]: { lat: number; lng: number } } = {
      'molde': { lat: 62.7372, lng: 7.1607 },
      'mortavika': { lat: 59.5317, lng: 6.0397 },
      'flakk': { lat: 63.4305, lng: 9.6709 },
      'sulesund': { lat: 62.5756, lng: 6.1167 },
      'default': { lat: 62.4722, lng: 6.1549 } // Ålesund
    };

    const ferryPos = ferryLocations[ferryPort] || ferryLocations['default'];
    
    // Hvis vi har GPS-posisjon, beregn faktisk avstand
    if (currentPos) {
      const distance = calculateDistance(currentPos.latitude, currentPos.longitude, ferryPos.lat, ferryPos.lng);
      console.log(`🚢 Avstand til ${ferryPort}: ${distance.toFixed(1)}km`);
      
      // Beregn kjøretid basert på avstand og fartsgrense
      const avgSpeed = isRushHour ? 45 : 60; // km/t (lavere i rushtid)
      const baseTime = (distance / avgSpeed) * 60; // minutter
      const trafficBuffer = isRushHour ? 1.3 : 1.1; // 30% ekstra i rushtid
      
      return Math.max(5, Math.round(baseTime * trafficBuffer));
    }
    
    // Fallback til fast tid hvis ingen GPS
    const baseTimes: { [key: string]: number } = {
      'molde': 20, 'mortavika': 45, 'flakk': 35, 'sulesund': 12, 'default': 20
    };
    const baseTime = baseTimes[ferryPort] || baseTimes['default'];
    const trafficMultiplier = isRushHour ? 1.4 : 1.1;
    
    return Math.round(baseTime * trafficMultiplier);
  };

  // Haversine-formel for avstandsberegning
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Jordens radius i km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
    console.log(`🚢 Ferge-kalkulator: ${timeUntilDeparture.toFixed(0)}min til ferge, trenger ${travelTime}min kjøretid`);
    
    const boardingBuffer = 10; // 10 min buffer for ombordstigning
    const totalTimeNeeded = travelTime + boardingBuffer;
    const timeMargin = timeUntilDeparture - totalTimeNeeded;

    console.log(`🚢 Tidsmargin: ${timeMargin.toFixed(0)}min ekstra`);

    // Mer realistisk sannsynlighetsberegning
    if (timeMargin < -10) {
      return 5; // Nesten umulig - for sent ute
    } else if (timeMargin < 0) {
      return 25; // Vanskelig - må kjøre fort
    } else if (timeMargin < 10) {
      return 60; // Middels - litt stress
    } else if (timeMargin < 20) {
      return 85; // God - komfortabel margin
    } else {
      return 100; // Perfekt - masse tid
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
    <div className="w-full flex justify-center">
      <div className="bg-transparent flex items-center gap-4 px-4 py-1">
        {loading ? (
          <div className="text-xs text-muted-foreground">Laster ferge...</div>
        ) : (
          ferryInfo.slice(0, 1).map((ferry) => {
            const followingProbability = calculateFerryProbability(ferry.travelTimeToFerry, ferry.followingDeparture);
            return (
              <div key={ferry.route} className="flex items-center gap-3 text-xs">
                <Anchor className="h-3 w-3 text-blue-400" />
                <span className="font-medium">{ferry.route}</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Kommende {ferry.nextDeparture} ({ferry.probability}%)</span>
                  <span className="text-muted-foreground">Neste {ferry.followingDeparture} ({followingProbability}%)</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};