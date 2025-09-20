import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Car, Battery, ArrowLeft, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCarModels, type CarModel } from "@/hooks/useCarModels";

// CarModel importeres nå fra useCarModels hook

// Bilmodeller lastes nå fra database

interface CarSelectorProps {
  selectedCar: CarModel | null;
  onCarSelect: (car: CarModel) => void;
}

export default function CarSelector({ selectedCar, onCarSelect }: CarSelectorProps) {
  const { user, favoriteCar, saveFavoriteCar, removeFavoriteCar } = useAuth();
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showBrands, setShowBrands] = useState<boolean>(false);
  const { carModels, loading } = useCarModels();

  // Group cars by brand
  const carsByBrand = carModels.reduce((acc, car) => {
    if (!acc[car.brand]) {
      acc[car.brand] = [];
    }
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarModel[]>);

  // Get unique brands with their representative images, sorted alphabetically
  const brands = Object.keys(carsByBrand)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) // Sort brands alphabetically, case-insensitive
    .map(brand => ({
      name: brand,
      count: carsByBrand[brand].length,
      image: carsByBrand[brand][0].image // Use first car's image as brand representative
    }));

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrand(brandName);
    // Scroll til toppen av siden når merke er valgt - prøv flere metoder
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
  };

  const handleBackToBrands = () => {
    setSelectedBrand(null);
  };

  const handleShowBrands = () => {
    setShowBrands(true); // Vis bilmerker når brukeren trykker
  };

  const handleDeselectCar = () => {
    onCarSelect(null as any); // Deselect the car
    setSelectedBrand(null); // Reset brand selection
    setShowBrands(false); // Skjul bilmerker igjen
  };

  const handleSelectDifferentCar = () => {
    setShowBrands(true); // Show brands to select a different car
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">
          {selectedBrand ? `${selectedBrand} modeller` : 'Velg bilmerke'}
        </h3>
        {selectedBrand && showBrands && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToBrands}
            className="ml-auto glass-card hover:neon-glow transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        )}
      </div>

      {!showBrands && !selectedCar ? (
        /* Vis bare knappen for å velge bilmerke */
        <Card className="p-6 glass-card cyber-glow text-center">
          <Car className="h-16 w-16 mx-auto mb-4 text-primary animate-glow-pulse" />
          <h4 className="text-xl font-orbitron font-bold text-gradient mb-2">Ingen bil valgt</h4>
          <p className="text-muted-foreground mb-4">
            {loading ? (
              "Laster bilmodeller..."
            ) : (
              `Velg blant over ${carModels.length} el-bil modeller fra ${brands.length} forskjellige merker`
            )}
          </p>
          <Button 
            onClick={handleShowBrands}
            className="bg-gradient-electric text-primary-foreground hover:shadow-neon transition-all duration-300 font-orbitron font-bold"
          >
            Se tilgjengelige biler
          </Button>
        </Card>
      ) : selectedCar ? (
        /* Show only the selected car */
        <Card className="p-4 glass-card neon-glow border-primary/30 shadow-lg">
          <div className="flex items-center space-x-4">
            <span className="text-2xl">{selectedCar.image}</span>
            
            <div className="flex-1">
              <h4 className="text-lg font-orbitron font-bold text-gradient">
                {selectedCar.brand} {selectedCar.model}
              </h4>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  <span className="font-orbitron">{selectedCar.batteryCapacity} kWh</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="font-orbitron">{selectedCar.range} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  <span className="font-orbitron">{selectedCar.consumption} kWh/100km</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs animate-pulse-neon font-orbitron">Valgt</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectDifferentCar}
                className="h-8 px-3 text-xs font-orbitron glass-card hover:neon-glow"
              >
                Bytt bil
              </Button>
            </div>
          </div>
        </Card>
      ) : !selectedBrand ? (
        /* Brand selection - vertical list */
        <div className="space-y-2">
          {brands.map((brand) => (
            <Card
              key={brand.name}
              className="p-4 cursor-pointer transition-all duration-300 glass-card border-border hover:cyber-glow hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center space-x-4" onClick={() => handleBrandSelect(brand.name)}>
                <span className="text-2xl">{brand.image}</span>
                
                <div className="flex-1">
                  <h5 className="text-lg font-orbitron font-bold text-gradient">
                    {brand.name}
                  </h5>
                  <p className="text-sm font-orbitron text-muted-foreground">
                    {brand.count} modell{brand.count !== 1 ? 'er' : ''}
                  </p>
                </div>
                
                <ArrowLeft className="h-5 w-5 text-primary animate-glow-pulse rotate-180" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Model selection for selected brand - vertical list */
        <div className="space-y-3">
          {carsByBrand[selectedBrand].map((car, index) => (
            <Card
              key={car.id}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                selectedCar?.id === car.id 
                  ? 'ring-2 ring-primary glass-card bg-primary/15 border-primary/80' 
                  : 'glass-card border-border hover:border-primary/20 hover:shadow-[0_0_8px_rgba(0,255,136,0.05)]'
              }`}
              style={selectedCar?.id === car.id ? {
                boxShadow: '0 0 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)'
              } : {}}
              onClick={() => {
                onCarSelect(car);
                // Scroll til toppen av siden når bil er valgt
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{car.image}</span>
                
                <div className="flex-1">
                  <h5 className="text-lg font-orbitron font-bold text-gradient">
                    {car.model}
                  </h5>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3" />
                      <span className="font-orbitron">{car.batteryCapacity} kWh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className="font-orbitron">{car.range} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      <span className="font-orbitron">{car.consumption} kWh/100km</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCar?.id === car.id && (
                    <Badge variant="default" className="text-xs animate-pulse-neon font-orbitron">Valgt</Badge>
                  )}
                  
                  {user && (
                    <Button
                      variant={favoriteCar?.car_id === car.id ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3 text-xs font-orbitron"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (favoriteCar?.car_id === car.id) {
                          removeFavoriteCar();
                          toast({
                            title: "Favoritt fjernet",
                            description: "Bilen er ikke lenger din favoritt",
                          });
                        } else {
                          saveFavoriteCar(car);
                          toast({
                            title: "Favoritt lagret",
                            description: `${car.brand} ${car.model} er nå din favorittbil`,
                          });
                        }
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {favoriteCar?.car_id === car.id ? "Favoritt" : "Lag favoritt"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// CarModel type nå eksportert fra useCarModels hook