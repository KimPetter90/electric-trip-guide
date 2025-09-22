import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NorwegianAddressInput } from "@/components/ui/norwegian-address-input";
import { MapPin, Truck, Route, Battery, CalendarIcon, Navigation, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
  arrivalTime?: Date; // Ny felt for ønsket ankomsttid
}

interface RouteInputProps {
  routeData: RouteData;
  onRouteChange: (data: RouteData) => void;
  onPlanRoute: () => void;
  isPlanning?: boolean; // Ny prop for loading state
  selectedRouteType?: string; // Ny prop for å få vite valgt rutetype
}

export default function RouteInput({ routeData, onRouteChange, onPlanRoute, isPlanning = false, selectedRouteType = 'fastest' }: RouteInputProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [arrivalCalendarOpen, setArrivalCalendarOpen] = useState(false);

  const handleInputChange = (field: keyof RouteData, value: string | number | Date) => {
    // Validering og sanitizing
    if ((field === 'from' || field === 'to' || field === 'via') && typeof value === 'string') {
      value = value.trim().slice(0, 100); // Begrenset lengde for adresser
    }
    
    if (field === 'batteryPercentage' && typeof value === 'number') {
      value = Math.max(0, Math.min(100, value)); // Sikre 0-100 range
    }
    
    if (field === 'trailerWeight' && typeof value === 'number') {
      value = Math.max(0, Math.min(3500, value)); // Sikre 0-3500 kg range
    }
    
    const newData = {
      ...routeData,
      [field]: value
    };
    
    onRouteChange(newData);
  };

  // Funksjon for å beregne realistisk reisetid og distanse for alle norske ruter
  const calculateRealisticRouteTime = (from: string, to: string, routeType: string) => {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    
    // Rutetype-påvirkning
    let speedMultiplier = 1;
    let distanceMultiplier = 1;
    let routeDescription = '';
    
    switch (routeType) {
      case 'fastest':
        speedMultiplier = 1.05; // 5% raskere (men fortsatt realistisk)
        distanceMultiplier = 1.02;
        routeDescription = 'raskeste rute';
        break;
      case 'shortest':
        speedMultiplier = 0.9; // 10% tregere på mindre veier
        distanceMultiplier = 0.95;
        routeDescription = 'korteste rute';
        break;
      case 'eco':
        speedMultiplier = 0.95; // 5% tregere
        distanceMultiplier = 1.08;
        routeDescription = 'miljøvennlig rute';
        break;
      default:
        routeDescription = 'standard rute';
    }

    // Realistiske ruter med ferjer, fjellveier og trafikk inkludert
    let baseMinutes = 180;
    let baseDistance = 200;

    // Hovedruter med alle realistiske faktorer - Korrigerte tider
    // Ålesund/Fureåsen til Kvalsvik (Nerlandsøya) - Koordinater: (62.4722,6.1495) → (62.3333,5.5376)
    if ((fromLower.includes('ålesund') && (toLower.includes('kvalsv') || toLower.includes('nerlandsøy'))) ||
        ((toLower.includes('kvalsv') || toLower.includes('nerlandsøy')) && fromLower.includes('ålesund')) ||
        (fromLower.includes('fureåsen') && (toLower.includes('kvalsv') || toLower.includes('nerlandsøy'))) ||
        ((toLower.includes('kvalsv') || toLower.includes('nerlandsøy')) && fromLower.includes('fureåsen')) ||
        (fromLower.includes('fureåsen 15') && (toLower.includes('kvalsv') || toLower.includes('nerlandsøy'))) ||
        ((toLower.includes('kvalsv') || toLower.includes('nerlandsøy')) && fromLower.includes('fureåsen 15'))) {
      // Fureåsen/Ålesund til Kvalsvik (Nerlandsøya) - MED FERJE
      // Kjøring til ferje: 25min + Ferjeventing/tid: 60min + Kjøring fra ferje: 15min + Buffer: 15min = 115min
      baseMinutes = 115; // Realistisk tid: 1t 55min med ferje, trafikk og vær
      baseDistance = 45; // Faktisk avstand ca 45km + ferjedistanse
      console.log('🚗 RouteInput: OVERSTYRER Ålesund/Fureåsen-Kvalsvik (Nerlandsøya, med ferje): 115min', { from, to });
    }
    else if ((fromLower.includes('oslo') && toLower.includes('trondheim')) ||
             (fromLower.includes('trondheim') && toLower.includes('oslo'))) {
      baseMinutes = 390; // 6.5t (inkl. trafikk + buffer)
      baseDistance = 500;
    }
    else if ((fromLower.includes('oslo') && toLower.includes('bergen')) ||
             (fromLower.includes('bergen') && toLower.includes('oslo'))) {
      baseMinutes = 510; // 8.5t (fjellvei + vær)
      baseDistance = 460;
    }
    else if ((fromLower.includes('oslo') && toLower.includes('stavanger')) ||
             (fromLower.includes('stavanger') && toLower.includes('oslo'))) {
      baseMinutes = 450; // 7.5t
      baseDistance = 400;
    }
    else if ((fromLower.includes('bergen') && toLower.includes('stavanger')) ||
             (fromLower.includes('stavanger') && toLower.includes('bergen'))) {
      baseMinutes = 270; // 4.5t (med ferje)
      baseDistance = 200;
    }
    else if ((fromLower.includes('bergen') && toLower.includes('trondheim')) ||
             (fromLower.includes('trondheim') && toLower.includes('bergen'))) {
      baseMinutes = 600; // 10t (lang fjellvei)
      baseDistance = 650;
    }
    // Vestlandsruter (ferjer og fjorder) - REALISTISKE TIDER for fjell- og fjordveier
    else if ((fromLower.includes('bergen') && (toLower.includes('ålesund') || toLower.includes('molde') || fromLower.includes('fureåsen'))) ||
             ((fromLower.includes('ålesund') || fromLower.includes('molde') || fromLower.includes('fureåsen')) && toLower.includes('bergen'))) {
      // Fureåsen/Ålesund til Bergen: 500km fjell/fjordvei med ferjer, lave fartsgrenser (60-80 km/h)
      // Grunnkjøring: 7t + Ferjer: 1t + Trafikk/vær: 1-2t = 9-10t realistisk
      baseMinutes = 540; // 9t (realistisk for fjell- og fjordkjøring med ferjer)
      baseDistance = 480; // Reell avstand via fjellveier
      console.log('🚗 RouteInput: OVERSTYRER Fureåsen/Ålesund-Bergen (REALISTISK FJELLVEI): 540min', { from, to });
    }
    // Nordnorge
    else if ((fromLower.includes('trondheim') && (toLower.includes('bodø') || toLower.includes('tromsø'))) ||
             ((fromLower.includes('bodø') || fromLower.includes('tromsø')) && toLower.includes('trondheim'))) {
      baseMinutes = 720; // 12t+ (lange avstander)
      baseDistance = 800;
    }
    // Kort-mellom ruter
    else if ((fromLower.includes('oslo') && (toLower.includes('kristiansand') || toLower.includes('drammen'))) ||
             ((fromLower.includes('kristiansand') || fromLower.includes('drammen')) && toLower.includes('oslo'))) {
      baseMinutes = 330; // 5.5t
      baseDistance = 320;
    }

    const finalMinutes = Math.round(baseMinutes / speedMultiplier);
    const finalDistance = Math.round(baseDistance * distanceMultiplier);

    console.log('🕒 RouteInput realistisk beregning:', {
      from: from,
      to: to,
      routeType: routeType,
      finalTime: `${Math.floor(finalMinutes / 60)}t ${finalMinutes % 60}min`,
      finalDistance: `${finalDistance}km`
    });

    return {
      minutes: finalMinutes,
      distance: finalDistance,
      description: routeDescription
    };
  };

  // Funksjon for å beregne anbefalt avreisertid basert på valgt rutetype
  const calculateDepartureTime = (arrivalTime: Date): string => {
    console.log('🕒 RouteInput calculateDepartureTime called:', {
      from: routeData.from,
      to: routeData.to,
      arrivalTime: arrivalTime
    });
    
    // Beregn realistisk reisetid for alle norske ruter
    const realisticTravelData = calculateRealisticRouteTime(routeData.from, routeData.to, selectedRouteType);
    let estimatedTravelMinutes = realisticTravelData.minutes;
    let estimatedDistanceKm = realisticTravelData.distance;
    let routeDescription = realisticTravelData.description;
    
    console.log('🕒 RouteInput calculateDepartureTime - travel data:', {
      from: routeData.from,
      to: routeData.to,
      estimatedTravelMinutes,
      travelTime: `${Math.floor(estimatedTravelMinutes / 60)}t ${Math.round(estimatedTravelMinutes % 60)}min`
    });
    
    // Beregn ladebehov mer konservativt basert på rutetype
    const currentBattery = routeData.batteryPercentage;
    const trailerWeight = routeData.trailerWeight;
    
    // Konservativ rekkevidde-estimering justert for rutetype
    let baseRangeKm = 350; // Mer konservativ rekkevidde
    
    // Rutetype påvirker energiforbruk
    switch (selectedRouteType) {
      case 'fastest':
        baseRangeKm *= 0.95; // 5% mer forbruk på motorveier
        break;
      case 'eco':
        baseRangeKm *= 1.1; // 10% mindre forbruk på eco-rute
        break;
      // 'shortest' bruker standard rekkevidde
    }
    
    const trailerReduction = trailerWeight > 0 ? 0.65 : 1; // 35% reduksjon med tilhenger
    const winterReduction = 0.85; // 15% reduksjon for vinter/kulde
    const effectiveRangeKm = baseRangeKm * trailerReduction * winterReduction;
    
    // Beregn hvor langt vi kan kjøre med nåværende batteri
    const currentRangeKm = (currentBattery / 100) * effectiveRangeKm;
    
    let chargingTimeMinutes = 0;
    
    if (estimatedDistanceKm > currentRangeKm * 0.9) { // Buffer på 10%
      // Trenger lading underveis
      const remainingDistanceKm = estimatedDistanceKm - (currentRangeKm * 0.9);
      const chargingStops = Math.ceil(remainingDistanceKm / (effectiveRangeKm * 0.7)); // Lad til 70% for å være sikker
      
      // Første lading avhenger av startnivå
      if (currentBattery < 20) {
        chargingTimeMinutes += 60; // Lang ladetid fra lavt nivå
      } else if (currentBattery < 50) {
        chargingTimeMinutes += 40; // Moderat ladetid
      } else {
        chargingTimeMinutes += 25; // Kort påfyll
      }
      
      // Ekstra ladestopP underveis (30-40 min hver)
      chargingTimeMinutes += (chargingStops - 1) * 35;
      
      // Buffer for å finne ladestasjoner og køer (eco-rute kan ha færre stasjoner)
      const stationBuffer = selectedRouteType === 'eco' ? 20 : 15;
      chargingTimeMinutes += chargingStops * stationBuffer;
    } else if (currentBattery < 40 && estimatedDistanceKm > 150) {
      // Sikkerhetslading på lengre turer
      chargingTimeMinutes = 30;
    }
    
    // Realistiske buffere justert for rutetype
    let ferryBufferMinutes = estimatedDistanceKm > 300 ? 60 : 30;
    let trafficBufferMinutes = estimatedDistanceKm > 300 ? 60 : 30;
    
    // Juster buffere basert på rutetype
    switch (selectedRouteType) {
      case 'fastest':
        trafficBufferMinutes *= 0.8; // Mindre trafikk på motorveier
        break;
      case 'eco':
        ferryBufferMinutes *= 1.2; // Mer ferjer på miljøvennlig rute
        trafficBufferMinutes *= 1.1; // Mer trafikk på mindre veier
        break;
      // 'shortest' bruker standard buffere
    }
    
    const weatherBufferMinutes = 20; // Værforhold
    
    const totalTravelMinutes = estimatedTravelMinutes + ferryBufferMinutes + trafficBufferMinutes + chargingTimeMinutes + weatherBufferMinutes;
    
    // Beregn avreisertid
    console.log('🕒 RouteInput Final calculation:', {
      estimatedTravelMinutes,
      routeDescription,
      from: routeData.from,
      to: routeData.to
    });
    
    const departureTime = new Date(arrivalTime.getTime() - (estimatedTravelMinutes * 60 * 1000));
    
    const hours = Math.floor(estimatedTravelMinutes / 60);
    const minutes = estimatedTravelMinutes % 60;
    const totalTimeInfo = `${hours}t ${minutes}m via ${routeDescription}`;
    
    console.log('🕒 RouteInput returning:', totalTimeInfo);
    
    return `${format(departureTime, "dd.MM 'kl.' HH:mm")} (${totalTimeInfo})`;
  };

  // Beregn avreisertid basert på rute og ankomsttid - oppdateres når ruten endres
  const calculatedDepartureTime = useMemo(() => {
    if (!routeData.arrivalTime || !routeData.from || !routeData.to) {
      return null;
    }
    return calculateDepartureTime(routeData.arrivalTime);
  }, [routeData.from, routeData.to, routeData.arrivalTime, routeData.batteryPercentage, routeData.trailerWeight, selectedRouteType]);

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Planlegg rute</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Fra
            </Label>
            <NorwegianAddressInput
              value={routeData.from}
              onChange={(value) => handleInputChange('from', value)}
              placeholder="Fra adresse..."
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Til
            </Label>
            <NorwegianAddressInput
              value={routeData.to}
              onChange={(value) => handleInputChange('to', value)}
              placeholder="Til adresse..."
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="via" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Via (valgfritt)
            </Label>
            <NorwegianAddressInput
              value={routeData.via || ''}
              onChange={(value) => handleInputChange('via', value)}
              placeholder="Via adresse (valgfritt)..."
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="battery" className="flex items-center gap-2">
            <Battery className="h-3 w-3" />
            Batteriprosent ved start
          </Label>
          <Input
            id="battery"
            type="number"
            placeholder=""
            value={routeData.batteryPercentage || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleInputChange('batteryPercentage', 0);
              } else {
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                  handleInputChange('batteryPercentage', 0);
                } else if (numValue > 100) {
                  handleInputChange('batteryPercentage', 100);
                } else {
                  handleInputChange('batteryPercentage', Math.round(numValue));
                }
              }
            }}
            className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            min="0"
            max="100"
          />
          {routeData.batteryPercentage > 0 && (
            <Badge variant="outline" className="text-xs">
              {routeData.batteryPercentage}% batteri
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trailer" className="flex items-center gap-2">
            <Truck className="h-3 w-3" />
            Hengervekt (kg)
          </Label>
          <Input
            id="trailer"
            type="number"
            placeholder="0"
            value={routeData.trailerWeight || ''}
            onChange={(e) => handleInputChange('trailerWeight', parseInt(e.target.value) || 0)}
            className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
          />
          {routeData.trailerWeight > 0 && (
            <Badge variant="outline" className="text-xs">
              +{Math.round(routeData.trailerWeight * 0.15)}% forbruk
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            Reisedato
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 border-border hover:border-primary",
                  !routeData.travelDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {routeData.travelDate ? format(routeData.travelDate, "PPP") : "Velg reisedato"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={routeData.travelDate}
                onSelect={(date) => {
                  handleInputChange('travelDate', date || new Date());
                  setCalendarOpen(false);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {routeData.travelDate && (
            <Badge variant="outline" className="text-xs">
              Værvarsel for {format(routeData.travelDate, "dd.MM.yyyy")}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Ønsket ankomsttid (valgfritt)
          </Label>
          <Popover open={arrivalCalendarOpen} onOpenChange={setArrivalCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 border-border hover:border-primary",
                  !routeData.arrivalTime && "text-muted-foreground"
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {routeData.arrivalTime ? format(routeData.arrivalTime, "PPP 'kl.' HH:mm") : "Velg ønsket ankomsttid"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="space-y-0">
                <Calendar
                  mode="single"
                  selected={routeData.arrivalTime}
                  onSelect={(date) => {
                    if (date) {
                      // Behold eksisterende tid hvis dato endres
                      const arrivalDate = new Date(date);
                      if (!routeData.arrivalTime) {
                        arrivalDate.setHours(12, 0, 0, 0);
                      } else {
                        arrivalDate.setHours(
                          routeData.arrivalTime.getHours(),
                          routeData.arrivalTime.getMinutes(),
                          0,
                          0
                        );
                      }
                      handleInputChange('arrivalTime', arrivalDate);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="border-t p-3">
                  <Label className="text-sm font-medium mb-2 block">Klokkeslett</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="hour" className="text-xs text-muted-foreground">Time</Label>
                      <Input
                        id="hour"
                        type="number"
                        min="0"
                        max="23"
                        value={routeData.arrivalTime?.getHours() || 12}
                        onChange={(e) => {
                          const hour = parseInt(e.target.value) || 0;
                          const currentDate = routeData.arrivalTime || new Date();
                          const newDateTime = new Date(currentDate);
                          newDateTime.setHours(Math.max(0, Math.min(23, hour)));
                          handleInputChange('arrivalTime', newDateTime);
                        }}
                        className="h-8 text-center"
                      />
                    </div>
                    <div className="flex items-end justify-center pb-2">
                      <span className="text-lg font-bold">:</span>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="minute" className="text-xs text-muted-foreground">Minutt</Label>
                      <Input
                        id="minute"
                        type="number"
                        min="0"
                        max="59"
                        step="15"
                        value={routeData.arrivalTime?.getMinutes() || 0}
                        onChange={(e) => {
                          const minute = parseInt(e.target.value) || 0;
                          const currentDate = routeData.arrivalTime || new Date();
                          const newDateTime = new Date(currentDate);
                          newDateTime.setMinutes(Math.max(0, Math.min(59, minute)));
                          handleInputChange('arrivalTime', newDateTime);
                        }}
                        className="h-8 text-center"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setArrivalCalendarOpen(false)} 
                    className="w-full mt-3 h-8"
                    size="sm"
                  >
                    Ferdig
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {routeData.arrivalTime && calculatedDepartureTime && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-sm font-medium px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200 shadow-sm">
                💡 Anbefalt avreise: {calculatedDepartureTime}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlanRoute();
            }}
            disabled={isPlanning}
            className="flex-1 bg-gradient-electric hover:bg-gradient-eco shadow-neon hover:shadow-glow animate-pulse-neon disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isPlanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Planlegger rute...
              </>
            ) : (
              <>
                <Route className="h-4 w-4 mr-2" />
                Planlegg rute
              </>
            )}
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              // Find the parent window to trigger navigation tracker
              const event = new CustomEvent('showNavigationTracker');
              window.dispatchEvent(event);
            }}
            variant="outline"
            className="px-4 border-primary/30 hover:border-primary/60"
            size="lg"
            title="Start GPS-navigasjon"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}