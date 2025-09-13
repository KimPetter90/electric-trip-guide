import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Car, Battery, ChevronDown, ChevronUp } from "lucide-react";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

const carModels: CarModel[] = [
  {
    id: "tesla-model3",
    brand: "Tesla",
    model: "Model 3",
    batteryCapacity: 75,
    range: 560,
    consumption: 14.3,
    image: "🚗"
  },
  {
    id: "tesla-models",
    brand: "Tesla",
    model: "Model S",
    batteryCapacity: 100,
    range: 652,
    consumption: 16.5,
    image: "🚗"
  },
  {
    id: "tesla-modelx",
    brand: "Tesla",
    model: "Model X",
    batteryCapacity: 100,
    range: 560,
    consumption: 20.6,
    image: "🚙"
  },
  {
    id: "vw-id4",
    brand: "Volkswagen",
    model: "ID.4",
    batteryCapacity: 77,
    range: 520,
    consumption: 16.2,
    image: "🚙"
  },
  {
    id: "vw-id3",
    brand: "Volkswagen",
    model: "ID.3",
    batteryCapacity: 58,
    range: 426,
    consumption: 15.4,
    image: "🚗"
  },
  {
    id: "vw-idbuzz",
    brand: "Volkswagen",
    model: "ID.Buzz",
    batteryCapacity: 77,
    range: 423,
    consumption: 21.9,
    image: "🚐"
  },
  {
    id: "hyundai-ioniq5",
    brand: "Hyundai",
    model: "IONIQ 5",
    batteryCapacity: 77.4,
    range: 481,
    consumption: 18.0,
    image: "🚐"
  },
  {
    id: "hyundai-ioniq6",
    brand: "Hyundai",
    model: "IONIQ 6",
    batteryCapacity: 77.4,
    range: 614,
    consumption: 14.3,
    image: "🚗"
  },
  {
    id: "bmw-ix3",
    brand: "BMW",
    model: "iX3",
    batteryCapacity: 80,
    range: 460,
    consumption: 18.5,
    image: "🚗"
  },
  {
    id: "bmw-ix",
    brand: "BMW",
    model: "iX",
    batteryCapacity: 111.5,
    range: 630,
    consumption: 19.8,
    image: "🚙"
  },
  {
    id: "bmw-i4",
    brand: "BMW",
    model: "i4",
    batteryCapacity: 83.9,
    range: 590,
    consumption: 16.1,
    image: "🚗"
  }
];

// Grupperer biler etter merke
const carBrands = Array.from(new Set(carModels.map(car => car.brand))).sort();

interface CarSelectorProps {
  selectedCar: CarModel | null;
  onCarSelect: (car: CarModel) => void;
}

export default function CarSelector({ selectedCar, onCarSelect }: CarSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const toggleBrand = (brand: string) => {
    if (expandedBrand === brand) {
      setExpandedBrand(null);
    } else {
      setExpandedBrand(brand);
      setSelectedBrand(brand);
    }
  };

  const handleCarSelect = (car: CarModel) => {
    onCarSelect(car);
    setExpandedBrand(null); // Lukk dropdown etter valg
  };

  const getModelsForBrand = (brand: string) => {
    return carModels.filter(car => car.brand === brand);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Velg din elbil</h3>
      </div>
      
      {/* Bilmerker */}
      <div className="space-y-2">
        {carBrands.map((brand) => {
          const isExpanded = expandedBrand === brand;
          const brandModels = getModelsForBrand(brand);
          const hasSelectedCarFromBrand = selectedCar && selectedCar.brand === brand;
          
          return (
            <div key={brand} className="relative">
              {/* Brand Button */}
              <Button
                variant="outline"
                onClick={() => toggleBrand(brand)}
                className={`w-full justify-between p-4 h-auto bg-glass-bg backdrop-blur-sm border-glass-border hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 ${
                  hasSelectedCarFromBrand ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {brand === 'Tesla' && '⚡'}
                    {brand === 'Volkswagen' && '🔷'}
                    {brand === 'Hyundai' && '🔵'}
                    {brand === 'BMW' && '🔘'}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-foreground">{brand}</h4>
                    <p className="text-sm text-muted-foreground">{brandModels.length} modeller</p>
                  </div>
                </div>
                {isExpanded ? 
                  <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </Button>

              {/* Models Dropdown */}
              {isExpanded && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-glass-border rounded-lg shadow-lg backdrop-blur-sm animate-fade-in">
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                    {brandModels.map((car) => (
                      <Card
                        key={car.id}
                        className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-neon ${
                          selectedCar?.id === car.id 
                            ? 'ring-2 ring-primary bg-gradient-electric text-primary-foreground shadow-electric' 
                            : 'bg-background/80 border-glass-border hover:bg-primary/5 hover:border-primary/20'
                        }`}
                        onClick={() => handleCarSelect(car)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{car.image}</span>
                              <div>
                                <h5 className="font-semibold text-sm">{car.model}</h5>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Battery className="h-3 w-3" />
                                <span>{car.batteryCapacity} kWh</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                <span>{car.range} km</span>
                              </div>
                            </div>
                            
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {car.consumption} kWh/100km
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Valgt bil info */}
      {selectedCar && (
        <Card className="p-4 bg-gradient-electric text-primary-foreground shadow-electric animate-pulse-neon">
          <h4 className="font-semibold mb-2">Valgt bil:</h4>
          <p className="text-sm">
            {selectedCar.brand} {selectedCar.model} - {selectedCar.batteryCapacity} kWh, {selectedCar.range} km rekkevidde
          </p>
        </Card>
      )}
    </div>
  );
}