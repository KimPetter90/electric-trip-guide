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
  // Aiways
  {
    id: "aiways-u5",
    brand: "Aiways",
    model: "U5",
    batteryCapacity: 63,
    range: 410,
    consumption: 17.0,
    image: "🚙"
  },

  // Alpine
  {
    id: "alpine-a290",
    brand: "Alpine",
    model: "A290",
    batteryCapacity: 52,
    range: 380,
    consumption: 15.8,
    image: "🚗"
  },

  // Audi (sortert alfabetisk)
  {
    id: "audi-etron",
    brand: "Audi",
    model: "e-tron",
    batteryCapacity: 95,
    range: 441,
    consumption: 24.3,
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
    id: "audi-etron-sportback",
    brand: "Audi",
    model: "e-tron Sportback",
    batteryCapacity: 95,
    range: 446,
    consumption: 23.7,
    image: "🚙"
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
    id: "audi-q4etron-sportback",
    brand: "Audi",
    model: "Q4 e-tron Sportback",
    batteryCapacity: 82,
    range: 534,
    consumption: 16.6,
    image: "🚙"
  },
  {
    id: "audi-q6-etron",
    brand: "Audi",
    model: "Q6 e-tron",
    batteryCapacity: 100,
    range: 625,
    consumption: 17.5,
    image: "🚙"
  },
  {
    id: "audi-q8-etron",
    brand: "Audi",
    model: "Q8 e-tron",
    batteryCapacity: 114,
    range: 582,
    consumption: 21.8,
    image: "🚙"
  },
  {
    id: "audi-rs-etron-gt",
    brand: "Audi",
    model: "RS e-tron GT",
    batteryCapacity: 93.4,
    range: 472,
    consumption: 20.2,
    image: "🚗"
  },

  // BMW (sortert alfabetisk)
  {
    id: "bmw-i3",
    brand: "BMW",
    model: "i3",
    batteryCapacity: 42.2,
    range: 285,
    consumption: 16.3,
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
    id: "bmw-i5",
    brand: "BMW",
    model: "i5",
    batteryCapacity: 84.3,
    range: 582,
    consumption: 16.9,
    image: "🚗"
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
    id: "bmw-ix1",
    brand: "BMW",
    model: "iX1",
    batteryCapacity: 64.7,
    range: 438,
    consumption: 17.3,
    image: "🚙"
  },
  {
    id: "bmw-ix2",
    brand: "BMW",
    model: "iX2",
    batteryCapacity: 64.8,
    range: 449,
    consumption: 16.3,
    image: "🚙"
  },
  {
    id: "bmw-ix3",
    brand: "BMW",
    model: "iX3",
    batteryCapacity: 80,
    range: 460,
    consumption: 19.0,
    image: "🚙"
  },

  // BYD (sortert alfabetisk)
  {
    id: "byd-atto3",
    brand: "BYD",
    model: "Atto 3",
    batteryCapacity: 60.48,
    range: 420,
    consumption: 16.3,
    image: "🚙"
  },
  {
    id: "byd-dolphin",
    brand: "BYD",
    model: "Dolphin",
    batteryCapacity: 60.48,
    range: 427,
    consumption: 15.9,
    image: "🚗"
  },
  {
    id: "byd-han",
    brand: "BYD",
    model: "Han EV",
    batteryCapacity: 85.4,
    range: 521,
    consumption: 17.9,
    image: "🚗"
  },
  {
    id: "byd-seal",
    brand: "BYD",
    model: "Seal",
    batteryCapacity: 82.5,
    range: 570,
    consumption: 16.1,
    image: "🚗"
  },
  {
    id: "byd-seal-u",
    brand: "BYD",
    model: "Seal U",
    batteryCapacity: 87,
    range: 500,
    consumption: 18.2,
    image: "🚙"
  },
  {
    id: "byd-tang",
    brand: "BYD",
    model: "Tang EV",
    batteryCapacity: 86.4,
    range: 505,
    consumption: 19.1,
    image: "🚙"
  },

  // Cadillac
  {
    id: "cadillac-lyriq",
    brand: "Cadillac",
    model: "LYRIQ",
    batteryCapacity: 102,
    range: 502,
    consumption: 22.3,
    image: "🚙"
  },

  // Chevrolet
  {
    id: "chevrolet-bolt-ev",
    brand: "Chevrolet",
    model: "Bolt EV",
    batteryCapacity: 65,
    range: 417,
    consumption: 17.0,
    image: "🚗"
  },
  {
    id: "chevrolet-bolt-euv",
    brand: "Chevrolet",
    model: "Bolt EUV",
    batteryCapacity: 65,
    range: 397,
    consumption: 17.8,
    image: "🚙"
  },

  // Citroën
  {
    id: "citroen-berlingo-e",
    brand: "Citroën",
    model: "ë-Berlingo",
    batteryCapacity: 50,
    range: 280,
    consumption: 20.1,
    image: "🚐"
  },
  {
    id: "citroen-c4-e",
    brand: "Citroën",
    model: "ë-C4",
    batteryCapacity: 50,
    range: 350,
    consumption: 16.1,
    image: "🚗"
  },
  {
    id: "citroen-c5-aircross-e",
    brand: "Citroën",
    model: "ë-C5 Aircross",
    batteryCapacity: 73,
    range: 460,
    consumption: 17.8,
    image: "🚙"
  },
  {
    id: "citroen-spacetourer-e",
    brand: "Citroën",
    model: "ë-SpaceTourer",
    batteryCapacity: 75,
    range: 330,
    consumption: 25.4,
    image: "🚐"
  },

  // CUPRA
  {
    id: "cupra-born",
    brand: "CUPRA",
    model: "Born",
    batteryCapacity: 77,
    range: 548,
    consumption: 15.3,
    image: "🚗"
  },
  {
    id: "cupra-formentor-e",
    brand: "CUPRA",
    model: "Formentor e-Hybrid",
    batteryCapacity: 12.8,
    range: 55,
    consumption: 16.5,
    image: "🚙"
  },
  {
    id: "cupra-tavascan",
    brand: "CUPRA",
    model: "Tavascan",
    batteryCapacity: 77,
    range: 516,
    consumption: 16.2,
    image: "🚙"
  },

  // Dacia
  {
    id: "dacia-spring",
    brand: "Dacia",
    model: "Spring Electric",
    batteryCapacity: 27.4,
    range: 230,
    consumption: 13.9,
    image: "🚗"
  },

  // DS
  {
    id: "ds-3-crossback-e",
    brand: "DS",
    model: "3 Crossback E-Tense",
    batteryCapacity: 50,
    range: 320,
    consumption: 17.7,
    image: "🚙"
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
  {
    id: "fiat-600e",
    brand: "Fiat",
    model: "600e",
    batteryCapacity: 54.8,
    range: 409,
    consumption: 15.2,
    image: "🚙"
  },

  // Fisker
  {
    id: "fisker-ocean",
    brand: "Fisker",
    model: "Ocean",
    batteryCapacity: 106,
    range: 707,
    consumption: 16.8,
    image: "🚙"
  },

  // Ford
  {
    id: "ford-etransit",
    brand: "Ford",
    model: "E-Transit",
    batteryCapacity: 68,
    range: 317,
    consumption: 27.5,
    image: "🚐"
  },
  {
    id: "ford-explorer",
    brand: "Ford",
    model: "Explorer Electric",
    batteryCapacity: 79,
    range: 602,
    consumption: 14.4,
    image: "🚙"
  },
  {
    id: "ford-mustangmache",
    brand: "Ford",
    model: "Mustang Mach-E",
    batteryCapacity: 98.8,
    range: 610,
    consumption: 17.7,
    image: "🚙"
  },

  // Genesis
  {
    id: "genesis-g80-electrified",
    brand: "Genesis",
    model: "G80 Electrified",
    batteryCapacity: 87.2,
    range: 520,
    consumption: 18.7,
    image: "🚗"
  },
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
    id: "genesis-gv70-electrified",
    brand: "Genesis",
    model: "GV70 Electrified",
    batteryCapacity: 77.4,
    range: 455,
    consumption: 19.1,
    image: "🚙"
  },

  // GMC
  {
    id: "gmc-hummer-ev",
    brand: "GMC",
    model: "Hummer EV",
    batteryCapacity: 212,
    range: 516,
    consumption: 47.0,
    image: "🚚"
  },

  // Honda
  {
    id: "honda-e",
    brand: "Honda",
    model: "e",
    batteryCapacity: 35.5,
    range: 220,
    consumption: 17.2,
    image: "🚗"
  },

  // Hyundai
  {
    id: "hyundai-ioniq",
    brand: "Hyundai",
    model: "IONIQ Electric",
    batteryCapacity: 38.3,
    range: 311,
    consumption: 13.8,
    image: "🚗"
  },
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

  // Jaguar
  {
    id: "jaguar-ipace",
    brand: "Jaguar",
    model: "I-PACE",
    batteryCapacity: 90,
    range: 470,
    consumption: 22.0,
    image: "🚙"
  },

  // Jeep
  {
    id: "jeep-avenger-e",
    brand: "Jeep",
    model: "Avenger Electric",
    batteryCapacity: 54,
    range: 400,
    consumption: 15.5,
    image: "🚙"
  },

  // Kia
  {
    id: "kia-eniro",
    brand: "Kia",
    model: "e-Niro",
    batteryCapacity: 64,
    range: 460,
    consumption: 15.9,
    image: "🚙"
  },
  {
    id: "kia-esoul",
    brand: "Kia",
    model: "e-Soul",
    batteryCapacity: 64,
    range: 452,
    consumption: 15.7,
    image: "🚙"
  },
  {
    id: "kia-ev3",
    brand: "Kia",
    model: "EV3",
    batteryCapacity: 81.4,
    range: 605,
    consumption: 15.2,
    image: "🚙"
  },
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

  // Land Rover
  {
    id: "landrover-range-rover-velar",
    brand: "Land Rover",
    model: "Range Rover Velar Electric",
    batteryCapacity: 91,
    range: 490,
    consumption: 21.2,
    image: "🚙"
  },

  // Lexus
  {
    id: "lexus-ux300e",
    brand: "Lexus",
    model: "UX 300e",
    batteryCapacity: 72.8,
    range: 450,
    consumption: 17.8,
    image: "🚙"
  },

  // Li Auto
  {
    id: "li-auto-one",
    brand: "Li Auto",
    model: "ONE",
    batteryCapacity: 40.5,
    range: 180,
    consumption: 25.8,
    image: "🚙"
  },

  // Lucid
  {
    id: "lucid-air",
    brand: "Lucid",
    model: "Air Dream Edition",
    batteryCapacity: 118,
    range: 837,
    consumption: 15.7,
    image: "🚗"
  },

  // Lynk & Co
  {
    id: "lynk-co-01",
    brand: "Lynk & Co",
    model: "01",
    batteryCapacity: 78,
    range: 485,
    consumption: 17.8,
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

  // Mercedes-Benz
  {
    id: "mercedes-eqa",
    brand: "Mercedes-Benz",
    model: "EQA",
    batteryCapacity: 66.5,
    range: 426,
    consumption: 17.7,
    image: "🚙"
  },
  {
    id: "mercedes-eqb",
    brand: "Mercedes-Benz",
    model: "EQB",
    batteryCapacity: 66.5,
    range: 423,
    consumption: 18.3,
    image: "🚙"
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
    id: "mercedes-eqe",
    brand: "Mercedes-Benz",
    model: "EQE",
    batteryCapacity: 90.6,
    range: 639,
    consumption: 16.2,
    image: "🚗"
  },
  {
    id: "mercedes-eqe-suv",
    brand: "Mercedes-Benz",
    model: "EQE SUV",
    batteryCapacity: 90.6,
    range: 590,
    consumption: 17.4,
    image: "🚙"
  },
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
    id: "mercedes-eqs-suv",
    brand: "Mercedes-Benz",
    model: "EQS SUV",
    batteryCapacity: 107.8,
    range: 660,
    consumption: 18.7,
    image: "🚙"
  },
  {
    id: "mercedes-eqv",
    brand: "Mercedes-Benz",
    model: "EQV",
    batteryCapacity: 90,
    range: 353,
    consumption: 27.0,
    image: "🚐"
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
    id: "mg-5",
    brand: "MG",
    model: "5 Electric",
    batteryCapacity: 61.1,
    range: 400,
    consumption: 16.8,
    image: "🚙"
  },
  {
    id: "mg-marvel-r",
    brand: "MG",
    model: "Marvel R Electric",
    batteryCapacity: 70,
    range: 402,
    consumption: 19.4,
    image: "🚙"
  },
  {
    id: "mg-zs",
    brand: "MG",
    model: "ZS EV",
    batteryCapacity: 72.6,
    range: 440,
    consumption: 18.2,
    image: "🚙"
  },

  // MINI
  {
    id: "mini-cooper-se",
    brand: "MINI",
    model: "Cooper SE",
    batteryCapacity: 32.6,
    range: 233,
    consumption: 15.2,
    image: "🚗"
  },
  {
    id: "mini-countryman-se",
    brand: "MINI",
    model: "Countryman SE",
    batteryCapacity: 66.45,
    range: 462,
    consumption: 16.2,
    image: "🚙"
  },

  // NIO
  {
    id: "nio-es8",
    brand: "NIO",
    model: "ES8",
    batteryCapacity: 100,
    range: 580,
    consumption: 19.4,
    image: "🚙"
  },
  {
    id: "nio-et7",
    brand: "NIO",
    model: "ET7",
    batteryCapacity: 100,
    range: 700,
    consumption: 15.9,
    image: "🚗"
  },

  // Nissan
  {
    id: "nissan-ariya",
    brand: "Nissan",
    model: "Ariya",
    batteryCapacity: 87,
    range: 520,
    consumption: 18.1,
    image: "🚙"
  },
  {
    id: "nissan-env200",
    brand: "Nissan",
    model: "e-NV200",
    batteryCapacity: 40,
    range: 200,
    consumption: 25.9,
    image: "🚐"
  },
  {
    id: "nissan-leaf",
    brand: "Nissan",
    model: "Leaf",
    batteryCapacity: 62,
    range: 385,
    consumption: 17.0,
    image: "🚗"
  },

  // Opel
  {
    id: "opel-astra-e",
    brand: "Opel",
    model: "Astra Electric",
    batteryCapacity: 54,
    range: 416,
    consumption: 14.8,
    image: "🚗"
  },
  {
    id: "opel-combo-e",
    brand: "Opel",
    model: "Combo-e",
    batteryCapacity: 50,
    range: 280,
    consumption: 20.1,
    image: "🚐"
  },
  {
    id: "opel-corsa-e",
    brand: "Opel",
    model: "Corsa-e",
    batteryCapacity: 50,
    range: 359,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "opel-mokka-e",
    brand: "Opel",
    model: "Mokka-e",
    batteryCapacity: 50,
    range: 338,
    consumption: 16.7,
    image: "🚙"
  },
  {
    id: "opel-vivaro-e",
    brand: "Opel",
    model: "Vivaro-e",
    batteryCapacity: 75,
    range: 330,
    consumption: 25.4,
    image: "🚐"
  },

  // Peugeot
  {
    id: "peugeot-e208",
    brand: "Peugeot",
    model: "e-208",
    batteryCapacity: 50,
    range: 362,
    consumption: 15.6,
    image: "🚗"
  },
  {
    id: "peugeot-e2008",
    brand: "Peugeot",
    model: "e-2008",
    batteryCapacity: 50,
    range: 320,
    consumption: 17.7,
    image: "🚙"
  },
  {
    id: "peugeot-e3008",
    brand: "Peugeot",
    model: "e-3008",
    batteryCapacity: 73,
    range: 525,
    consumption: 15.8,
    image: "🚙"
  },
  {
    id: "peugeot-expert-e",
    brand: "Peugeot",
    model: "e-Expert",
    batteryCapacity: 75,
    range: 330,
    consumption: 25.4,
    image: "🚐"
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
    consumption: 18.8,
    image: "🚙"
  },

  // Porsche
  {
    id: "porsche-macan-electric",
    brand: "Porsche",
    model: "Macan Electric",
    batteryCapacity: 100,
    range: 613,
    consumption: 18.8,
    image: "🚙"
  },
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
    id: "porsche-taycan-cross-turismo",
    brand: "Porsche",
    model: "Taycan Cross Turismo",
    batteryCapacity: 93.4,
    range: 456,
    consumption: 22.4,
    image: "🚙"
  },
  {
    id: "porsche-taycan-turbo",
    brand: "Porsche",
    model: "Taycan Turbo",
    batteryCapacity: 93.4,
    range: 507,
    consumption: 20.6,
    image: "🚗"
  },

  // Renault
  {
    id: "renault-kangoo-e-tech",
    brand: "Renault",
    model: "Kangoo E-Tech",
    batteryCapacity: 45,
    range: 285,
    consumption: 18.9,
    image: "🚐"
  },
  {
    id: "renault-megane-e-tech",
    brand: "Renault",
    model: "Mégane E-Tech",
    batteryCapacity: 60,
    range: 450,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "renault-scenic-e-tech",
    brand: "Renault",
    model: "Scenic E-Tech",
    batteryCapacity: 87,
    range: 625,
    consumption: 15.8,
    image: "🚙"
  },
  {
    id: "renault-twizy",
    brand: "Renault",
    model: "Twizy",
    batteryCapacity: 6.1,
    range: 100,
    consumption: 6.3,
    image: "🛺"
  },
  {
    id: "renault-zoe",
    brand: "Renault",
    model: "ZOE",
    batteryCapacity: 52,
    range: 395,
    consumption: 14.9,
    image: "🚗"
  },

  // Rivian
  {
    id: "rivian-r1s",
    brand: "Rivian",
    model: "R1S",
    batteryCapacity: 135,
    range: 516,
    consumption: 28.9,
    image: "🚙"
  },
  {
    id: "rivian-r1t",
    brand: "Rivian",
    model: "R1T",
    batteryCapacity: 135,
    range: 516,
    consumption: 28.9,
    image: "🚚"
  },

  // SEAT
  {
    id: "seat-born",
    brand: "SEAT",
    model: "Born",
    batteryCapacity: 58,
    range: 426,
    consumption: 15.4,
    image: "🚗"
  },
  {
    id: "seat-mii",
    brand: "SEAT",
    model: "Mii Electric",
    batteryCapacity: 36.8,
    range: 258,
    consumption: 16.9,
    image: "🚗"
  },

  // Skoda
  {
    id: "skoda-citigo",
    brand: "Skoda",
    model: "CITIGOe iV",
    batteryCapacity: 36.8,
    range: 258,
    consumption: 16.9,
    image: "🚗"
  },
  {
    id: "skoda-elroq",
    brand: "Skoda",
    model: "Elroq",
    batteryCapacity: 82,
    range: 560,
    consumption: 16.1,
    image: "🚙"
  },
  {
    id: "skoda-enyaq",
    brand: "Skoda",
    model: "Enyaq iV",
    batteryCapacity: 82,
    range: 534,
    consumption: 16.7,
    image: "🚙"
  },
  {
    id: "skoda-enyaq-coupe",
    brand: "Skoda",
    model: "Enyaq Coupé iV",
    batteryCapacity: 82,
    range: 545,
    consumption: 16.4,
    image: "🚙"
  },

  // Smart
  {
    id: "smart-eq-forfour",
    brand: "Smart",
    model: "EQforfour",
    batteryCapacity: 17.6,
    range: 153,
    consumption: 13.7,
    image: "🚗"
  },
  {
    id: "smart-eq-fortwo",
    brand: "Smart",
    model: "EQfortwo",
    batteryCapacity: 17.6,
    range: 159,
    consumption: 13.1,
    image: "🚗"
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
  },

  // Tesla
  {
    id: "tesla-cybertruck",
    brand: "Tesla",
    model: "Cybertruck",
    batteryCapacity: 123,
    range: 515,
    consumption: 23.9,
    image: "🚚"
  },
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

  // Toyota
  {
    id: "toyota-bzx4",
    brand: "Toyota",
    model: "bZ4X",
    batteryCapacity: 71.4,
    range: 516,
    consumption: 15.3,
    image: "🚙"
  },

  // Volkswagen
  {
    id: "vw-egolf",
    brand: "Volkswagen",
    model: "e-Golf",
    batteryCapacity: 35.8,
    range: 231,
    consumption: 17.2,
    image: "🚗"
  },
  {
    id: "vw-eup",
    brand: "Volkswagen",
    model: "e-up!",
    batteryCapacity: 36.8,
    range: 258,
    consumption: 16.9,
    image: "🚗"
  },
  {
    id: "vw-id-buzz",
    brand: "Volkswagen",
    model: "ID.Buzz",
    batteryCapacity: 82,
    range: 423,
    consumption: 21.4,
    image: "🚐"
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
    range: 520,
    consumption: 16.8,
    image: "🚙"
  },
  {
    id: "vw-id7",
    brand: "Volkswagen",
    model: "ID.7",
    batteryCapacity: 86,
    range: 615,
    consumption: 15.5,
    image: "🚗"
  },

  // Volvo
  {
    id: "volvo-c40",
    brand: "Volvo",
    model: "C40 Recharge",
    batteryCapacity: 78,
    range: 444,
    consumption: 19.3,
    image: "🚙"
  },
  {
    id: "volvo-ec40",
    brand: "Volvo",
    model: "EC40",
    batteryCapacity: 82,
    range: 530,
    consumption: 17.2,
    image: "🚙"
  },
  {
    id: "volvo-ex30",
    brand: "Volvo",
    model: "EX30",
    batteryCapacity: 69,
    range: 476,
    consumption: 16.2,
    image: "🚙"
  },
  {
    id: "volvo-ex90",
    brand: "Volvo",
    model: "EX90",
    batteryCapacity: 111,
    range: 614,
    consumption: 20.3,
    image: "🚙"
  },
  {
    id: "volvo-xc40",
    brand: "Volvo",
    model: "XC40 Recharge",
    batteryCapacity: 78,
    range: 418,
    consumption: 20.0,
    image: "🚙"
  },

  // XPeng
  {
    id: "xpeng-g9",
    brand: "XPeng",
    model: "G9",
    batteryCapacity: 98,
    range: 650,
    consumption: 16.8,
    image: "🚙"
  },
  {
    id: "xpeng-p7",
    brand: "XPeng",
    model: "P7",
    batteryCapacity: 80.9,
    range: 706,
    consumption: 13.2,
    image: "🚗"
  }
];

