import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    id: "audi-etron-gt",
    brand: "Audi",
    model: "e-tron GT",
    batteryCapacity: 93,
    range: 487,
    consumption: 21.6,
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
    id: "audi-q4-etron",
    brand: "Audi",
    model: "Q4 e-tron",
    batteryCapacity: 82,
    range: 520,
    consumption: 18.1,
    image: "🚙"
  },
  {
    id: "audi-q4-etron-sportback",
    brand: "Audi",
    model: "Q4 e-tron Sportback",
    batteryCapacity: 82,
    range: 534,
    consumption: 17.4,
    image: "🚙"
  },
  {
    id: "audi-q6-etron",
    brand: "Audi",
    model: "Q6 e-tron",
    batteryCapacity: 100,
    range: 641,
    consumption: 17.0,
    image: "🚙"
  },
  {
    id: "audi-q8-etron",
    brand: "Audi",
    model: "Q8 e-tron",
    batteryCapacity: 114,
    range: 582,
    consumption: 21.0,
    image: "🚙"
  },

  // BMW (sortert alfabetisk)
  {
    id: "bmw-i3",
    brand: "BMW",
    model: "i3",
    batteryCapacity: 42,
    range: 307,
    consumption: 15.3,
    image: "🚗"
  },
  {
    id: "bmw-i4",
    brand: "BMW",
    model: "i4",
    batteryCapacity: 84,
    range: 590,
    consumption: 16.1,
    image: "🚗"
  },
  {
    id: "bmw-i4-m50",
    brand: "BMW",
    model: "i4 M50",
    batteryCapacity: 84,
    range: 521,
    consumption: 18.0,
    image: "🚗"
  },
  {
    id: "bmw-i5",
    brand: "BMW",
    model: "i5",
    batteryCapacity: 84,
    range: 582,
    consumption: 16.9,
    image: "🚗"
  },
  {
    id: "bmw-i7",
    brand: "BMW",
    model: "i7",
    batteryCapacity: 106,
    range: 625,
    consumption: 18.4,
    image: "🚗"
  },
  {
    id: "bmw-i8",
    brand: "BMW",
    model: "i8",
    batteryCapacity: 12,
    range: 55,
    consumption: 21.8,
    image: "🚗"
  },
  {
    id: "bmw-ix",
    brand: "BMW",
    model: "iX",
    batteryCapacity: 111,
    range: 630,
    consumption: 19.4,
    image: "🚙"
  },
  {
    id: "bmw-ix1",
    brand: "BMW",
    model: "iX1",
    batteryCapacity: 66,
    range: 438,
    consumption: 17.3,
    image: "🚙"
  },
  {
    id: "bmw-ix2",
    brand: "BMW",
    model: "iX2",
    batteryCapacity: 66,
    range: 449,
    consumption: 16.8,
    image: "🚙"
  },
  {
    id: "bmw-ix3",
    brand: "BMW",
    model: "iX3",
    batteryCapacity: 80,
    range: 459,
    consumption: 18.9,
    image: "🚙"
  },

  // BYD
  {
    id: "byd-atto-3",
    brand: "BYD",
    model: "Atto 3",
    batteryCapacity: 60,
    range: 420,
    consumption: 15.9,
    image: "🚙"
  },
  {
    id: "byd-dolphin",
    brand: "BYD",
    model: "Dolphin",
    batteryCapacity: 60,
    range: 427,
    consumption: 15.3,
    image: "🚗"
  },
  {
    id: "byd-han",
    brand: "BYD",
    model: "Han",
    batteryCapacity: 86,
    range: 521,
    consumption: 17.9,
    image: "🚗"
  },
  {
    id: "byd-seal",
    brand: "BYD",
    model: "Seal",
    batteryCapacity: 82,
    range: 570,
    consumption: 15.7,
    image: "🚗"
  },
  {
    id: "byd-seal-u",
    brand: "BYD",
    model: "Seal U",
    batteryCapacity: 87,
    range: 500,
    consumption: 18.8,
    image: "🚙"
  },
  {
    id: "byd-tang",
    brand: "BYD",
    model: "Tang",
    batteryCapacity: 108,
    range: 400,
    consumption: 29.3,
    image: "🚙"
  },

  // Cupra
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
    range: 517,
    consumption: 16.3,
    image: "🚙"
  },

  // Dacia
  {
    id: "dacia-spring",
    brand: "Dacia",
    model: "Spring",
    batteryCapacity: 27,
    range: 230,
    consumption: 13.9,
    image: "🚗"
  },

  // DS
  {
    id: "ds-3-crossback-etense",
    brand: "DS",
    model: "3 Crossback E-Tense",
    batteryCapacity: 50,
    range: 320,
    consumption: 17.9,
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

  // Ford
  {
    id: "ford-explorer",
    brand: "Ford",
    model: "Explorer",
    batteryCapacity: 77,
    range: 602,
    consumption: 14.0,
    image: "🚙"
  },
  {
    id: "ford-mustang-mach-e",
    brand: "Ford",
    model: "Mustang Mach-E",
    batteryCapacity: 91,
    range: 600,
    consumption: 16.5,
    image: "🚙"
  },

  // Genesis
  {
    id: "genesis-electrified-g80",
    brand: "Genesis",
    model: "Electrified G80",
    batteryCapacity: 87,
    range: 520,
    consumption: 18.2,
    image: "🚗"
  },
  {
    id: "genesis-gv60",
    brand: "Genesis",
    model: "GV60",
    batteryCapacity: 77,
    range: 466,
    consumption: 18.0,
    image: "🚙"
  },
  {
    id: "genesis-gv70-electrified",
    brand: "Genesis",
    model: "GV70 Electrified",
    batteryCapacity: 77,
    range: 455,
    consumption: 18.5,
    image: "🚙"
  },

  // Honda
  {
    id: "honda-e",
    brand: "Honda",
    model: "e",
    batteryCapacity: 35,
    range: 220,
    consumption: 17.2,
    image: "🚗"
  },

  // Hyundai
  {
    id: "hyundai-ioniq-5",
    brand: "Hyundai",
    model: "IONIQ 5",
    batteryCapacity: 77,
    range: 507,
    consumption: 16.7,
    image: "🚙"
  },
  {
    id: "hyundai-ioniq-6",
    brand: "Hyundai",
    model: "IONIQ 6",
    batteryCapacity: 77,
    range: 614,
    consumption: 13.7,
    image: "🚗"
  },
  {
    id: "hyundai-kona-electric",
    brand: "Hyundai",
    model: "Kona Electric",
    batteryCapacity: 65,
    range: 484,
    consumption: 14.7,
    image: "🚙"
  },

  // Jaguar
  {
    id: "jaguar-i-pace",
    brand: "Jaguar",
    model: "I-PACE",
    batteryCapacity: 90,
    range: 470,
    consumption: 22.0,
    image: "🚙"
  },

  // Jeep
  {
    id: "jeep-avenger",
    brand: "Jeep",
    model: "Avenger",
    batteryCapacity: 54,
    range: 400,
    consumption: 15.5,
    image: "🚙"
  },

  // Kia
  {
    id: "kia-e-niro",
    brand: "Kia",
    model: "e-Niro",
    batteryCapacity: 64,
    range: 460,
    consumption: 15.9,
    image: "🚙"
  },
  {
    id: "kia-e-soul",
    brand: "Kia",
    model: "e-Soul",
    batteryCapacity: 64,
    range: 452,
    consumption: 15.7,
    image: "🚙"
  },
  {
    id: "kia-ev6",
    brand: "Kia",
    model: "EV6",
    batteryCapacity: 77,
    range: 528,
    consumption: 16.0,
    image: "🚙"
  },
  {
    id: "kia-ev9",
    brand: "Kia",
    model: "EV9",
    batteryCapacity: 100,
    range: 563,
    consumption: 19.4,
    image: "🚙"
  },

  // Lucid
  {
    id: "lucid-air",
    brand: "Lucid",
    model: "Air",
    batteryCapacity: 118,
    range: 800,
    consumption: 16.0,
    image: "🚗"
  },

  // Mercedes-Benz
  {
    id: "mercedes-eqa",
    brand: "Mercedes-Benz",
    model: "EQA",
    batteryCapacity: 66,
    range: 426,
    consumption: 17.7,
    image: "🚙"
  },
  {
    id: "mercedes-eqb",
    brand: "Mercedes-Benz",
    model: "EQB",
    batteryCapacity: 66,
    range: 423,
    consumption: 17.9,
    image: "🚙"
  },
  {
    id: "mercedes-eqc",
    brand: "Mercedes-Benz",
    model: "EQC",
    batteryCapacity: 80,
    range: 417,
    consumption: 20.8,
    image: "🚙"
  },
  {
    id: "mercedes-eqe",
    brand: "Mercedes-Benz",
    model: "EQE",
    batteryCapacity: 90,
    range: 660,
    consumption: 15.0,
    image: "🚗"
  },
  {
    id: "mercedes-eqe-suv",
    brand: "Mercedes-Benz",
    model: "EQE SUV",
    batteryCapacity: 90,
    range: 547,
    consumption: 18.0,
    image: "🚙"
  },
  {
    id: "mercedes-eqs",
    brand: "Mercedes-Benz",
    model: "EQS",
    batteryCapacity: 107,
    range: 770,
    consumption: 15.7,
    image: "🚗"
  },
  {
    id: "mercedes-eqs-suv",
    brand: "Mercedes-Benz",
    model: "EQS SUV",
    batteryCapacity: 107,
    range: 660,
    consumption: 17.8,
    image: "🚙"
  },
  {
    id: "mercedes-eqv",
    brand: "Mercedes-Benz",
    model: "EQV",
    batteryCapacity: 100,
    range: 363,
    consumption: 32.2,
    image: "🚐"
  },

  // MINI
  {
    id: "mini-cooper-se",
    brand: "MINI",
    model: "Cooper SE",
    batteryCapacity: 32,
    range: 233,
    consumption: 15.2,
    image: "🚗"
  },

  // MG
  {
    id: "mg-4",
    brand: "MG",
    model: "4",
    batteryCapacity: 64,
    range: 450,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "mg-5",
    brand: "MG",
    model: "5",
    batteryCapacity: 61,
    range: 400,
    consumption: 16.8,
    image: "🚗"
  },
  {
    id: "mg-marvel-r",
    brand: "MG",
    model: "Marvel R",
    batteryCapacity: 70,
    range: 402,
    consumption: 18.2,
    image: "🚙"
  },
  {
    id: "mg-zs-ev",
    brand: "MG",
    model: "ZS EV",
    batteryCapacity: 51,
    range: 320,
    consumption: 17.3,
    image: "🚙"
  },

  // Nissan
  {
    id: "nissan-ariya",
    brand: "Nissan",
    model: "Ariya",
    batteryCapacity: 87,
    range: 533,
    consumption: 17.8,
    image: "🚙"
  },
  {
    id: "nissan-leaf",
    brand: "Nissan",
    model: "Leaf",
    batteryCapacity: 62,
    range: 385,
    consumption: 17.1,
    image: "🚗"
  },

  // Opel
  {
    id: "opel-corsa-e",
    brand: "Opel",
    model: "Corsa-e",
    batteryCapacity: 50,
    range: 337,
    consumption: 16.8,
    image: "🚗"
  },
  {
    id: "opel-mokka-e",
    brand: "Opel",
    model: "Mokka-e",
    batteryCapacity: 50,
    range: 324,
    consumption: 17.9,
    image: "🚙"
  },

  // Ora (Great Wall)
  {
    id: "ora-funky-cat",
    brand: "Ora",
    model: "Funky Cat",
    batteryCapacity: 48,
    range: 310,
    consumption: 16.3,
    image: "🚗"
  },

  // Peugeot
  {
    id: "peugeot-e-208",
    brand: "Peugeot",
    model: "e-208",
    batteryCapacity: 50,
    range: 362,
    consumption: 15.5,
    image: "🚗"
  },
  {
    id: "peugeot-e-2008",
    brand: "Peugeot",
    model: "e-2008",
    batteryCapacity: 50,
    range: 320,
    consumption: 17.8,
    image: "🚙"
  },
  {
    id: "peugeot-e-3008",
    brand: "Peugeot",
    model: "e-3008",
    batteryCapacity: 73,
    range: 680,
    consumption: 11.7,
    image: "🚙"
  },
  {
    id: "peugeot-e-5008",
    brand: "Peugeot",
    model: "e-5008",
    batteryCapacity: 73,
    range: 650,
    consumption: 12.3,
    image: "🚙"
  },

  // Polestar
  {
    id: "polestar-2",
    brand: "Polestar",
    model: "2",
    batteryCapacity: 78,
    range: 540,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "polestar-3",
    brand: "Polestar",
    model: "3",
    batteryCapacity: 111,
    range: 610,
    consumption: 19.9,
    image: "🚙"
  },
  {
    id: "polestar-4",
    brand: "Polestar",
    model: "4",
    batteryCapacity: 102,
    range: 611,
    consumption: 18.2,
    image: "🚙"
  },

  // Porsche
  {
    id: "porsche-macan-electric",
    brand: "Porsche",
    model: "Macan Electric",
    batteryCapacity: 95,
    range: 516,
    consumption: 20.1,
    image: "🚙"
  },
  {
    id: "porsche-taycan",
    brand: "Porsche",
    model: "Taycan",
    batteryCapacity: 93,
    range: 504,
    consumption: 20.6,
    image: "🚗"
  },
  {
    id: "porsche-taycan-cross-turismo",
    brand: "Porsche",
    model: "Taycan Cross Turismo",
    batteryCapacity: 93,
    range: 456,
    consumption: 22.4,
    image: "🚗"
  },

  // Renault
  {
    id: "renault-megane-e-tech",
    brand: "Renault",
    model: "Mégane E-TECH",
    batteryCapacity: 60,
    range: 450,
    consumption: 15.8,
    image: "🚗"
  },
  {
    id: "renault-scenic-e-tech",
    brand: "Renault",
    model: "Scénic E-TECH",
    batteryCapacity: 87,
    range: 625,
    consumption: 15.2,
    image: "🚙"
  },
  {
    id: "renault-twingo-ze",
    brand: "Renault",
    model: "Twingo Z.E.",
    batteryCapacity: 22,
    range: 190,
    consumption: 13.0,
    image: "🚗"
  },
  {
    id: "renault-zoe",
    brand: "Renault",
    model: "ZOE",
    batteryCapacity: 52,
    range: 395,
    consumption: 14.1,
    image: "🚗"
  },

  // Skoda
  {
    id: "skoda-enyaq",
    brand: "Skoda",
    model: "Enyaq iV",
    batteryCapacity: 82,
    range: 534,
    consumption: 16.7,
    image: "🚙"
  },

  // Smart
  {
    id: "smart-1",
    brand: "Smart",
    model: "#1",
    batteryCapacity: 66,
    range: 440,
    consumption: 16.2,
    image: "🚗"
  },
  {
    id: "smart-3",
    brand: "Smart",
    model: "#3",
    batteryCapacity: 66,
    range: 455,
    consumption: 15.7,
    image: "🚙"
  },

  // Subaru
  {
    id: "subaru-solterra",
    brand: "Subaru",
    model: "Solterra",
    batteryCapacity: 71,
    range: 466,
    consumption: 16.6,
    image: "🚙"
  },

  // Tesla
  {
    id: "tesla-model-3",
    brand: "Tesla",
    model: "Model 3",
    batteryCapacity: 75,
    range: 629,
    consumption: 13.2,
    image: "🚗"
  },
  {
    id: "tesla-model-s",
    brand: "Tesla",
    model: "Model S",
    batteryCapacity: 100,
    range: 652,
    consumption: 16.4,
    image: "🚗"
  },
  {
    id: "tesla-model-x",
    brand: "Tesla",
    model: "Model X",
    batteryCapacity: 100,
    range: 543,
    consumption: 20.9,
    image: "🚙"
  },
  {
    id: "tesla-model-y",
    brand: "Tesla",
    model: "Model Y",
    batteryCapacity: 75,
    range: 533,
    consumption: 15.3,
    image: "🚙"
  },

  // Toyota
  {
    id: "toyota-bz4x",
    brand: "Toyota",
    model: "bZ4X",
    batteryCapacity: 71,
    range: 516,
    consumption: 15.0,
    image: "🚙"
  },

  // Volkswagen
  {
    id: "volkswagen-id3",
    brand: "Volkswagen",
    model: "ID.3",
    batteryCapacity: 77,
    range: 554,
    consumption: 15.4,
    image: "🚗"
  },
  {
    id: "volkswagen-id4",
    brand: "Volkswagen",
    model: "ID.4",
    batteryCapacity: 77,
    range: 520,
    consumption: 16.3,
    image: "🚙"
  },
  {
    id: "volkswagen-id5",
    brand: "Volkswagen",
    model: "ID.5",
    batteryCapacity: 77,
    range: 513,
    consumption: 16.6,
    image: "🚙"
  },
  {
    id: "volkswagen-id7",
    brand: "Volkswagen",
    model: "ID.7",
    batteryCapacity: 86,
    range: 709,
    consumption: 13.2,
    image: "🚗"
  },
  {
    id: "volkswagen-id-buzz",
    brand: "Volkswagen",
    model: "ID. Buzz",
    batteryCapacity: 82,
    range: 423,
    consumption: 21.3,
    image: "🚐"
  },

  // Volvo
  {
    id: "volvo-c40-recharge",
    brand: "Volvo",
    model: "C40 Recharge",
    batteryCapacity: 78,
    range: 530,
    consumption: 16.0,
    image: "🚙"
  },
  {
    id: "volvo-em90",
    brand: "Volvo",
    model: "EM90",
    batteryCapacity: 116,
    range: 738,
    consumption: 17.1,
    image: "🚐"
  },
  {
    id: "volvo-ex30",
    brand: "Volvo",
    model: "EX30",
    batteryCapacity: 69,
    range: 476,
    consumption: 15.7,
    image: "🚙"
  },
  {
    id: "volvo-ex90",
    brand: "Volvo",
    model: "EX90",
    batteryCapacity: 111,
    range: 614,
    consumption: 19.7,
    image: "🚙"
  },
  {
    id: "volvo-xc40-recharge",
    brand: "Volvo",
    model: "XC40 Recharge",
    batteryCapacity: 78,
    range: 425,
    consumption: 19.9,
    image: "🚙"
  },

  // Xpeng
  {
    id: "xpeng-g6",
    brand: "Xpeng",
    model: "G6",
    batteryCapacity: 87,
    range: 550,
    consumption: 17.2,
    image: "🚙"
  },
  {
    id: "xpeng-g9",
    brand: "Xpeng",
    model: "G9",
    batteryCapacity: 98,
    range: 570,
    consumption: 18.8,
    image: "🚙"
  },
  {
    id: "xpeng-p7",
    brand: "Xpeng",
    model: "P7",
    batteryCapacity: 81,
    range: 706,
    consumption: 12.5,
    image: "🚗"
  },

  // Zeekr
  {
    id: "zeekr-x",
    brand: "Zeekr",
    model: "X",
    batteryCapacity: 69,
    range: 445,
    consumption: 16.9,
    image: "🚙"
  },

  // Hongqi
  {
    id: "hongqi-e-hs9",
    brand: "Hongqi",
    model: "E-HS9",
    batteryCapacity: 84,
    range: 465,
    consumption: 19.6,
    image: "🚙"
  },

  // NIO
  {
    id: "nio-et5",
    brand: "NIO",
    model: "ET5",
    batteryCapacity: 100,
    range: 560,
    consumption: 19.5,
    image: "🚗"
  },
  {
    id: "nio-et7",
    brand: "NIO",
    model: "ET7",
    batteryCapacity: 100,
    range: 580,
    consumption: 18.8,
    image: "🚗"
  },

  // Lynk & Co
  {
    id: "lynk-co-01",
    brand: "Lynk & Co",
    model: "01",
    batteryCapacity: 69,
    range: 420,
    consumption: 17.9,
    image: "🚙"
  },

  // Rimac
  {
    id: "rimac-nevera",
    brand: "Rimac",
    model: "Nevera",
    batteryCapacity: 120,
    range: 490,
    consumption: 26.7,
    image: "🚗"
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚗 Starting car models population...');

    // Check if car models already exist
    const { data: existingCars, error: checkError } = await supabase
      .from('car_models')
      .select('car_id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing cars:', checkError);
      throw checkError;
    }

    if (existingCars && existingCars.length > 0) {
      console.log('⚡ Car models already exist, skipping population');
      return new Response(
        JSON.stringify({ message: 'Car models already exist', count: existingCars.length }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform car models to database format
    const dbCarModels = carModels.map(car => ({
      car_id: car.id,
      brand: car.brand,
      model: car.model,
      battery_capacity_kwh: car.batteryCapacity,
      range_km: car.range,
      consumption_kwh_per_100km: car.consumption,
      image_emoji: car.image,
      is_active: true,
      available_in_norway: true
    }));

    // Insert car models in batches of 50
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < dbCarModels.length; i += batchSize) {
      const batch = dbCarModels.slice(i, i + batchSize);
      
      console.log(`🔄 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dbCarModels.length / batchSize)}`);
      
      const { error: insertError } = await supabase
        .from('car_models')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw insertError;
      }

      totalInserted += batch.length;
    }

    console.log(`✅ Successfully populated ${totalInserted} car models`);

    return new Response(
      JSON.stringify({ 
        message: 'Car models populated successfully', 
        count: totalInserted 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in populate-car-models function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});