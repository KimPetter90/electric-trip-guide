import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, AlertTriangle } from "lucide-react";

interface TrailerImpactProps {
  selectedCar: any;
  routeData: {
    trailerWeight: number;
    [key: string]: any;
  };
}

const TrailerImpact: React.FC<TrailerImpactProps> = ({ selectedCar, routeData }) => {
  if (!selectedCar || !routeData.trailerWeight || routeData.trailerWeight === 0) {
    return (
      <Card className="p-6 glass-card border border-slate-500/30 bg-gradient-to-br from-slate-950/20 to-slate-900/10">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-6 w-6 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-300">Hengerlast påvirkning</h3>
        </div>
        <p className="text-slate-400">Velg hengervekt for å se påvirkning på rekkevidde</p>
      </Card>
    );
  }

  // Calculate impact based on trailer weight
  const getTrailerImpact = (weight: number) => {
    if (weight <= 500) return { factor: 0.95, level: "Minimal", color: "green" };
    if (weight <= 1000) return { factor: 0.88, level: "Moderat", color: "yellow" };
    if (weight <= 1500) return { factor: 0.82, level: "Betydelig", color: "orange" };
    return { factor: 0.75, level: "Høy", color: "red" };
  };

  const impact = getTrailerImpact(routeData.trailerWeight);
  const adjustedRange = Math.round(selectedCar.range * impact.factor);
  const rangeReduction = selectedCar.range - adjustedRange;
  const impactPercentage = Math.round((1 - impact.factor) * 100);

  const getImpactColor = (color: string) => {
    switch (color) {
      case "green": return "text-green-400 border-green-500/30 bg-gradient-to-br from-green-950/20 to-green-900/10";
      case "yellow": return "text-yellow-400 border-yellow-500/30 bg-gradient-to-br from-yellow-950/20 to-yellow-900/10";
      case "orange": return "text-orange-400 border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-orange-900/10";
      case "red": return "text-red-400 border-red-500/30 bg-gradient-to-br from-red-950/20 to-red-900/10";
      default: return "text-slate-400 border-slate-500/30 bg-gradient-to-br from-slate-950/20 to-slate-900/10";
    }
  };

  return (
    <Card className={`p-6 glass-card border ${getImpactColor(impact.color)}`}>
      <div className="flex items-center gap-3 mb-4">
        <Truck className={`h-6 w-6 ${getImpactColor(impact.color).split(' ')[0]}`} />
        <h3 className="text-lg font-semibold text-slate-200">Hengerlast påvirkning</h3>
        <Badge variant="outline" className={`${getImpactColor(impact.color).split(' ')[0]} border-current`}>
          {routeData.trailerWeight} kg
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Påvirkningsnivå</span>
          <div className="flex items-center gap-2">
            {impact.level === "Høy" && <AlertTriangle className="h-4 w-4 text-red-400" />}
            <Badge variant="outline" className={`${getImpactColor(impact.color).split(' ')[0]} border-current`}>
              {impact.level}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Rekkeviddereduksjon</span>
            <span className={getImpactColor(impact.color).split(' ')[0]}>{impactPercentage}%</span>
          </div>
          <Progress 
            value={impactPercentage} 
            className="h-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Original rekkevidde</p>
            <p className="text-lg font-bold text-slate-200">{selectedCar.range} km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Justert rekkevidde</p>
            <p className={`text-lg font-bold ${getImpactColor(impact.color).split(' ')[0]}`}>
              {adjustedRange} km
            </p>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            Reduksjon: <span className={getImpactColor(impact.color).split(' ')[0]}>{rangeReduction} km</span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TrailerImpact;