import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Route } from "lucide-react";

interface RouteData {
  from: string;
  to: string;
  trailerWeight: number;
}

interface RouteInputProps {
  routeData: RouteData;
  onRouteChange: (data: RouteData) => void;
  onPlanRoute: () => void;
}

export default function RouteInput({ routeData, onRouteChange, onPlanRoute }: RouteInputProps) {
  const handleInputChange = (field: keyof RouteData, value: string | number) => {
    onRouteChange({
      ...routeData,
      [field]: value
    });
  };

  return (
    <Card className="p-6 bg-glass-bg backdrop-blur-sm border-glass-border shadow-glow">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Planlegg rute</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Fra
            </Label>
            <Input
              id="from"
              placeholder="Oslo"
              value={routeData.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              className="bg-background/50 border-glass-border focus:border-primary focus:shadow-glow"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Til
            </Label>
            <Input
              id="to"
              placeholder="Bergen"
              value={routeData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="bg-background/50 border-glass-border focus:border-primary focus:shadow-glow"
            />
          </div>
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
            className="bg-background/50 border-glass-border focus:border-primary focus:shadow-glow"
          />
          {routeData.trailerWeight > 0 && (
            <Badge variant="outline" className="text-xs">
              +{Math.round(routeData.trailerWeight * 0.15)}% forbruk
            </Badge>
          )}
        </div>

        <Button 
          onClick={onPlanRoute}
          className="w-full bg-gradient-electric hover:bg-gradient-eco shadow-neon hover:shadow-glow animate-pulse-neon"
          size="lg"
        >
          <Route className="h-4 w-4 mr-2" />
          Planlegg rute
        </Button>
      </div>
    </Card>
  );
}