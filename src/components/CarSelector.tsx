import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Car, Battery, ArrowLeft } from "lucide-react";

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
  // Tesla
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
    id: "tesla-modely",
    brand: "Tesla",
    model: "Model Y",
    batteryCapacity: 75,
    range: 533,
    consumption: 15.6,
    image: "🚙"
  },
  {
    id: "tesla-cybertruck",
    brand: "Tesla",
    model: "Cybertruck",
    batteryCapacity: 123,
    range: 515,
    consumption: 23.9,
    image: "🚚"
  },

  // Volkswagen
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
    id: "vw-id4",
    brand: "Volkswagen",
    model: "ID.4",
    batteryCapacity: 77,
    range: 520,
    consumption: 16.2,
    image: "🚙"
  },
  {
    id: "vw-enyaq",
    brand: "Škoda",
    model: "Enyaq iV",
    batteryCapacity: 82,
    range: 534,
    consumption: 16.7,
    image: "🚙"
  },

  // BMW
  {
    id: "bmw-i4",
    brand: "BMW",
    model: "i4",
    batteryCapacity: 83.9,
    range: 590,
    consumption: 16.1,
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

  // Audi
  {
    id: "audi-etrongt",
    brand: "Audi",
    model: "e-tron GT",
    batteryCapacity: 93.4,
    range: 487,
    consumption: 19.6,
    image: "🚗"
  },
  {
    id: "audi-q4etron",
    brand: "Audi",
    model: "Q4 e-tron",
    batteryCapacity: 82,
    range: 520,
    consumption: 17.0,
    image: "🚙"
  },

  // Mercedes-Benz
  {
    id: "mercedes-eqs",
    brand: "Mercedes-Benz",
    model: "EQS",
    batteryCapacity: 107.8,
    range: 770,
    consumption: 15.7,
    image: "🚗"
  },
  {
    id: "mercedes-eqc",
    brand: "Mercedes-Benz",
    model: "EQC",
    batteryCapacity: 80,
    range: 417,
    consumption: 20.2,
    image: "🚙"
  },

  // Hyundai
  {
    id: "hyundai-ioniq5",
    brand: "Hyundai",
    model: "IONIQ 5",
    batteryCapacity: 77.4,
    range: 481,
    consumption: 18.0,
    image: "🚙"
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

  // Kia
  {
    id: "kia-ev6",
    brand: "Kia",
    model: "EV6",
    batteryCapacity: 77.4,
    range: 528,
    consumption: 16.5,
    image: "🚙"
  },
  {
    id: "kia-ev9",
    brand: "Kia",
    model: "EV9",
    batteryCapacity: 99.8,
    range: 563,
    consumption: 19.5,
    image: "🚙"
  },

  // Nissan
  {
    id: "nissan-leaf",
    brand: "Nissan",
    model: "Leaf",
    batteryCapacity: 62,
    range: 385,
    consumption: 17.0,
    image: "🚗"
  },
  {
    id: "nissan-ariya",
    brand: "Nissan",
    model: "Ariya",
    batteryCapacity: 87,
    range: 520,
    consumption: 18.1,
    image: "🚙"
  },

  // Ford
  {
    id: "ford-mustangmache",
    brand: "Ford",
    model: "Mustang Mach-E",
    batteryCapacity: 98.8,
    range: 610,
    consumption: 17.7,
    image: "🚙"
  },

  // Polestar
  {
    id: "polestar-2",
    brand: "Polestar",
    model: "2",
    batteryCapacity: 78,
    range: 540,
    consumption: 16.3,
    image: "🚗"
  },
  {
    id: "polestar-3",
    brand: "Polestar",
    model: "3",
    batteryCapacity: 111,
    range: 628,
    consumption: 19.4,
    image: "🚙"
  },

  // Volvo
  {
    id: "volvo-xc40",
    brand: "Volvo",
    model: "XC40 Recharge",
    batteryCapacity: 78,
    range: 418,
    consumption: 20.0,
    image: "🚙"
  },

  // Porsche
  {
    id: "porsche-taycan",
    brand: "Porsche",
    model: "Taycan",
    batteryCapacity: 93.4,
    range: 504,
    consumption: 20.8,
    image: "🚗"
  }
];

interface CarSelectorProps {
  selectedCar: CarModel | null;
  onCarSelect: (car: CarModel) => void;
}

export default function CarSelector({ selectedCar, onCarSelect }: CarSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Group cars by brand
  const carsByBrand = carModels.reduce((acc, car) => {
    if (!acc[car.brand]) {
      acc[car.brand] = [];
    }
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarModel[]>);

  // Get unique brands with their representative images
  const brands = Object.keys(carsByBrand).map(brand => ({
    name: brand,
    count: carsByBrand[brand].length,
    image: carsByBrand[brand][0].image // Use first car's image as brand representative
  }));

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrand(brandName);
  };

  const handleBackToBrands = () => {
    setSelectedBrand(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">
          {selectedBrand ? `${selectedBrand} modeller` : 'Velg bilmerke'}
        </h3>
        {selectedBrand && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToBrands}
            className="ml-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        )}
      </div>

      {!selectedBrand ? (
        /* Brand selection */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <Card
              key={brand.name}
              className="p-4 cursor-pointer transition-all duration-200 bg-card/80 backdrop-blur-sm border-border hover:bg-primary/5 hover:border-primary/30 hover:shadow-md"
              onClick={() => handleBrandSelect(brand.name)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="text-3xl">{brand.image}</span>
                
                <div className="space-y-1">
                  <h5 className="font-semibold text-sm text-foreground">
                    {brand.name}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {brand.count} modell{brand.count !== 1 ? 'er' : ''}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Model selection for selected brand */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {carsByBrand[selectedBrand].map((car) => (
            <Card
              key={car.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedCar?.id === car.id 
                  ? 'ring-2 ring-primary bg-primary/10 border-primary/40 shadow-lg' 
                  : 'bg-card/80 backdrop-blur-sm border-border hover:bg-primary/5 hover:border-primary/30 hover:shadow-md'
              }`}
              onClick={() => onCarSelect(car)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="text-3xl">{car.image}</span>
                
                <div className="space-y-1">
                  <h5 className="font-semibold text-sm text-foreground">
                    {car.model}
                  </h5>
                </div>
                
                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground w-full">
                  <div className="flex items-center justify-center gap-1">
                    <Battery className="h-3 w-3" />
                    <span>{car.batteryCapacity} kWh</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{car.range} km</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Car className="h-3 w-3" />
                    <span>{car.consumption} kWh/100km</span>
                  </div>
                </div>

                {selectedCar?.id === car.id && (
                  <Badge variant="default" className="text-xs animate-pulse-neon">Valgt</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected car info */}
      {selectedCar && (
        <Card className="p-4 bg-primary/10 border-primary/30 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedCar.image}</span>
            <div>
              <h4 className="font-semibold text-foreground">
                {selectedCar.brand} {selectedCar.model}
              </h4>
              <p className="text-sm text-muted-foreground">
                {selectedCar.batteryCapacity} kWh • {selectedCar.range} km rekkevidde • {selectedCar.consumption} kWh/100km
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export { type CarModel };