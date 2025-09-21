import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Ship, Clock, MapPin, AlertCircle, CheckCircle2, Navigation, Timer } from 'lucide-react';
import { toast } from 'sonner';

// Utvidet norske ferjesamband med GPS-koordinater
const FERRY_ROUTES = {
  // Vestlandet
  'stavanger-tau': {
    operator: 'Kolumbus',
    duration: 40,
    from: { name: 'Stavanger', lat: 58.9700, lng: 5.7331 },
    to: { name: 'Tau', lat: 59.0667, lng: 6.0000 },
    times: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
    frequency: 'Hver 30. min',
    route: 'Ryfylkeferja'
  },
  'lavik-oppedal': {
    operator: 'Fjord1',
    duration: 20,
    from: { name: 'Lavik', lat: 61.1000, lng: 5.5167 },
    to: { name: 'Oppedal', lat: 61.0333, lng: 5.7000 },
    times: ['05:40', '06:20', '07:00', '07:40', '08:20', '09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '13:00', '13:40', '14:20', '15:00', '15:40', '16:20', '17:00', '17:40', '18:20', '19:00', '19:40', '20:20', '21:00', '21:40', '22:20', '23:00'],
    frequency: 'Hver 40. min',
    route: 'Sognefjorden'
  },
  'bergen-stavanger': {
    operator: 'Fjordline',
    duration: 270,
    from: { name: 'Bergen', lat: 60.3913, lng: 5.3221 },
    to: { name: 'Stavanger', lat: 58.9700, lng: 5.7331 },
    times: ['08:00', '22:30'],
    frequency: '2 avganger daglig',
    route: 'Kystekspressen'
  },
  'hirtshals-kristiansand': {
    operator: 'Color Line',
    duration: 135,
    from: { name: 'Hirtshals (DK)', lat: 57.5942, lng: 9.9611 },
    to: { name: 'Kristiansand', lat: 58.1467, lng: 7.9956 },
    times: ['08:30', '14:30', '20:30'],
    frequency: '2-3 avganger daglig',
    route: 'Superspeed'
  },
  'bodø-værøy': {
    operator: 'Torghatten',
    duration: 120,
    from: { name: 'Bodø', lat: 67.2804, lng: 14.4049 },
    to: { name: 'Værøy', lat: 67.6667, lng: 12.6667 },
    times: ['08:30', '16:00'],
    frequency: '2 avganger daglig',
    route: 'Lofoten-sambandet'
  },
  'moskenes-bodø': {
    operator: 'Torghatten',
    duration: 180,
    from: { name: 'Moskenes', lat: 67.9167, lng: 12.9833 },
    to: { name: 'Bodø', lat: 67.2804, lng: 14.4049 },
    times: ['13:00'],
    frequency: 'Daglig',
    route: 'Lofoten-sambandet'
  },
  'molde-vestnes': {
    operator: 'Fjord1',
    duration: 25,
    from: { name: 'Molde', lat: 62.7378, lng: 7.1591 },
    to: { name: 'Vestnes', lat: 62.6000, lng: 7.0833 },
    times: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
    frequency: 'Hver time',
    route: 'Romsdalsfjorden'
  },
  'åndalsnes-valldal': {
    operator: 'Fjord1',
    duration: 35,
    from: { name: 'Åndalsnes', lat: 62.5667, lng: 7.6833 },
    to: { name: 'Valldal', lat: 62.3000, lng: 7.7167 },
    times: ['08:00', '12:00', '16:00', '20:00'],
    frequency: '4 avganger daglig',
    route: 'Geirangerfjorden'
  },
  'flåm-gudvangen': {
    operator: 'Fjord1',
    duration: 120,
    from: { name: 'Flåm', lat: 60.8628, lng: 7.1131 },
    to: { name: 'Gudvangen', lat: 60.8833, lng: 6.8500 },
    times: ['09:00', '13:00', '17:00'],
    frequency: '3 avganger daglig',
    route: 'Nærøyfjorden'
  }
};

interface FerryTime {
  departure: string;
  arrival: string;
  reachable: boolean;
  operator: string;
  duration: number;
  route: string;
  from: string;
  to: string;
  distanceToFerry: number;
  timeToFerry: number;
  boardingTime: string;
}

interface ComprehensiveFerryProps {
  fromLocation: string;
  toLocation: string;
  currentLocation?: { lat: number; lng: number };
  isGPSActive: boolean;
  onFerryUpdate?: (ferries: FerryTime[]) => void;
}

const ComprehensiveFerrySchedule: React.FC<ComprehensiveFerryProps> = ({
  fromLocation,
  toLocation,
  currentLocation,
  isGPSActive,
  onFerryUpdate
}) => {
  const [allFerries, setAllFerries] = useState<FerryTime[]>([]);
  const [nextFerry, setNextFerry] = useState<FerryTime | null>(null);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Beregn avstand mellom to koordinater (Haversine-formel)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Jordas radius i km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Finn alle relevante ferjeruter basert på destinasjoner og nåværende posisjon
  const findRelevantFerries = useCallback(() => {
    const fromLower = fromLocation.toLowerCase();
    const toLower = toLocation.toLowerCase();
    const relevantRoutes: string[] = [];

    // Sjekk alle mulige ferjeruter
    for (const routeKey in FERRY_ROUTES) {
      const [routeFrom, routeTo] = routeKey.split('-');
      const ferryData = FERRY_ROUTES[routeKey];
      
      // Direkte match med destinasjoner
      if ((fromLower.includes(routeFrom) && toLower.includes(routeTo)) ||
          (fromLower.includes(routeTo) && toLower.includes(routeFrom))) {
        relevantRoutes.push(routeKey);
        continue;
      }
      
      // Spesifikke regionale matcher for kjente ferjeruter
      const routeMatches = [
        { condition: fromLower.includes('stavanger') && toLower.includes('tau'), route: 'stavanger-tau' },
        { condition: fromLower.includes('bergen') && toLower.includes('stavanger'), route: 'bergen-stavanger' },
        { condition: fromLower.includes('molde') && toLower.includes('ålesund'), route: 'molde-vestnes' },
        { condition: fromLower.includes('ålesund') && toLower.includes('molde'), route: 'molde-vestnes' },
        { condition: fromLower.includes('åndalsnes') && toLower.includes('geiranger'), route: 'åndalsnes-valldal' },
        { condition: fromLower.includes('flåm') && toLower.includes('bergen'), route: 'flåm-gudvangen' },
        { condition: fromLower.includes('lavik') && toLower.includes('oppedal'), route: 'lavik-oppedal' },
        { condition: fromLower.includes('bodø') && (toLower.includes('lofoten') || toLower.includes('værøy')), route: 'bodø-værøy' },
        { condition: fromLower.includes('lofoten') && toLower.includes('bodø'), route: 'moskenes-bodø' },
        // Ålesund til Trondheim går via Molde-Vestnes ferjen
        { condition: fromLower.includes('ålesund') && toLower.includes('trondheim'), route: 'molde-vestnes' },
        { condition: fromLower.includes('trondheim') && toLower.includes('ålesund'), route: 'molde-vestnes' },
      ];

      for (const match of routeMatches) {
        if (match.condition && match.route === routeKey) {
          relevantRoutes.push(routeKey);
          break;
        }
      }

      // Hvis vi har GPS-posisjon, sjekk om vi er nær en ferjerute (men kun hvis ingen spesifikk match)
      if (currentLocation && isGPSActive && relevantRoutes.length === 0) {
        const distanceToFrom = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          ferryData.from.lat, ferryData.from.lng
        );
        const distanceToTo = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          ferryData.to.lat, ferryData.to.lng
        );

        // Hvis vi er innenfor 25km av en ferje og ingen spesifikk rute er funnet
        if (distanceToFrom <= 25 || distanceToTo <= 25) {
          relevantRoutes.push(routeKey);
        }
      }
    }

    console.log('🚢 Ferjeruter funnet for', fromLocation, '→', toLocation, ':', relevantRoutes);
    return [...new Set(relevantRoutes)]; // Fjern duplikater
  }, [fromLocation, toLocation, currentLocation, isGPSActive, calculateDistance]);

  // Beregn ferjetider basert på nåværende tid og posisjon
  const calculateFerryTimes = useCallback(() => {
    const relevantRoutes = findRelevantFerries();
    if (relevantRoutes.length === 0) {
      setAllFerries([]);
      setNextFerry(null);
      return;
    }

    const ferries: FerryTime[] = [];
    const now = new Date();

    relevantRoutes.forEach(routeKey => {
      const ferryData = FERRY_ROUTES[routeKey];
      
      // Beregn avstand til ferjestedet
      let distanceToFerry = 0;
      let timeToFerry = 0;

      if (currentLocation && isGPSActive) {
        distanceToFerry = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          ferryData.from.lat, ferryData.from.lng
        );
        timeToFerry = Math.round((distanceToFerry / 80) * 60); // Antatt 80 km/t snittshastighet
      }

      // Beregn tilgjengelige ferjetider
      ferryData.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const departureTime = new Date(now);
        departureTime.setHours(hours, minutes, 0, 0);

        // Hvis ferja har gått for dagen, legg til en dag
        if (departureTime < now) {
          departureTime.setDate(departureTime.getDate() + 1);
        }

        const arrivalTime = new Date(departureTime.getTime() + (ferryData.duration * 60000));
        const arrivalAtFerry = new Date(now.getTime() + (timeToFerry * 60000));
        const canReach = departureTime >= arrivalAtFerry;
        
        // Boarding time (15 min før avgang)
        const boardingTime = new Date(departureTime.getTime() - (15 * 60000));

        ferries.push({
          departure: departureTime.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          arrival: arrivalTime.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          reachable: canReach,
          operator: ferryData.operator,
          duration: ferryData.duration,
          route: ferryData.route,
          from: ferryData.from.name,
          to: ferryData.to.name,
          distanceToFerry,
          timeToFerry,
          boardingTime: boardingTime.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        });
      });
    });

    // Sorter ferjer etter avgangstid
    ferries.sort((a, b) => {
      const timeA = a.departure.split(':').map(Number);
      const timeB = b.departure.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    setAllFerries(ferries);
    
    // Finn neste tilgjengelige ferje
    const nextAvailable = ferries.find(f => f.reachable);
    setNextFerry(nextAvailable || null);
    
    onFerryUpdate?.(ferries);
  }, [findRelevantFerries, currentLocation, isGPSActive, calculateDistance, onFerryUpdate]);

  // Sanntidsoppdatering
  useEffect(() => {
    calculateFerryTimes();

    // Oppdater hvert minutt
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      calculateFerryTimes();
    }, 60000);

    setUpdateInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [calculateFerryTimes]);

  // Beregn tid til neste ferje
  const getTimeUntilDeparture = (departureTime: string): string => {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departure = new Date(now);
    departure.setHours(hours, minutes, 0, 0);
    
    if (departure < now) {
      departure.setDate(departure.getDate() + 1);
    }
    
    const diffMs = departure.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}t ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  if (allFerries.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-card/90 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Ferjeruter på din reise</h3>
        </div>
        <Badge variant="outline" className="text-blue-600">
          {allFerries.length} {allFerries.length === 1 ? 'ferje' : 'ferjer'}
        </Badge>
      </div>

      {nextFerry && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium text-blue-800">Neste tilgjengelige ferje</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div><strong>Rute:</strong> {nextFerry.from} → {nextFerry.to}</div>
            <div><strong>Avgang:</strong> {nextFerry.departure}</div>
            <div><strong>Om:</strong> {getTimeUntilDeparture(nextFerry.departure)}</div>
          </div>
          {isGPSActive && (
            <div className="mt-2 text-xs text-blue-600">
              📍 {Math.round(nextFerry.distanceToFerry)}km kjøring til ferjestedet ({nextFerry.timeToFerry} min)
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allFerries.slice(0, 10).map((ferry, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border transition-all ${
              ferry.reachable 
                ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {ferry.reachable ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className="font-medium">{ferry.route}</span>
                <Badge variant="outline" className="text-xs">
                  {ferry.operator}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">{ferry.departure}</div>
                <div className="text-xs text-muted-foreground">
                  Om {getTimeUntilDeparture(ferry.departure)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {ferry.from} → {ferry.to}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Varighet: {Math.round(ferry.duration / 60)}t {ferry.duration % 60}m
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Ombordstigning: {ferry.boardingTime}
              </div>
            </div>

            {isGPSActive && ferry.distanceToFerry > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Navigation className="h-3 w-3 text-blue-500" />
                <div className="flex-1">
                  <div className="text-xs text-blue-600">
                    {Math.round(ferry.distanceToFerry)}km til ferjestedet • {ferry.timeToFerry} min kjøring
                  </div>
                  <Progress 
                    value={ferry.reachable ? 100 : Math.max(20, 100 - (ferry.timeToFerry / 60) * 100)} 
                    className="h-1 mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <div className="text-xs text-muted-foreground">
          📱 Oppdateres automatisk {isGPSActive ? 'basert på din posisjon' : 'hvert minutt'}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Sist oppdatert: {currentTime.toLocaleTimeString('no-NO')}
        </div>
      </div>
    </Card>
  );
};

export default ComprehensiveFerrySchedule;