interface CarSelectorProps {
  selectedCar: CarModel | null;
  onCarSelect: (car: CarModel) => void;
}

export default function CarSelector({ selectedCar, onCarSelect }: CarSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showBrands, setShowBrands] = useState<boolean>(false); // Start med å ikke vise bilmerker

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
          <Button 
            onClick={handleShowBrands}
            className="bg-gradient-electric text-primary-foreground hover:shadow-neon transition-all duration-300 font-orbitron font-bold"
          >
            Se tilgjengelige biler
          </Button>
        </Card>
      ) : selectedCar ? (
        /* Show only the selected car */
        <Card 
          className="p-4 glass-card neon-glow border-primary/30 shadow-lg cursor-pointer hover:bg-primary/15 transition-all duration-300"
          onClick={handleDeselectCar}
        >
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

            <Badge variant="default" className="text-xs animate-pulse-neon font-orbitron">Valgt</Badge>
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
                  ? 'ring-2 ring-primary glass-card bg-primary/10 border-primary/60 shadow-[0_0_25px_rgba(0,255,136,0.3)] neon-glow animate-glow-pulse' 
                  : 'glass-card border-border hover:border-primary/20 hover:shadow-[0_0_8px_rgba(0,255,136,0.05)]'
              }`}
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

                {selectedCar?.id === car.id && (
                  <Badge variant="default" className="text-xs animate-pulse-neon font-orbitron">Valgt</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export { type CarModel };