import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Clock, 
  Battery, 
  MapPin, 
  Zap, 
  Phone,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { useCarPlay } from '@/hooks/useCarPlay';

interface CarNavigationInterfaceProps {
  isActive: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  destination: string;
  remainingDistance?: number;
  remainingTime?: number;
  batteryPercentage: number;
  nextTurn?: {
    direction: 'left' | 'right' | 'straight' | 'u-turn';
    distance: number;
    instruction: string;
  };
  onEndNavigation: () => void;
}

export const CarNavigationInterface: React.FC<CarNavigationInterfaceProps> = ({
  isActive,
  currentLocation,
  destination,
  remainingDistance,
  remainingTime,
  batteryPercentage,
  nextTurn,
  onEndNavigation
}) => {
  const { isConnected, isSupported } = useCarPlay();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}t ${mins}min`;
    }
    return `${mins}min`;
  };

  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'left':
        return <ArrowLeft className="h-8 w-8" />;
      case 'right':
        return <ArrowRight className="h-8 w-8" />;
      case 'u-turn':
        return <RotateCcw className="h-8 w-8" />;
      default:
        return <ArrowUp className="h-8 w-8" />;
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header Bar - Car-style */}
      <div className="flex justify-between items-center p-4 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {currentTime.toLocaleTimeString('no-NO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Badge>
          
          {isConnected && (
            <Badge variant="secondary" className="text-xs">
              CarPlay
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Badge 
            variant={batteryPercentage > 20 ? "default" : "destructive"}
            className="text-sm"
          >
            <Battery className="h-3 w-3 mr-1" />
            {batteryPercentage}%
          </Badge>
          
          <Button
            onClick={onEndNavigation}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Avslutt
          </Button>
        </div>
      </div>

      {/* Main Navigation Display */}
      <div className="flex-1 flex flex-col">
        {/* Next Turn Card - Large and prominent */}
        {nextTurn && (
          <Card className="m-4 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="text-primary">
                  {getDirectionIcon(nextTurn.direction)}
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {nextTurn.distance < 1000 
                      ? `${Math.round(nextTurn.distance)}m`
                      : `${(nextTurn.distance / 1000).toFixed(1)}km`
                    }
                  </div>
                  <div className="text-muted-foreground text-lg">
                    {nextTurn.instruction}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Information */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Destination */}
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-sm text-muted-foreground mb-1">Destinasjon</div>
                <div className="font-semibold text-foreground truncate">
                  {destination}
                </div>
              </CardContent>
            </Card>

            {/* Remaining Time */}
            {remainingTime && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-sm text-muted-foreground mb-1">Gjenstående tid</div>
                  <div className="font-semibold text-xl text-foreground">
                    {formatTime(remainingTime)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remaining Distance */}
            {remainingDistance && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Navigation className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-sm text-muted-foreground mb-1">Gjenstående avstand</div>
                  <div className="font-semibold text-xl text-foreground">
                    {remainingDistance < 1 
                      ? `${Math.round(remainingDistance * 1000)}m`
                      : `${remainingDistance.toFixed(1)}km`
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="lg" className="flex-1 max-w-xs">
              <Zap className="h-4 w-4 mr-2" />
              Finn ladestasjon
            </Button>
            
            <Button variant="outline" size="lg" className="flex-1 max-w-xs">
              <Phone className="h-4 w-4 mr-2" />
              Ring destinasjon
            </Button>
          </div>
        </div>
      </div>

      {/* Car-optimized styles */}
      <style>{`
        .fixed {
          font-size: 1.2rem;
        }
        
        @media (max-height: 600px) {
          .fixed {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};