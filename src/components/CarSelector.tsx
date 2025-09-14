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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCars = carModels.filter(car => 
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCarSelect = (car: CarModel) => {
    onCarSelect(car);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Velg elbil</h3>
      </div>

      {/* Dropdown selector */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-14 px-4 bg-background/50 border-2 border-primary/20 hover:border-primary/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            {selectedCar ? (
              <>
                <span className="text-2xl">{selectedCar.image}</span>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {selectedCar.brand} {selectedCar.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCar.batteryCapacity} kWh • {selectedCar.range} km rekkevidde
                  </p>
                </div>
              </>
            ) : (
              <>
                <Car className="h-6 w-6 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">Alle elbiler</p>
                  <p className="text-sm text-muted-foreground">Klikk for å velge bilmodell</p>
                </div>
              </>
            )}
          </div>
          {isOpen ? 
            <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </Button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background/95 border-2 border-primary/20 rounded-lg shadow-xl backdrop-blur-md">
            {/* Search */}
            <div className="p-3 border-b border-primary/10">
              <input
                type="text"
                placeholder="Søk etter bilmerke eller modell..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-primary/20 rounded-md focus:outline-none focus:border-primary/40 text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Car list */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCars.length > 0 ? (
                <div className="space-y-1">
                  {filteredCars.map((car) => (
                    <Card
                      key={car.id}
                      className={`p-3 cursor-pointer transition-all duration-200 ${
                        selectedCar?.id === car.id 
                          ? 'ring-2 ring-primary bg-primary/10 border-primary/40' 
                          : 'bg-background/80 border-primary/10 hover:bg-primary/5 hover:border-primary/30'
                      }`}
                      onClick={() => handleCarSelect(car)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{car.image}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-semibold text-sm text-foreground">
                              {car.brand} {car.model}
                            </h5>
                            {selectedCar?.id === car.id && (
                              <Badge variant="default" className="text-xs">Valgt</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Battery className="h-3 w-3" />
                              <span>{car.batteryCapacity} kWh</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>{car.range} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              <span>{car.consumption} kWh/100km</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ingen biler funnet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Valgt bil info */}
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