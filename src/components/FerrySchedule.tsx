import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Ship, Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Norske ferjesamband og deres rutetider
const FERRY_ROUTES = {
  // Vestlandet
  'hirtshals-kristiansand': {
    operator: 'Color Line',
    duration: 135,
    times: ['08:30', '14:30', '20:30'],
    frequency: '2-3 avganger daglig'
  },
  'stavanger-tau': {
    operator: 'Kolumbus',
    duration: 40,
    times: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
    frequency: 'Hver 30. min'
  },
  'lavik-oppedal': {
    operator: 'Fjord1',
    duration: 20,
    times: ['05:40', '06:20', '07:00', '07:40', '08:20', '09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '13:00', '13:40', '14:20', '15:00', '15:40', '16:20', '17:00', '17:40', '18:20', '19:00', '19:40', '20:20', '21:00', '21:40', '22:20', '23:00'],
    frequency: 'Hver 40. min'
  },
  'bergen-stavanger': {
    operator: 'Fjordline',
    duration: 270,
    times: ['08:00', '22:30'],
    frequency: '2 avganger daglig'
  },
  // Trondheimsfjorden
  'trondheim-kristiansund': {
    operator: 'Hurtigruten',
    duration: 180,
    times: ['14:30'],
    frequency: 'Daglig'
  },
  // Lofoten og nordover
  'bodø-værøy': {
    operator: 'Torghatten',
    duration: 120,
    times: ['08:30', '16:00'],
    frequency: '2 avganger daglig'
  },
  'bodø-røst': {
    operator: 'Torghatten', 
    duration: 150,
    times: ['08:30'],
    frequency: '1 avgang daglig'
  },
  'moskenes-bodø': {
    operator: 'Torghatten',
    duration: 180,
    times: ['13:00'],
    frequency: 'Daglig'
  },
  // Hurtigruten hovedrute
  'bergen-kirkenes': {
    operator: 'Hurtigruten',
    duration: 6480, // 108 timer - 4.5 dager
    times: ['20:00'],
    frequency: 'Daglig'
  },
  'trondheim-hammerfest': {
    operator: 'Hurtigruten',
    duration: 1440, // 24 timer
    times: ['10:00'],
    frequency: 'Daglig'
  }
};

interface FerryTime {
  departure: string;
  arrival: string;
  reachable: boolean;
  operator: string;
  duration: number;
}

interface FerryScheduleProps {
  fromLocation: string;
  toLocation: string;
  startTime?: Date;
  travelTimeToFerry: number; // Minutter kjøretid til ferjestedet
  onFerrySelected?: (ferry: FerryTime) => void;
}

const FerrySchedule: React.FC<FerryScheduleProps> = ({
  fromLocation,
  toLocation,
  startTime = new Date(),
  travelTimeToFerry = 0,
  onFerrySelected
}) => {
  const [availableFerries, setAvailableFerries] = useState<FerryTime[]>([]);
  const [selectedFerry, setSelectedFerry] = useState<FerryTime | null>(null);
  const [ferryRoute, setFerryRoute] = useState<string | null>(null);

  // Finn relevant ferjerute basert på fra/til destinasjoner
  const findFerryRoute = (from: string, to: string): string | null => {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    
    // Sjekk alle mulige kombinasjoner
    for (const routeKey in FERRY_ROUTES) {
      const [routeFrom, routeTo] = routeKey.split('-');
      
      // Direkte match
      if ((fromLower.includes(routeFrom) && toLower.includes(routeTo)) ||
          (fromLower.includes(routeTo) && toLower.includes(routeFrom))) {
        return routeKey;
      }
      
      // Delvis match for steder i samme region
      if (fromLower.includes('stavanger') && toLower.includes('tau') ||
          fromLower.includes('tau') && toLower.includes('stavanger')) {
        return 'stavanger-tau';
      }
      
      if (fromLower.includes('bergen') && toLower.includes('stavanger') ||
          fromLower.includes('stavanger') && toLower.includes('bergen')) {
        return 'bergen-stavanger';
      }
      
      if (fromLower.includes('lavik') && toLower.includes('oppedal') ||
          fromLower.includes('oppedal') && toLower.includes('lavik')) {
        return 'lavik-oppedal';
      }
      
      // Hurtigruten-ruter
      if ((fromLower.includes('bergen') || fromLower.includes('trondheim')) && 
          toLower.includes('kirkenes')) {
        return 'bergen-kirkenes';
      }
    }
    
    return null;
  };

  // Beregn tilgjengelige ferjetider
  const calculateAvailableFerries = () => {
    const route = findFerryRoute(fromLocation, toLocation);
    
    if (!route || !FERRY_ROUTES[route]) {
      setAvailableFerries([]);
      setFerryRoute(null);
      return;
    }
    
    setFerryRoute(route);
    const ferryData = FERRY_ROUTES[route];
    const arrivalAtFerry = new Date(startTime.getTime() + (travelTimeToFerry * 60000));
    
    const ferries: FerryTime[] = ferryData.times.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const departureTime = new Date(startTime);
      departureTime.setHours(hours, minutes, 0, 0);
      
      // Hvis ferja har gått for dagen, legg til en dag
      if (departureTime < arrivalAtFerry) {
        departureTime.setDate(departureTime.getDate() + 1);
      }
      
      const arrivalTime = new Date(departureTime.getTime() + (ferryData.duration * 60000));
      const canReach = departureTime >= arrivalAtFerry;
      
      return {
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
        duration: ferryData.duration
      };
    });
    
    setAvailableFerries(ferries);
    
    // Automatisk velg første tilgjengelige ferje
    const firstReachable = ferries.find(f => f.reachable);
    if (firstReachable) {
      setSelectedFerry(firstReachable);
      onFerrySelected?.(firstReachable);
      
      toast.success(`🚢 Første tilgjengelige ferje: ${firstReachable.departure}`, {
        description: `${ferryData.operator} - Varighet: ${Math.round(firstReachable.duration / 60)} timer`,
      });
    } else {
      toast.warning('⚠️ Ingen ferjer kan nås i dag', {
        description: 'Du må starte tidligere eller vente til neste dag',
      });
    }
  };

  useEffect(() => {
    calculateAvailableFerries();
  }, [fromLocation, toLocation, startTime, travelTimeToFerry]);

  const handleFerrySelect = (ferry: FerryTime) => {
    setSelectedFerry(ferry);
    onFerrySelected?.(ferry);
    
    toast.info(`🚢 Ferje valgt: ${ferry.departure}`, {
      description: `Ankomst: ${ferry.arrival} (${ferry.operator})`,
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}t ${mins}m` : `${hours}t`;
    }
    return `${mins}m`;
  };

  if (!ferryRoute || availableFerries.length === 0) {
    return null;
  }

  const ferryData = FERRY_ROUTES[ferryRoute];

  return (
    <Card className="p-4 bg-card/90 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Ship className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Ferjetider</h3>
        <Badge variant="outline" className="ml-auto">
          {ferryData.operator}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{fromLocation} → {toLocation}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Kjøretid til ferje: {Math.round(travelTimeToFerry / 60)} timer {travelTimeToFerry % 60} min</span>
        </div>

        <Separator />

        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {availableFerries.map((ferry, index) => (
            <Button
              key={index}
              variant={selectedFerry === ferry ? "default" : "outline"}
              className={`p-3 h-auto justify-start ${
                !ferry.reachable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => ferry.reachable && handleFerrySelect(ferry)}
              disabled={!ferry.reachable}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {ferry.reachable ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">
                      Avgang: {ferry.departure}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ankomst: {ferry.arrival} • {formatDuration(ferry.duration)}
                    </div>
                  </div>
                </div>
                
                {selectedFerry === ferry && (
                  <Badge className="bg-primary text-primary-foreground">
                    Valgt
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>

        {selectedFerry && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Ship className="h-4 w-4 text-primary" />
              <span className="font-medium">
                Neste ferje: {selectedFerry.departure}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Du må være ved ferjestedet senest {
                (() => {
                  const [hours, minutes] = selectedFerry.departure.split(':').map(Number);
                  const boardingTime = new Date();
                  boardingTime.setHours(hours, minutes - 15, 0, 0); // 15 min før avgang
                  return boardingTime.toLocaleTimeString('no-NO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                })()
              }
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FerrySchedule;