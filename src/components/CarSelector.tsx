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
    id: "vw-id5",
    brand: "Volkswagen",
    model: "ID.5",
    batteryCapacity: 77,
    range: 515,
    consumption: 16.8,
    image: "🚙"
  },
  {
    id: "vw-id7",
    brand: "Volkswagen",
    model: "ID.7",
    batteryCapacity: 86,
    range: 621,
    consumption: 15.6,
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

  // BMW
  {
    id: "bmw-i3",
    brand: "BMW",
    model: "i3",
    batteryCapacity: 42,
    range: 285,
    consumption: 15.3,
    image: "🚗"
  },
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
  {
    id: "bmw-ix3",
    brand: "BMW",
    model: "iX3",
    batteryCapacity: 80,
    range: 460,
    consumption: 18.5,
    image: "🚙"
  },
  {
    id: "bmw-i7",
    brand: "BMW",
    model: "i7",
    batteryCapacity: 101.7,
    range: 625,
    consumption: 18.4,
    image: "🚗"
  },

  // Audi
  {
    id: "audi-etron",
    brand: "Audi",
    model: "e-tron",
    batteryCapacity: 95,
    range: 436,
    consumption: 24.6,
    image: "🚙"
  },
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
  {
    id: "audi-q8etron",
    brand: "Audi",
    model: "Q8 e-tron",
    batteryCapacity: 114,
    range: 582,
    consumption: 22.6,
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
    id: "mercedes-eqe",
    brand: "Mercedes-Benz",
    model: "EQE",
    batteryCapacity: 90.6,
    range: 660,
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
  {
    id: "mercedes-eqa",
    brand: "Mercedes-Benz",
    model: "EQA",
    batteryCapacity: 66.5,
    range: 426,
    consumption: 17.2,
    image: "🚙"
  },
  {
    id: "mercedes-eqb",
    brand: "Mercedes-Benz",
    model: "EQB",
    batteryCapacity: 66.5,
    range: 419,
    consumption: 17.6,
    image: "🚙"
  },
  {
    id: "mercedes-eqv",
    brand: "Mercedes-Benz",
    model: "EQV",
    batteryCapacity: 90,
    range: 363,
    consumption: 26.4,
    image: "🚐"
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
  {
    id: "hyundai-kona",
    brand: "Hyundai",
    model: "Kona Electric",
    batteryCapacity: 64,
    range: 484,
    consumption: 14.7,
    image: "🚙"
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
    id: "kia-niroev",
    brand: "Kia",
    model: "Niro EV",
    batteryCapacity: 64.8,
    range: 463,
    consumption: 16.2,
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
  {
    id: "ford-f150lightning",
    brand: "Ford",
    model: "F-150 Lightning",
    batteryCapacity: 131,
    range: 515,
    consumption: 25.4,
    image: "🚚"
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
  {
    id: "polestar-4",
    brand: "Polestar",
    model: "4",
    batteryCapacity: 102,
    range: 611,
    consumption: 18.1,
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
  {
    id: "volvo-c40",
    brand: "Volvo",
    model: "C40 Recharge",
    batteryCapacity: 78,
    range: 434,
    consumption: 19.3,
    image: "🚙"
  },
  {
    id: "volvo-ex90",
    brand: "Volvo",
    model: "EX90",
    batteryCapacity: 111,
    range: 600,
    consumption: 20.8,
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
  },
  {
    id: "porsche-macan",
    brand: "Porsche",
    model: "Macan Electric",
    batteryCapacity: 100,
    range: 613,
    consumption: 17.9,
    image: "🚙"
  },

  // Genesis
  {
    id: "genesis-gv60",
    brand: "Genesis",
    model: "GV60",
    batteryCapacity: 77.4,
    range: 466,
    consumption: 18.4,
    image: "🚙"
  },
  {
    id: "genesis-electrified-g80",
    brand: "Genesis",
    model: "Electrified G80",
    batteryCapacity: 87.2,
    range: 520,
    consumption: 18.0,
    image: "🚗"
  },

  // Lucid
  {
    id: "lucid-air",
    brand: "Lucid",
    model: "Air Dream Edition",
    batteryCapacity: 118,
    range: 830,
    consumption: 15.0,
    image: "🚗"
  },

  // Rivian
  {
    id: "rivian-r1t",
    brand: "Rivian",
    model: "R1T",
    batteryCapacity: 135,
    range: 505,
    consumption: 28.0,
    image: "🚚"
  },
  {
    id: "rivian-r1s",
    brand: "Rivian",
    model: "R1S",
    batteryCapacity: 135,
    range: 516,
    consumption: 27.5,
    image: "🚙"
  },

  // BYD
  {
    id: "byd-atto3",
    brand: "BYD",
    model: "Atto 3",
    batteryCapacity: 60.48,
    range: 420,
    consumption: 15.9,
    image: "🚙"
  },
  {
    id: "byd-tang",
    brand: "BYD",
    model: "Tang",
    batteryCapacity: 86.4,
    range: 505,
    consumption: 18.5,
    image: "🚙"
  },

  // Škoda
  {
    id: "skoda-enyaq",
    brand: "Škoda",
    model: "Enyaq iV",
    batteryCapacity: 82,
    range: 534,
    consumption: 16.7,
    image: "🚙"
  },

  // SEAT/Cupra
  {
    id: "cupra-born",
    brand: "Cupra",
    model: "Born",
    batteryCapacity: 77,
    range: 548,
    consumption: 15.4,
    image: "🚗"
  },
  {
    id: "cupra-tavascan",
    brand: "Cupra",
    model: "Tavascan",
    batteryCapacity: 77,
    range: 516,
    consumption: 16.8,
    image: "🚙"
  },

  // Jaguar
  {
    id: "jaguar-ipace",
    brand: "Jaguar",
    model: "I-PACE",
    batteryCapacity: 90,
    range: 470,
    consumption: 20.9,
    image: "🚙"
  },

  // Fisker
  {
    id: "fisker-ocean",
    brand: "Fisker",
    model: "Ocean",
    batteryCapacity: 106,
    range: 630,
    consumption: 18.2,
    image: "🚙"
  },

  // MG
  {
    id: "mg-4",
    brand: "MG",
    model: "4 Electric",
    batteryCapacity: 64,
    range: 450,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "mg-zs",
    brand: "MG",
    model: "ZS EV",
    batteryCapacity: 51,
    range: 320,
    consumption: 17.3,
    image: "🚙"
  },
  {
    id: "mg-marvel-r",
    brand: "MG",
    model: "Marvel R",
    batteryCapacity: 70,
    range: 402,
    consumption: 18.5,
    image: "🚙"
  },

  // Mazda
  {
    id: "mazda-mx30",
    brand: "Mazda",
    model: "MX-30",
    batteryCapacity: 35.5,
    range: 200,
    consumption: 19.0,
    image: "🚙"
  },

  // Citroën
  {
    id: "citroen-ec4",
    brand: "Citroën",
    model: "ë-C4",
    batteryCapacity: 54,
    range: 350,
    consumption: 16.3,
    image: "🚗"
  },
  {
    id: "citroen-berlingo",
    brand: "Citroën",
    model: "ë-Berlingo",
    batteryCapacity: 50,
    range: 280,
    consumption: 19.1,
    image: "🚐"
  },

  // Peugeot
  {
    id: "peugeot-e208",
    brand: "Peugeot",
    model: "e-208",
    batteryCapacity: 50,
    range: 362,
    consumption: 15.9,
    image: "🚗"
  },
  {
    id: "peugeot-e2008",
    brand: "Peugeot",
    model: "e-2008",
    batteryCapacity: 54,
    range: 345,
    consumption: 17.0,
    image: "🚙"
  },
  {
    id: "peugeot-e3008",
    brand: "Peugeot",
    model: "e-3008",
    batteryCapacity: 73,
    range: 525,
    consumption: 15.6,
    image: "🚙"
  },

  // Opel
  {
    id: "opel-corsa-e",
    brand: "Opel",
    model: "Corsa-e",
    batteryCapacity: 50,
    range: 359,
    consumption: 16.0,
    image: "🚗"
  },
  {
    id: "opel-mokka-e",
    brand: "Opel",
    model: "Mokka-e",
    batteryCapacity: 54,
    range: 338,
    consumption: 17.2,
    image: "🚙"
  },

  // Renault
  {
    id: "renault-zoe",
    brand: "Renault",
    model: "ZOE",
    batteryCapacity: 52,
    range: 395,
    consumption: 14.8,
    image: "🚗"
  },
  {
    id: "renault-megane-e-tech",
    brand: "Renault",
    model: "Megane E-TECH",
    batteryCapacity: 60,
    range: 450,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "renault-scenic-e-tech",
    brand: "Renault",
    model: "Scenic E-TECH",
    batteryCapacity: 87,
    range: 625,
    consumption: 15.8,
    image: "🚙"
  },

  // Dacia
  {
    id: "dacia-spring",
    brand: "Dacia",
    model: "Spring",
    batteryCapacity: 26.8,
    range: 230,
    consumption: 13.9,
    image: "🚗"
  },

  // Fiat
  {
    id: "fiat-500e",
    brand: "Fiat",
    model: "500e",
    batteryCapacity: 42,
    range: 320,
    consumption: 14.9,
    image: "🚗"
  },

  // MINI
  {
    id: "mini-cooper-se",
    brand: "MINI",
    model: "Cooper SE",
    batteryCapacity: 32.6,
    range: 234,
    consumption: 15.2,
    image: "🚗"
  },
  {
    id: "mini-countryman-se",
    brand: "MINI",
    model: "Countryman SE",
    batteryCapacity: 66.45,
    range: 462,
    consumption: 16.0,
    image: "🚙"
  },

  // DS
  {
    id: "ds-3-crossback",
    brand: "DS",
    model: "3 Crossback E-Tense",
    batteryCapacity: 50,
    range: 320,
    consumption: 16.7,
    image: "🚙"
  },

  // Smart
  {
    id: "smart-eq-fortwo",
    brand: "Smart",
    model: "EQfortwo",
    batteryCapacity: 17.6,
    range: 159,
    consumption: 13.1,
    image: "🚗"
  },
  {
    id: "smart-1",
    brand: "Smart",
    model: "#1",
    batteryCapacity: 66,
    range: 440,
    consumption: 16.7,
    image: "🚙"
  },

  // Xpeng
  {
    id: "xpeng-p7",
    brand: "XPeng",
    model: "P7",
    batteryCapacity: 80.9,
    range: 706,
    consumption: 13.8,
    image: "🚗"
  },
  {
    id: "xpeng-g9",
    brand: "XPeng",
    model: "G9",
    batteryCapacity: 98,
    range: 570,
    consumption: 18.3,
    image: "🚙"
  },

  // NIO
  {
    id: "nio-et7",
    brand: "NIO",
    model: "ET7",
    batteryCapacity: 100,
    range: 580,
    consumption: 17.2,
    image: "🚗"
  },
  {
    id: "nio-es8",
    brand: "NIO",
    model: "ES8",
    batteryCapacity: 100,
    range: 500,
    consumption: 21.4,
    image: "🚙"
  },

  // Aiways
  {
    id: "aiways-u5",
    brand: "Aiways",
    model: "U5",
    batteryCapacity: 63,
    range: 410,
    consumption: 16.7,
    image: "🚙"
  },

  // ORA
  {
    id: "ora-funky-cat",
    brand: "ORA",
    model: "Funky Cat",
    batteryCapacity: 63,
    range: 420,
    consumption: 16.0,
    image: "🚗"
  },

  // Alpine
  {
    id: "alpine-a290",
    brand: "Alpine",
    model: "A290",
    batteryCapacity: 52,
    range: 380,
    consumption: 15.4,
    image: "🚗"
  },

  // Lexus
  {
    id: "lexus-ux300e",
    brand: "Lexus",
    model: "UX 300e",
    batteryCapacity: 72.8,
    range: 450,
    consumption: 17.1,
    image: "🚙"
  },

  // Toyota
  {
    id: "toyota-bz4x",
    brand: "Toyota",
    model: "bZ4X",
    batteryCapacity: 71.4,
    range: 516,
    consumption: 14.4,
    image: "🚙"
  },

  // Subaru
  {
    id: "subaru-solterra",
    brand: "Subaru",
    model: "Solterra",
    batteryCapacity: 71.4,
    range: 466,
    consumption: 16.9,
    image: "🚙"
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
                    {brand === 'Audi' && '🔴'}
                    {brand === 'Mercedes-Benz' && '⭐'}
                    {brand === 'Kia' && '🟢'}
                    {brand === 'Nissan' && '🔶'}
                    {brand === 'Ford' && '🔺'}
                    {brand === 'Polestar' && '⚪'}
                    {brand === 'Volvo' && '🔹'}
                    {brand === 'Porsche' && '🟡'}
                    {brand === 'Genesis' && '🌟'}
                    {brand === 'Lucid' && '💎'}
                    {brand === 'Rivian' && '🟦'}
                    {brand === 'BYD' && '🔻'}
                    {brand === 'Škoda' && '🟩'}
                    {brand === 'Cupra' && '🔥'}
                    {brand === 'Jaguar' && '🐆'}
                    {brand === 'Fisker' && '🌊'}
                    {brand === 'MG' && '🎯'}
                    {brand === 'Mazda' && '🔴'}
                    {brand === 'Citroën' && '🔵'}
                    {brand === 'Peugeot' && '🦁'}
                    {brand === 'Opel' && '⚡'}
                    {brand === 'Renault' && '💎'}
                    {brand === 'Dacia' && '🔶'}
                    {brand === 'Fiat' && '🇮🇹'}
                    {brand === 'MINI' && '🎯'}
                    {brand === 'DS' && '💫'}
                    {brand === 'Smart' && '🤖'}
                    {brand === 'XPeng' && '🚀'}
                    {brand === 'NIO' && '🌐'}
                    {brand === 'Aiways' && '🌊'}
                    {brand === 'ORA' && '😸'}
                    {brand === 'Alpine' && '🏔️'}
                    {brand === 'Lexus' && '⭐'}
                    {brand === 'Toyota' && '🔺'}
                    {brand === 'Subaru' && '⭐'}
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