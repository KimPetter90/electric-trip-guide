import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Route, Clock, Zap, DollarSign, MapPin } from "lucide-react";

interface RouteOption {
  id: string;
  name: string;
  distance: number;
  duration: number;
  chargingStops: number;
  estimatedCost: number;
  description: string;
  routeType: 'fastest' | 'shortest' | 'eco';
}

interface RouteSelectorProps {
  routes: RouteOption[];
  selectedRoute: string | null;
  onRouteSelect: (routeId: string) => void;
  isLoading?: boolean;
}

export default function RouteSelector({ routes, selectedRoute, onRouteSelect, isLoading }: RouteSelectorProps) {
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
        return <Clock className="h-4 w-4" />;
      case 'shortest':
        return <Route className="h-4 w-4" />;
      case 'eco':
        return <Zap className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getRouteTypeName = (type: string) => {
    switch (type) {
      case 'fastest':
        return 'Raskeste';
      case 'shortest':
        return 'Korteste';
      case 'eco':
        return 'Miljøvennlig';
      default:
        return 'Standard';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Route className="h-5 w-5 text-primary animate-glow-pulse" />
          <h3 className="text-lg font-semibold text-foreground">Beregner rutevalg...</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/50 animate-pulse rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Velg rutevalg</h3>
      </div>

      <div className="space-y-3">
        {routes.map((route) => (
          <div
            key={route.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedRoute === route.id 
                ? 'border-primary bg-primary/10 shadow-lg' 
                : 'border-border bg-card/60 hover:border-primary/50 hover:bg-primary/5'
              }
            `}
            onClick={() => {
              console.log('🎯 Rutevalg klikket:', route.id);
              onRouteSelect(route.id);
              console.log('✅ onRouteSelect kalt med:', route.id);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${getRouteTypeColor(route.routeType)} flex items-center gap-1`}>
                  {getRouteTypeIcon(route.routeType)}
                  {getRouteTypeName(route.routeType)}
                </Badge>
                <h4 className="font-semibold text-foreground">{route.name}</h4>
              </div>
              {selectedRoute === route.id && (
                <Badge variant="default" className="animate-pulse-neon">Valgt</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">{route.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{route.distance} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {Math.floor(route.duration / 60)}t {route.duration % 60}m
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{route.chargingStops} stopp</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-foreground font-medium">{route.estimatedCost} NOK</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Velg en rute for å se den på kartet
        </p>
      </div>
    </Card>
  );
}

export { type RouteOption };