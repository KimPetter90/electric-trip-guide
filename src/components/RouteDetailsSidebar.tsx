import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Route, 
  Clock, 
  Zap, 
  DollarSign, 
  MapPin, 
  Battery, 
  TreePine,
  Car,
  Info
} from "lucide-react";
import { type RouteOption } from './RouteSelector';

interface RouteDetailsSidebarProps {
  route: RouteOption | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoute: (routeId: string) => void;
}

const RouteDetailsSidebar: React.FC<RouteDetailsSidebarProps> = ({ 
  route, 
  isOpen, 
  onOpenChange,
  onSelectRoute 
}) => {
  if (!route) return null;

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'fastest':
        return 'bg-blue-500 text-white';
      case 'shortest':
        return 'bg-green-500 text-white';
      case 'eco':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'fastest':
        return <Zap className="h-4 w-4" />;
      case 'shortest':
        return <Route className="h-4 w-4" />;
      case 'eco':
        return <TreePine className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getRouteTypeName = (type: string) => {
    switch (type) {
      case 'fastest':
        return 'Raskeste rute';
      case 'shortest':
        return 'Korteste rute';
      case 'eco':
        return 'Miljøvennlig rute';
      default:
        return 'Standard rute';
    }
  };

  const getRouteDescription = (type: string) => {
    switch (type) {
      case 'fastest':
        return 'Prioriterer høy hastighet og hovedveier for å komme frem så raskt som mulig.';
      case 'shortest':
        return 'Velger den korteste avstanden mellom start og mål for å spare på batteriforbruket.';
      case 'eco':
        return 'Unngår hovedveier og bomveier for en mer miljøvennlig og økonomisk kjøring.';
      default:
        return 'Standard rutevalg basert på balansert kjøring.';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}t ${mins}m` : `${mins}m`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Badge className={`${getRouteTypeColor(route.routeType)} flex items-center gap-1`}>
              {getRouteTypeIcon(route.routeType)}
              {getRouteTypeName(route.routeType)}
            </Badge>
          </div>
          <SheetTitle className="text-left">{route.name}</SheetTitle>
          <SheetDescription className="text-left">
            {getRouteDescription(route.routeType)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Route Overview */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Ruteoversikt
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Avstand:</span>
                </div>
                <div className="font-medium text-lg">{route.distance} km</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kjøretid:</span>
                </div>
                <div className="font-medium text-lg">{formatDuration(route.duration)}</div>
              </div>
            </div>
          </Card>

          {/* Charging Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ladeinformasjon
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Antall ladestopp:</span>
                <span className="font-medium">{route.chargingStops} stopp</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimert ladekostnad:</span>
                <span className="font-medium">{route.estimatedCost} NOK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Batteriforbruk:</span>
                <span className="font-medium flex items-center gap-1">
                  <Battery className="h-4 w-4" />
                  ~85%
                </span>
              </div>
            </div>
          </Card>

          {/* Route Features */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Ruteegenskaper
            </h3>
            <div className="space-y-2 text-sm">
              {route.routeType === 'fastest' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Bruker hovedveier og motorveier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Tillater bomveier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Optimalisert for hastighet</span>
                  </div>
                </>
              )}
              {route.routeType === 'shortest' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Korteste mulige avstand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Unngår bomveier når mulig</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Lavest batteriforbruk</span>
                  </div>
                </>
              )}
              {route.routeType === 'eco' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Unngår hovedveier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Unngår bomveier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Mest miljøvennlig</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Laveste kjørekostnader</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Action Button */}
          <Button 
            onClick={() => {
              onSelectRoute(route.id);
              onOpenChange(false);
            }}
            className="w-full mt-6"
            size="lg"
          >
            Velg denne ruten
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsSidebar;