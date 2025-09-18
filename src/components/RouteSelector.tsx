import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Clock, Zap, TreePine, Info } from "lucide-react";
import RouteDetailsSidebar from "./RouteDetailsSidebar";

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

const RouteSelector: React.FC<RouteSelectorProps> = ({ 
  routes, 
  selectedRoute, 
  onRouteSelect, 
  isLoading = false 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRouteForDetails, setSelectedRouteForDetails] = useState<RouteOption | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Beregner rutevalg...</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-36 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getRouteTypeColor = (routeType: string) => {
    switch (routeType) {
      case 'fastest':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'shortest':
        return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'eco':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getRouteTypeIcon = (routeType: string) => {
    switch (routeType) {
      case 'fastest':
        return <Zap className="h-4 w-4" />;
      case 'shortest':
        return <Route className="h-4 w-4" />;
      case 'eco':
        return <TreePine className="h-4 w-4" />;
      default:
        return <Route className="h-4 w-4" />;
    }
  };

  const getRouteTypeName = (routeType: string) => {
    switch (routeType) {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}t ${mins}m` : `${mins}m`;
  };

  const handleRouteClick = (route: RouteOption) => {
    onRouteSelect(route.id);
  };

  const handleInfoClick = (route: RouteOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRouteForDetails(route);
    setSidebarOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rutevalg</h3>
        
        {/* Vertical route selection cards */}
        <div className="space-y-3">
          {routes.map((route) => {
            const isSelected = selectedRoute === route.id;
            const colorClass = getRouteTypeColor(route.routeType);
            
            return (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  isSelected 
                    ? `${colorClass} ring-2 ring-offset-2 ring-blue-500 shadow-lg` 
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
                onClick={() => handleRouteClick(route)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`flex items-center gap-1 ${
                        route.routeType === 'fastest' ? 'bg-blue-500 text-white' :
                        route.routeType === 'shortest' ? 'bg-green-500 text-white' :
                        route.routeType === 'eco' ? 'bg-purple-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {getRouteTypeIcon(route.routeType)}
                        {getRouteTypeName(route.routeType)}
                      </Badge>
                      <h4 className="font-semibold text-foreground">{route.name}</h4>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="animate-pulse">Valgt</Badge>
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
                      <span className="text-foreground font-medium">{formatDuration(route.duration)}</span>
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
              </Card>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Velg en rute for å se den på kartet
          </p>
        </div>
      </div>

      <RouteDetailsSidebar
        route={selectedRouteForDetails}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onSelectRoute={onRouteSelect}
      />
    </>
  );
};

export default RouteSelector;
export { type RouteOption };