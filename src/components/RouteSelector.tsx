import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Route, Clock, Zap, TreePine, ChevronDown, ChevronUp } from "lucide-react";

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
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  // Auto-expand the fastest route when it's selected
  React.useEffect(() => {
    if (selectedRoute === 'fastest' && expandedRoute !== 'fastest') {
      setExpandedRoute('fastest');
    }
  }, [selectedRoute, expandedRoute]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Beregner rutevalg...</p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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

  const getRouteDescription = (routeType: string) => {
    switch (routeType) {
      case 'fastest':
        return 'Direkteste vei som prioriterer hastighet og hovedveier for å komme frem så raskt som mulig.';
      case 'shortest':
        return 'Direkteste vei mellom destinasjonene som minimerer total kjøreavstand for lavest batteriforbruk.';
      case 'eco':
        return 'Miljøvennlig rute som unngår hovedveier og bomveier for mer økonomisk og bærekraftig kjøring.';
      default:
        return 'Standard rutevalg basert på balansert kjøring.';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}t ${mins}m` : `${mins}m`;
  };

  const handleRouteClick = (route: RouteOption) => {
    // Toggle expansion
    setExpandedRoute(expandedRoute === route.id ? null : route.id);
    // Select route
    onRouteSelect(route.id);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Rutevalg</h3>
      
      <div className="space-y-2">
        {routes.map((route) => {
          const isSelected = selectedRoute === route.id;
          const isExpanded = expandedRoute === route.id;
          
          return (
            <div key={route.id} className="space-y-2">
              {/* Main route line */}
              <div
                className={`flex items-center justify-between cursor-pointer p-2 rounded transition-colors ${
                  isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
                onClick={() => handleRouteClick(route)}
              >
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
                  <span className="font-medium">{getRouteTypeName(route.routeType)} rute</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">{route.distance} km</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <Badge variant="outline" className="text-xs">Valgt</Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="ml-6 pl-4 border-l-2 border-muted space-y-3 pb-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getRouteDescription(route.routeType)}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Route className="h-3 w-3" />
                        <span>Avstand</span>
                      </div>
                      <div className="font-medium">{route.distance} km</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        <span>Kjøretid</span>
                      </div>
                      <div className="font-medium">{formatDuration(route.duration)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Zap className="h-3 w-3" />
                        <span>Ladestasjoner</span>
                      </div>
                      <div className="font-medium">{route.chargingStops} stopp</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Estimert kostnad
                      </div>
                      <div className="font-medium">{route.estimatedCost} NOK</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RouteSelector;
export { type RouteOption };