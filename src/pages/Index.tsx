import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import CarSelector from "@/components/CarSelector";
import WeatherImpact from "@/components/WeatherImpact";
import RouteInput from "@/components/RouteInput";
import RouteSelector from "@/components/RouteSelector";
import ChargingMap from "@/components/ChargingMap";
import RouteMap from "@/components/RouteMap";
import { ShareRoute } from "@/components/ShareRoute";
import { FavoriteRoutes } from "@/components/FavoriteRoutes";
import { TrialBanner } from "@/components/TrialBanner";
import { Zap, Route, MapPin, Car, Battery, LogIn, User, CreditCard, LogOut, AlertTriangle, BarChart3, Building2 } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";
import { type RouteOption } from "@/components/RouteSelector";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

interface RouteAnalysis {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  chargingTime: number;
  co2Saved: number;
  efficiency: number;
  weather?: any;
}

function Index() {
  const { user, subscription, favoriteCar, signOut, loading, refreshSubscription } = useAuth();
  
  // Track page view
  useAnalytics();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    from: "",
    to: "",
    via: "",
    trailerWeight: 0,
    batteryPercentage: 0,
    travelDate: undefined
  });
  const [showRoute, setShowRoute] = useState(false);
  const [routeTrigger, setRouteTrigger] = useState(0); // Trigger for manual route updates
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [planningRoute, setPlanningRoute] = useState(false); // Ny loading state for planlegging
  
  // Ladestasjon state for å vise ladeknapp
  const [showChargingButton, setShowChargingButton] = useState(false);
  const [currentChargingStation, setCurrentChargingStation] = useState<any>(null);
  const [chargingProgress, setChargingProgress] = useState(0);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<any[]>([]);

  // Handle shared route parameters
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    if (fromParam) {
      setRouteData(prev => ({ ...prev, from: decodeURIComponent(fromParam) }));
    }
    if (toParam) {
      setRouteData(prev => ({ ...prev, to: decodeURIComponent(toParam) }));
    }
  }, [searchParams]);

  const handleFavoriteRouteSelect = (from: string, to: string) => {
    setRouteData(prev => ({ ...prev, from, to }));
    toast({
      title: "Favoritt-rute valgt",
      description: `Klar for å planlegge: ${from} → ${to}`,
    });
  };

  // Auto-select favorite car when user logs in
  useEffect(() => {
    if (user && favoriteCar && !selectedCar) {
      const favoriteCarModel: CarModel = {
        id: favoriteCar.car_id,
        brand: favoriteCar.car_brand,
        model: favoriteCar.car_model,
        batteryCapacity: favoriteCar.battery_capacity,
        range: favoriteCar.range_km,
        consumption: favoriteCar.consumption,
        image: favoriteCar.car_image || '/placeholder.svg'
      };
      setSelectedCar(favoriteCarModel);
      toast({
        title: "Favorittbil lastet",
        description: `${favoriteCar.car_brand} ${favoriteCar.car_model} er valgt automatisk`,
      });
    }
  }, [user, favoriteCar, selectedCar, toast]);

  // Sjekk om brukeren har tilgang til analytics
  const hasAnalyticsAccess = user?.email === 'kpkopperstad@gmail.com';
  
  // Optimalisert nullstilling av rutevalg med debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (routeOptions.length > 0) {
        setRouteOptions([]);
        setSelectedRouteId(null);
        setShowRoute(false);
      }
    }, 300); // Debounce for å unngå unødvendige re-renders

    return () => clearTimeout(timer);
  }, [routeData.from, routeData.to, routeData.via, selectedCar?.id, routeOptions.length]);
  
  // Funksjon for å motta ladestasjon data fra RouteMap
  const handleChargingStationUpdate = (station: any, showButton: boolean, optimizedStations?: any[]) => {
    console.log('🔋 INDEX: Mottatt ladestasjon oppdatering:', station?.name, 'show:', showButton);
    console.log('🔋 INDEX: Mottatt optimizedStations:', optimizedStations);
    setCurrentChargingStation(station);
    setShowChargingButton(showButton);
    if (optimizedStations) {
      console.log('🔋 INDEX: Setter optimizedStations til:', optimizedStations);
      setOptimizedStations(optimizedStations);
    }
  };
  
  // Funksjon for å motta routeAnalysis fra RouteMap
  const handleRouteAnalysisUpdate = (analysis: RouteAnalysis | null) => {
    console.log('📊 INDEX: Mottatt routeAnalysis:', analysis);
    setRouteAnalysis(analysis);
  };
  // Optimalisert generering av rutevalg med caching
  const generateRouteOptions = async () => {
    if (!selectedCar || !routeData.from || !routeData.to) return;

    const cacheKey = `${routeData.from}-${routeData.to}-${selectedCar.id}`;
    const cached = localStorage.getItem(`routeCache_${cacheKey}`);
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 300000) { // 5 min cache
          setRouteOptions(cachedData.routes);
          setSelectedRouteId('fastest');
          setLoadingRoutes(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(`routeCache_${cacheKey}`);
      }
    }

    setLoadingRoutes(true);

    // Redusert ventetid for bedre UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Estimer avstand basert på destinasjoner (forenklet beregning)
    const estimatedDistance = calculateApproximateDistance(routeData.from, routeData.to);
    
    // Beregn minimum ladestasjoner basert på valgt bil og ruteforholdene
    const calculateMinimumStops = (distance: number, routeType: string): number => {
      if (!selectedCar) return Math.max(1, Math.round(distance / 300)); // Fallback
      
      const currentRange = selectedCar.range * (routeData.batteryPercentage / 100);
      const safetyMargin = 0.15; // 15% buffer for sikkerhet
      const usableRange = currentRange * (1 - safetyMargin);
      
      // Juster for ruteforholdene og kjørestil
      let rangeMultiplier = 1;
      switch (routeType) {
        case 'fastest':
          rangeMultiplier = 0.85; // Høyere hastighet = mer forbruk
          break;
        case 'shortest':
          rangeMultiplier = 0.9; // Noe mer effektiv
          break;
        case 'eco':
          rangeMultiplier = 1.05; // Optimalisert kjøring
          break;
      }
      
      const effectiveRange = usableRange * rangeMultiplier;
      const remainingDistance = Math.max(0, distance - effectiveRange);
      
      if (remainingDistance <= 0) return 0; // Kommer frem uten lading
      
      // Beregn antall stopp basert på bil og sikkerhetsbuffer
      const fullChargeRange = selectedCar.range * 0.8 * rangeMultiplier;
      return Math.ceil(remainingDistance / fullChargeRange);
    };
    
    const mockRoutes: RouteOption[] = [
      {
        id: 'fastest',
        name: 'Raskeste rute',
        distance: Math.round(estimatedDistance * 1.02), // Litt lengre for motorveier
        duration: Math.round((estimatedDistance * 1.02) / 90 * 60), // ~90 km/t snitt
        chargingStops: calculateMinimumStops(estimatedDistance * 1.02, 'fastest'),
        estimatedCost: Math.round(estimatedDistance * 0.6), // 0.6 kr per km
        description: 'Hovedveier og motorveier. Rask fremkomst med minimum antall stopp.',
        routeType: 'fastest'
      },
      {
        id: 'shortest',
        name: 'Korteste rute',
        distance: Math.round(estimatedDistance * 0.95), // Kortere, men tregere veier
        duration: Math.round((estimatedDistance * 0.95) / 75 * 60), // ~75 km/t snitt
        chargingStops: calculateMinimumStops(estimatedDistance * 0.95, 'shortest'),
        estimatedCost: Math.round(estimatedDistance * 0.55), // Billigere
        description: 'Direkteste vei mellom destinasjonene. Minimum distanse og færrest stopp.',
        routeType: 'shortest'
      },
      {
        id: 'eco',
        name: 'Miljøvennlig rute',
        distance: Math.round(estimatedDistance * 1.08), // Lengre, men mer effektiv
        duration: Math.round((estimatedDistance * 1.08) / 80 * 60), // ~80 km/t snitt
        chargingStops: calculateMinimumStops(estimatedDistance * 1.08, 'eco'),
        estimatedCost: Math.round(estimatedDistance * 0.42), // Billigst
        description: 'Optimalisert for lavest energiforbruk. Kan redusere antall nødvendige stopp.',
        routeType: 'eco'
      }
    ];

    setRouteOptions(mockRoutes);
    setSelectedRouteId('fastest');
    setLoadingRoutes(false);
    
    // Cache resultatet
    try {
      localStorage.setItem(`routeCache_${cacheKey}`, JSON.stringify({
        routes: mockRoutes,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache lagring feilet:', e);
    }
  };

  // Komplett distansetabell for norske byer
  const calculateApproximateDistance = (from: string, to: string): number => {
    const distances: { [key: string]: { [key: string]: number } } = {
      'oslo': {
        'bergen': 463, 'trondheim': 543, 'stavanger': 518, 'kristiansand': 319, 'tromsø': 1369,
        'ålesund': 651, 'drammen': 65, 'fredrikstad': 106, 'moss': 64, 'sarpsborg': 115,
        'sandefjord': 125, 'tønsberg': 112, 'larvik': 147, 'porsgrunn': 162, 'skien': 171,
        'lillehammer': 185, 'hamar': 126, 'gjøvik': 125, 'kongsberg': 90, 'notodden': 122,
        'rjukan': 168, 'molde': 718, 'kristiansund': 798, 'bodø': 1264, 'narvik': 1431,
        'harstad': 1398, 'alta': 1844, 'kirkenes': 2104, 'hammerfest': 1956, 'vadsø': 2089,
        'honningsvåg': 2007, 'lakselv': 1875, 'tana': 1987, 'kautokeino': 1798, 'karasjok': 1821
      },
      'bergen': {
        'oslo': 463, 'stavanger': 209, 'trondheim': 656, 'kristiansand': 484, 'ålesund': 381,
        'florø': 150, 'sogndal': 205, 'voss': 102, 'odda': 169, 'haugesund': 157,
        'drammen': 528, 'fredrikstad': 569, 'moss': 527, 'sandefjord': 588, 'tønsberg': 575,
        'larvik': 610, 'skien': 634, 'lillehammer': 648, 'hamar': 589, 'gjøvik': 588,
        'molde': 337, 'kristiansund': 417, 'tromsø': 1032, 'bodø': 927, 'narvik': 1094
      },
      'trondheim': {
        'oslo': 543, 'bergen': 656, 'ålesund': 300, 'steinkjer': 126, 'mo i rana': 285,
        'tromsø': 520, 'røros': 157, 'kristiansund': 145, 'molde': 218, 'stavanger': 757,
        'kristiansand': 862, 'drammen': 608, 'bodø': 235, 'narvik': 402, 'harstad': 369,
        'alta': 679, 'kirkenes': 939, 'hammerfest': 791, 'lillehammer': 358, 'hamar': 417
      },
      'stavanger': {
        'oslo': 518, 'bergen': 209, 'kristiansand': 238, 'haugesund': 78, 'egersund': 69,
        'sandnes': 15, 'bryne': 33, 'trondheim': 757, 'ålesund': 613, 'drammen': 583,
        'fredrikstad': 624, 'moss': 582, 'sandefjord': 643, 'tønsberg': 630, 'larvik': 665,
        'skien': 689, 'molde': 671, 'kristiansund': 751, 'tromsø': 1277, 'bodø': 1172
      },
      'kristiansand': {
        'oslo': 319, 'stavanger': 238, 'bergen': 484, 'arendal': 67, 'mandal': 43,
        'flekkefjord': 97, 'grimstad': 44, 'trondheim': 862, 'ålesund': 832, 'drammen': 384,
        'fredrikstad': 425, 'moss': 383, 'sandefjord': 444, 'tønsberg': 431, 'larvik': 466,
        'skien': 490, 'lillehammer': 504, 'hamar': 445, 'gjøvik': 444, 'tromsø': 1688
      },
      'ålesund': {
        'oslo': 651, 'bergen': 381, 'trondheim': 300, 'kristiansand': 832, 'stavanger': 613,
        'molde': 70, 'kristiansund': 147, 'florø': 231, 'tromsø': 823, 'bodø': 535,
        'narvik': 702, 'harstad': 669, 'drammen': 716, 'fredrikstad': 757, 'moss': 715,
        'sandefjord': 776, 'tønsberg': 763, 'larvik': 798, 'skien': 822, 'lillehammer': 466
      },
      'tromsø': {
        'oslo': 1369, 'bergen': 1032, 'trondheim': 520, 'ålesund': 823, 'stavanger': 1277,
        'kristiansand': 1688, 'bodø': 300, 'narvik': 167, 'harstad': 134, 'alta': 269,
        'kirkenes': 529, 'hammerfest': 381, 'honningsvåg': 432, 'lakselv': 299, 'tana': 411,
        'kautokeino': 408, 'karasjok': 431, 'vadsø': 680, 'mo i rana': 585, 'steinkjer': 646
      },
      'bodø': {
        'oslo': 1264, 'bergen': 927, 'trondheim': 235, 'ålesund': 535, 'stavanger': 1172,
        'kristiansand': 1583, 'tromsø': 300, 'narvik': 233, 'harstad': 200, 'mo i rana': 50,
        'steinkjer': 361, 'røros': 392, 'kristiansund': 380, 'molde': 453, 'alta': 569
      },
      'drammen': {
        'oslo': 65, 'bergen': 528, 'stavanger': 583, 'kristiansand': 384, 'ålesund': 716,
        'trondheim': 608, 'tromsø': 1434, 'fredrikstad': 171, 'moss': 129, 'sarpsborg': 180,
        'sandefjord': 190, 'tønsberg': 177, 'larvik': 212, 'porsgrunn': 227, 'skien': 236
      }
    };

    const fromKey = from.toLowerCase().split(' ')[0].split('(')[0];
    const toKey = to.toLowerCase().split(' ')[0].split('(')[0];
    
    // Sjekk direkte avstand
    if (distances[fromKey]?.[toKey]) {
      return distances[fromKey][toKey];
    }
    
    // Sjekk omvendt retning
    if (distances[toKey]?.[fromKey]) {
      return distances[toKey][fromKey];
    }
    
    // Omfattende koordinattabell for alle norske steder og tettsteder
    const cityCoords: { [key: string]: [number, number] } = {
      // Hovedbyer
      'oslo': [59.9139, 10.7522], 'bergen': [60.3913, 5.3221], 'trondheim': [63.4305, 10.3951],
      'stavanger': [58.9700, 5.7331], 'kristiansand': [58.1467, 7.9956], 'ålesund': [62.4722, 6.1495],
      'tromsø': [69.6492, 18.9553], 'bodø': [67.2804, 14.4049], 'drammen': [59.7439, 10.2045],
      'fredrikstad': [59.2181, 10.9298], 'moss': [59.4369, 10.6567], 'sarpsborg': [59.2839, 11.1098],
      'sandefjord': [59.1309, 10.2167], 'tønsberg': [59.2670, 10.4075], 'larvik': [59.0553, 10.0364],
      
      // Agder fylke - komplett
      'arendal': [58.4596, 8.7665], 'grimstad': [58.3401, 8.5936], 'mandal': [58.0297, 7.4581],
      'flekkefjord': [58.2971, 6.6602], 'lillesand': [58.2488, 8.3714], 'vennesla': [58.2539, 7.9539],
      'evje': [58.5751, 7.7690], 'bygland': [58.7397, 7.8204], 'valle': [59.2143, 7.5382],
      'birkenes': [58.3667, 8.2167], 'iveland': [58.4667, 7.9667], 'åmli': [58.7667, 8.6167],
      'froland': [58.6000, 8.7000], 'gjerstad': [58.7167, 8.9833], 'vegårshei': [58.7500, 9.0833],
      'tvedestrand': [58.6197, 8.9364], 'risør': [58.7197, 9.2364], 'bamble': [59.0167, 9.6000],
      'kragerø': [58.8697, 9.4131], 'drangedal': [59.1000, 9.0667], 'nissedal': [58.9833, 8.5000],
      'fyresdal': [59.1833, 8.0667], 'kviteseid': [59.3500, 8.5000], 'seljord': [59.4833, 8.6333],
      'hjartdal': [59.5500, 8.3167], 'notodden': [59.5595, 9.2590], 'sauherad': [59.5500, 9.2167],
      'nome': [59.1833, 9.1833], 'bø': [59.4167, 9.0667], 'siljan': [59.1167, 9.5167],
      'skien': [59.2096, 9.6098], 'porsgrunn': [59.1406, 9.6545], 'tokke': [59.5500, 8.1333],
      'vinje': [59.5833, 7.8833], 'lindesnes': [58.0167, 7.0500], 'audnedal': [58.1833, 7.2833],
      'lyngdal': [58.1500, 7.0833], 'hægebostad': [58.2333, 7.3833], 'kvinesdal': [58.3167, 6.8167],
      'sirdal': [58.8167, 6.6000], 'sokndal': [58.3667, 6.1167], 'eigersund': [58.4518, 5.9940],
      
      // Rogaland fylke - komplett
      'sandnes': [58.8518, 5.7362], 'bryne': [58.7336, 5.6468], 'haugesund': [59.4138, 5.2681],
      'kopervik': [59.2839, 5.3080], 'stord': [59.7780, 5.4769], 'odda': [60.0668, 6.5446],
      'sauda': [59.6545, 6.3485], 'jørpeland': [59.0347, 6.0620], 'tau': [59.0333, 6.1000],
      'hjelmeland': [59.2167, 6.1833], 'strand': [59.1167, 6.1167], 'forsand': [59.0167, 6.1833],
      'gjesdal': [58.7833, 6.0833], 'klepp': [58.7667, 5.6167], 'time': [58.7000, 5.5167],
      'hå': [58.5833, 5.5833], 'bjerkreim': [58.6333, 6.0167], 'lund': [58.5167, 6.4833],
      'karmøy': [59.2667, 5.2833], 'tysvær': [59.3167, 5.6333],
      'bokn': [59.2167, 5.4167], 'vindafjord': [59.4833, 5.9833], 'etne': [59.6667, 6.0000],
      'sveio': [59.5500, 5.3000], 'kvinnherad': [59.9833, 5.9833], 'ullensvang': [60.3333, 6.6667],
      'eidfjord': [60.4667, 7.0667], 'ulvik': [60.5667, 6.9333], 'granvin': [60.5333, 6.7167],
      'voss': [60.6295, 6.4173], 'kvam': [60.3333, 5.9167], 'samnanger': [60.3333, 5.6667],
      'os': [60.1833, 5.4833], 'austevoll': [60.0833, 5.2667], 'sund': [60.2167, 5.1333],
      'fjell': [60.3833, 4.9833], 'askøy': [60.4667, 5.0833], 'vaksdal': [60.5833, 5.6333],
      'modalen': [60.8333, 6.0167], 'osterøy': [60.5333, 5.4833], 'meland': [60.5667, 5.1167],
      'øygarden': [60.5833, 4.9000], 'radøy': [60.6333, 5.1167], 'lindås': [60.6833, 5.3000],
      'masfjorden': [60.8833, 5.5000], 'gulen': [61.0333, 5.1833], 'solund': [61.0833, 4.8000],
      'hyllestad': [61.1667, 5.2167], 'høyanger': [61.2167, 5.9833], 'vik': [61.0833, 5.8000],
      'balestrand': [61.2167, 6.5167], 'leikanger': [61.1833, 6.7833], 'sogndal': [61.2308, 7.0956],
      'aurland': [60.9000, 7.1833], 'lærdal': [61.1000, 7.4833], 'årdal': [61.2333, 7.7000],
      'luster': [61.4167, 7.3000], 'askvoll': [61.3483, 5.0612], 'fjaler': [61.2833, 5.2167],
      'gaular': [61.3500, 5.7333], 'jølster': [61.4667, 6.0167], 'førde': [61.4520, 5.8567],
      'naustdal': [61.5167, 5.6833], 'bremanger': [61.8000, 5.1333], 'vågsøy': [61.9356, 5.1124],
      'selje': [62.0000, 5.3333], 'eid': [61.9333, 5.9333], 'hornindal': [61.9667, 6.5167],
      'gloppen': [61.7667, 6.2000], 'stryn': [61.9114, 6.7156], 'florø': [61.6014, 5.0323],
      
      // Møre og Romsdal - komplett
      'molde': [62.7373, 7.1607], 'kristiansund': [63.1109, 7.7285], 'ulsteinvik': [62.3433, 5.8496],
      'volda': [62.1485, 6.0716], 'ørsta': [62.1966, 6.1283], 'geiranger': [62.1017, 7.2065],
      'andalsnes': [62.5664, 7.6903], 'fosnavåg': [62.3242, 5.6570], 'måløy': [61.9356, 5.1124],
      'vanylven': [62.1167, 5.8833], 'sande': [62.2667, 6.2167], 'herøy': [62.3333, 5.8000],
      'ulstein': [62.3333, 5.8333], 'hareid': [62.3667, 6.0333], 'ørskog': [62.1833, 6.9167],
      'norddal': [62.1833, 7.1833], 'stordal': [62.2167, 7.1000], 'sykkylven': [62.4000, 6.8833],
      'skodje': [62.5000, 6.5833], 'sula': [62.4500, 6.0833], 'giske': [62.4833, 6.0167],
      'haram': [62.5833, 6.2167], 'vestnes': [62.6000, 7.0833], 'rauma': [62.5667, 7.6833],
      'nesset': [62.8333, 8.3833], 'midsund': [62.6833, 6.6833], 'sandøy': [62.7667, 6.3833],
      'aukra': [62.7925, 6.9190], 'fræna': [62.8667, 7.3000], 'eide': [62.9000, 7.5000],
      'averøy': [63.0000, 7.5667], 'gjemnes': [62.9667, 8.2000], 'tingvoll': [62.9167, 8.1833],
      'sunndal': [62.6717, 8.5631], 'surnadal': [62.9510, 8.5631], 'rindal': [62.9747, 9.2410],
      'halsa': [63.1000, 8.7667], 'smøla': [63.4500, 8.0167], 'aure': [63.2833, 8.5500],
      
      // Trøndelag - komplett
      'steinkjer': [64.0186, 11.4952], 'namsos': [64.4650, 11.4952], 'levanger': [63.7457, 11.3013],
      'verdal': [63.7903, 11.4747], 'orkanger': [63.3056, 9.8467], 'melhus': [63.2878, 10.2733],
      'oppdal': [62.5954, 9.6899], 'røros': [62.5743, 11.3888], 'holtålen': [62.8000, 11.0000],
      'midtre gauldal': [63.0000, 10.1833], 'meldal': [63.0500, 9.7167], 'skaun': [63.2833, 10.0833],
      'klæbu': [63.2833, 10.4833], 'malvik': [63.4333, 10.6667], 'selbu': [63.2167, 11.0500],
      'tydal': [62.7833, 11.6833], 'meråker': [63.4167, 11.7333], 'stjørdal': [63.4667, 10.9167],
      'frosta': [63.5667, 11.0333], 'leksvik': [63.6000, 10.1667], 'inderøy': [63.8667, 11.3000],
      'snåsa': [64.2500, 12.3833], 'lierne': [64.4667, 13.3000], 'røyrvik': [64.8333, 13.8333],
      'namsskogan': [64.9167, 13.1500], 'grong': [64.4667, 12.3000], 'høylandet': [64.6167, 12.1167],
      'overhalla': [64.5000, 11.9333], 'fosnes': [64.7167, 11.1000], 'flatanger': [64.5000, 10.7833],
      'namdalseid': [64.1667, 11.3333], 'vikna': [64.8500, 11.0333], 'nærøy': [64.8167, 11.9500],
      'leka': [65.1000, 11.6167], 'bindal': [65.0833, 12.3500], 'osen': [64.2833, 10.4500],
      'roan': [64.1667, 10.2000], 'åfjord': [63.9667, 10.2167], 'bjugn': [63.7500, 9.7833],
      'ørland': [63.7000, 9.5167], 'rissa': [63.5833, 9.9667], 'agdenes': [63.3333, 9.7000],
      'rennebu': [62.8333, 9.9167], 'hemne': [63.3000, 9.1000], 'snillfjord': [63.3333, 9.3167],
      'hitra': [63.6000, 8.8333], 'frøya': [63.7333, 8.7667],
      
      // Nordland - komplett
      'mo i rana': [66.3142, 14.1426], 'fauske': [67.2594, 15.3897], 'rognan': [67.0941, 15.3876],
      'saltstraumen': [67.2333, 14.6167], 'ørnes': [67.0000, 15.6167], 'meløy': [66.7833, 14.1000],
      'brønnøysund': [65.4720, 12.2078], 'sandnessjøen': [66.0219, 12.6311], 'mosjøen': [65.8363, 13.1997],
      'hemnes': [66.2167, 13.8833], 'rana': [66.3000, 14.0000], 'lurøy': [66.4167, 12.7667],
      'træna': [66.5000, 12.1000], 'rødøy': [66.7500, 13.7333], 'nesna': [66.2000, 13.0333],
      'dønna': [66.1000, 12.5167], 'herøy nordland': [66.0333, 12.5000], 'alstahaug': [65.9667, 12.5500],
      'leirfjord': [65.8000, 12.6833], 'vefsn': [65.8333, 13.1667], 'grane': [65.4833, 13.3333],
      'hattfjelldal': [65.6000, 13.8333], 'vevelstad': [65.6333, 12.1167], 'vega': [65.6667, 11.9167],
      'sømna': [65.3333, 12.3500], 'brønnøy': [65.4667, 12.2167], 'bindal nordland': [65.0833, 12.3500],
      'leka nordland': [65.1000, 11.6167], 'vikna nordland': [64.8500, 11.0333], 'nærøy nordland': [64.8167, 11.9500],
      'sørfold': [67.3333, 15.6667], 'steigen': [67.8333, 15.0000], 'hamarøy': [68.1000, 15.8333],
      'tysfjord': [68.2167, 16.0833], 'lødingen': [68.4500, 16.0333], 'tjeldsund': [68.6000, 16.4833],
      'evenes': [68.5000, 16.8333], 'ballangen': [68.3333, 17.4000], 'røst': [67.5167, 12.1000],
      'værøy': [67.6667, 12.6667], 'moskenes': [67.9167, 12.9833], 'flakstad': [68.0833, 13.2500],
      'vågan': [68.2348, 14.5694], 'sortland': [68.6970, 15.4169],
      'øksnes': [69.0333, 15.4167], 'bø nordland': [68.7500, 14.4667], 'hadsel': [68.5667, 14.6000],
      'andøy': [69.3221, 16.1222], 'leknes': [68.1495, 13.6139], 'gravdal': [68.1344, 13.5042],
      'svolvær': [68.2348, 14.5694], 'kabelvåg': [68.2167, 14.4833], 'henningsvær': [68.1500, 14.2000],
      'reine': [67.9333, 13.0833], 'å': [67.8833, 12.9833], 'nusfjord': [68.0333, 13.2167],
      
      // Troms og Finnmark - komplett
      'narvik': [68.4384, 17.4272], 'harstad': [68.7989, 16.5413], 'finnsnes': [69.2305, 17.9762],
      'lenvik': [69.5833, 17.9667], 'silsand': [69.2167, 18.2167], 'bardufoss': [69.0567, 18.5414],
      'andselv': [69.3167, 18.8167], 'målselv': [69.0667, 18.7000], 'bardu': [68.8500, 18.3500],
      'salangen': [68.8000, 17.8833], 'lavangen': [68.7667, 17.8167], 'gratangen': [68.7000, 17.4500],
      'ibestad': [68.6833, 16.9000], 'tranøy': [68.8833, 16.2667], 'berg': [69.4000, 17.1000],
      'torsken': [69.4167, 16.6333], 'kvæfjord': [68.7833, 16.1167], 'skånland': [68.5833, 16.6000],
      'bjarkøy': [69.0167, 16.5833], 'karlsøy': [70.0667, 19.4667], 'lyngen': [69.5833, 20.2167],
      'storfjord': [69.3000, 20.4000], 'kåfjord': [69.7167, 21.1000], 'skjervøy': [70.0333, 20.9667],
      'nordreisa': [69.7500, 21.0167], 'kvænangen': [70.1333, 21.8667], 'loppa': [70.3500, 21.3000],
      'hasvik': [70.4833, 22.1333], 'måsøy': [71.0000, 23.6333], 'hammerfest': [70.6634, 23.6826],
      'sørøysund': [70.5000, 22.2000], 'alta': [69.9689, 23.2728], 'talvik': [70.0167, 23.1000],
      'porsanger': [70.4500, 25.0500], 'karasjok': [69.4669, 25.5115], 'kautokeino': [69.0122, 23.0410],
      'lebesby': [70.8667, 28.2333], 'gamvik': [71.0333, 28.1500], 'berlevåg': [70.8567, 29.0850],
      'båtsfjord': [70.6333, 29.7167], 'vardø': [70.3667, 31.1000], 'vadsø': [70.0741, 29.7491],
      'sør-varanger': [69.5833, 30.0333], 'kirkenes': [69.7269, 30.0458], 'nesseby': [70.1833, 28.9000],
      'tana': [70.1759, 28.2086], 'unjárga': [70.4833, 28.9833], 'deatnu': [70.1759, 28.2086],
      'guovdageaidnu': [69.0122, 23.0410], 'kárášjohka': [69.4669, 25.5115], 'honningsvåg': [70.9826, 25.9704],
      'lakselv': [70.0589, 24.9697], 'mehamn': [71.0358, 27.8497], 'kjøllefjord': [70.9333, 27.7667],
      
      // Viken/Østfold/Akershus - komplett
      'asker': [59.8352, 10.4330], 'bærum': [59.8937, 10.5464], 'lørenskog': [59.9279, 10.9516],
      'rælingen': [59.9333, 11.0667], 'lillestrøm': [59.9565, 11.0464], 'jessheim': [60.1395, 11.1747],
      'ski': [59.7197, 10.8364], 'ås': [59.6667, 10.7833], 'vestby': [59.6052, 10.7501],
      'halden': [59.1200, 11.3882], 'askim': [59.5833, 11.1667], 'spydeberg': [59.6333, 11.0833],
      'mysen': [59.5558, 11.3233], 'eidsberg': [59.5167, 11.3500], 'rakkestad': [59.4167, 11.3500],
      'rygge': [59.3833, 10.7167], 'råde': [59.3333, 10.8333], 'hvaler': [59.0500, 11.0500],
      'aremark': [59.2167, 11.6833], 'marker': [59.4500, 11.4833], 'indre østfold': [59.5000, 11.2500],
      'hobøl': [59.6500, 11.0167], 'oppegård': [59.7333, 10.7833], 'nesodden': [59.8500, 10.6500],
      'frogn': [59.6833, 10.6167], 'enebakk': [59.7667, 11.1500], 'fet': [59.9167, 11.1833],
      'skedsmo': [60.0167, 11.0333], 'sørum': [60.0833, 11.2333], 'gjerdrum': [60.0833, 10.8667],
      'ullensaker': [60.1833, 11.0833], 'nes': [60.1333, 11.4167], 'eidsvoll': [60.3167, 11.2500],
      'nannestad': [60.2333, 10.9167], 'hurdal': [60.3833, 11.0833], 'aurskog-høland': [59.9333, 11.4500],
      'nittedal': [60.0167, 10.8500], 'lunner': [60.3000, 10.5833], 'gran': [60.3833, 10.3000],
      'jevnaker': [60.2667, 10.4000], 'kongsvinger': [60.1978, 12.0063],
      'nord-odal': [60.4167, 11.8333], 'sør-odal': [60.3000, 11.6000], 'eidskog': [60.2833, 12.0000],
      'grue': [60.4667, 12.0667], 'åsnes': [60.6667, 12.3167], 'våler': [60.6167, 11.8000],
      'elverum': [60.8810, 11.5645], 'trysil': [61.3167, 12.2667], 'åmot': [61.1167, 11.9500],
      'stor-elvdal': [61.2833, 11.0167], 'rendalen': [61.7833, 11.2167], 'engerdal': [61.7833, 11.7333],
      'tolga': [62.4000, 10.9833], 'tynset': [62.2833, 10.7833], 'alvdal': [62.1099, 10.6300],
      'folldal': [62.1333, 9.9500], 'os innlandet': [62.2333, 10.0333], 'dovre': [62.0833, 9.2833],
      'lesja': [62.1667, 8.7500], 'skjåk': [61.9000, 7.9000], 'lom': [61.8365, 8.5699],
      'vågå': [61.8833, 9.6667], 'sel': [61.7667, 9.8833], 'nord-fron': [61.9000, 10.1333],
      'sør-fron': [61.5833, 10.2333], 'ringebu': [61.5167, 10.1667], 'øyer': [61.2667, 10.4167],
      'gausdal': [61.2000, 10.1333], 'lillehammer': [61.1154, 10.4662], 'gjøvik': [60.7957, 10.6915],
      'østre toten': [60.7500, 10.7333], 'vestre toten': [60.6167, 10.4833], 'søndre land': [60.5500, 10.2667],
      'nordre land': [60.8000, 10.3333], 'sør-aurdal': [60.9000, 9.6000], 'nord-aurdal': [61.1000, 9.4000],
      'vestre slidre': [61.0333, 8.8333], 'øystre slidre': [61.2000, 8.6667], 'vang': [61.1333, 8.5833],
      'etnedal': [60.8667, 9.2000], 'bagn': [61.0000, 9.6000], 'fagernes': [61.0000, 9.2833],
      'otta': [61.7734, 9.5354], 'dombås': [62.0766, 9.1189], 'vinstra': [61.6334, 9.8500],
      
      // Vestfold og Telemark - komplett
      'horten': [59.4167, 10.4833], 'holmestrand': [59.4896, 10.3123], 're': [59.4167, 10.2500],
      'sande vf': [59.6167, 10.2000], 'hof': [59.3667, 10.0833], 'stokke': [59.2833, 10.3167],
      'nøtterøy': [59.2167, 10.4000], 'tjøme': [59.1167, 10.4000], 'færder': [59.1167, 10.4000],
      'røyken': [59.7500, 10.2833], 'hurum': [59.6167, 10.4667], 'lier': [59.7833, 10.2167],
      'øvre eiker': [59.8000, 9.9167], 'nedre eiker': [59.7333, 9.9667],
      'ringerike': [60.1667, 10.2333], 'hole': [60.1000, 10.3167], 'flå': [60.6167, 9.4833],
      'nes buskerud': [60.5167, 9.5167], 'gol': [60.7167, 8.9833], 'hemsedal': [60.8667, 8.5833],
      'ål': [60.6333, 8.5500], 'hol': [60.8167, 7.9167], 'sigdal': [59.9333, 9.4833],
      'krødsherad': [60.0167, 9.6333], 'modum': [59.8333, 10.0333],
      'flesberg': [59.8167, 9.5833], 'rollag': [59.8833, 9.3833], 'nore og uvdal': [60.2833, 8.9167]
    };
    
    const fromCoords = cityCoords[fromKey];
    const toCoords = cityCoords[toKey];
    
    if (fromCoords && toCoords) {
      // Haversine formel for luftlinje, deretter * 1.35 for veier (mer realistisk for Norge)
      const R = 6371; // Jordens radius i km
      const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
      const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(fromCoords[0] * Math.PI / 180) * Math.cos(toCoords[0] * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const airDistance = R * c;
      
      // Faktor 1.35 for norske veiforhold (fjell, fjorder etc.)
      return Math.round(airDistance * 1.35);
    }
    
    // Siste fallback: 300km
    return 300;
  };

  const handleRouteSelect = (routeId: string) => {
    console.log('🎯 Index.tsx: Nytt rutevalg mottatt:', routeId);
    setSelectedRouteId(routeId);
    console.log('🔄 Index.tsx: selectedRouteId oppdatert til:', routeId);
  };

  const handlePlanRoute = async () => {
    // Forhindre double-click
    if (planningRoute) {
      console.log('🚫 Ruteplanlegging pågår allerede, ignorerer klikk');
      return;
    }

    setPlanningRoute(true);
    
    try {
      // Validering av input
      if (!selectedCar) {
        toast({
          title: "Velg bil",
          description: "Du må velge en bil før du kan planlegge rute.",
          variant: "destructive",
        });
        return;
      }

      if (!routeData.from || !routeData.to) {
        toast({
          title: "Angi rute",
          description: "Du må fylle ut både start- og sluttdestinasjon.",
          variant: "destructive",
        });
        return;
      }

      if (routeData.from.toLowerCase().trim() === routeData.to.toLowerCase().trim()) {
        toast({
          title: "Ugyldig rute",
          description: "Start- og sluttdestinasjon kan ikke være den samme.",
          variant: "destructive",
        });
        return;
      }
      
      // Sjekk autentisering
      if (!user) {
        toast({
          title: "Logg inn for å planlegge ruter",
          description: "Du må være innlogget for å bruke ruteplanleggeren.",
          variant: "destructive",
        });
        // Ikke naviger hvis vi allerede er på rett side
        if (window.location.pathname !== '/auth') {
          navigate('/auth');
        }
        return;
      }

      console.log('🚀 Starter ruteplanlegging - viser kart umiddelbart');
      
      // Show route map immediately after validation
      setShowRoute(true);
      console.log('🎯 setShowRoute(true) kalt - RouteMap skal nå være synlig');
      setRouteTrigger(prev => prev + 1);
      console.log('🎯 setRouteTrigger kalt for å trigger RouteMap useEffect');
      
      // Scroll to map after a short delay to ensure it's rendered
      setTimeout(() => {
        const mapElement = document.querySelector('[data-testid="route-map"]');
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);

      // Sjekk rutegrenser - men bare hvis subscription data er tilgjengelig
      if (subscription) {
        if (subscription.route_limit !== -1 && subscription.route_count >= subscription.route_limit) {
          toast({
            title: "Rutegrense nådd",
            description: `Du har brukt opp alle dine ${subscription.route_limit} ruter for denne måneden. Oppgrader for flere ruter.`,
            variant: "destructive",
          });
          // Ikke naviger hvis vi allerede er på rett side
          if (window.location.pathname !== '/pricing') {
            navigate('/pricing');
          }
          return;
        }
      } else {
        // Hvis subscription data ikke er tilgjengelig, fortsett likevel men med warning
        console.warn('⚠️ Subscription data ikke tilgjengelig, fortsetter med ruteplanlegging');
        toast({
          title: "Planlegger rute",
          description: "Starter ruteplanlegging...",
          variant: "default",
        });
      }
      
      console.log('🚀 Fortsetter med ruteplanlegging...');
      
      // Oppdater ruteteller - bare hvis subscription er tilgjengelig
      if (user && subscription) {
        try {
          await supabase.rpc('increment_route_count', { user_uuid: user.id });
          setTimeout(() => refreshSubscription(), 100);
        } catch (error) {
          console.warn('⚠️ Kunne ikke oppdatere ruteteller:', error);
          // Fortsett likevel med ruteplanlegging
        }
      }
      
      setShowRoute(true);
      console.log('🎯 setShowRoute(true) kalt - RouteMap skal nå være synlig');
      setRouteTrigger(prev => prev + 1);
      console.log('🎯 setRouteTrigger kalt for å trigger RouteMap useEffect');
      
      // Scroll to map after a short delay to ensure it's rendered
      setTimeout(() => {
        const mapElement = document.querySelector('[data-testid="route-map"]');
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
      await generateRouteOptions();
      
      toast({
        title: "Rute planlagt!",
        description: subscription ? `Ruter brukt: ${subscription.route_count + 1} / ${subscription.route_limit === -1 ? '∞' : subscription.route_limit}` : "Gratis rute planlagt",
      });
      
      console.log('✅ Ruteplanlegging fullført - showRoute:', true);
      
    } catch (error) {
      console.error('Feil ved ruteplanlegging:', error);
      toast({
        title: "Feil ved ruteplanlegging",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      // Alltid reset loading state etter en kort delay
      setTimeout(() => {
        setPlanningRoute(false);
      }, 1000); // 1 sekund minimum loading
    }
  };

  // Vis kartet kun når "Planlegg rute" trykkes - ikke automatisk
  // (Fjernet automatisk visning)

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut.",
      });
    } catch (error) {
      toast({
        title: "Feil ved utlogging",
        description: "Noe gikk galt.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-orbitron font-semibold mb-2">Laster ElRoute</h2>
          <p className="text-muted-foreground">Forbereder din ruteplanlegger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* SEO Meta Tags */}
      <meta name="description" content="ElRoute - Smart ruteplanlegging for elbiler i Norge. Finn beste ladestasjoner og optimaliser din elbiltur med AI-teknologi." />
      <meta name="keywords" content="elbil, ruteplanlegging, ladestasjoner, Norge, elektrisk bil, EV, charging, route planning" />
      <meta property="og:title" content="ElRoute - Smart Elbil Ruteplanlegging" />
      <meta property="og:description" content="Fremtidens ruteplanlegging for elbiler i Norge med sanntids ladestasjondata" />
      <meta property="og:type" content="website" />
      
      {/* Header with Auth */}
      <header className="relative z-50 border-b border-border/20 bg-background/80 backdrop-blur-sm" role="banner">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                ElRoute
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {subscription?.subscription_status === 'free' ? 'Oppgrader' : 'Abonnement'}
                  </Button>
                  
                  {subscription && (
                    <Badge variant={subscription.subscription_status === 'free' ? 'secondary' : 'default'}>
                      {subscription.subscription_status === 'free' && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {subscription.route_count} / {subscription.route_limit === -1 ? '∞' : subscription.route_limit} ruter
                    </Badge>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => navigate('/business')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Business
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button onClick={() => navigate('/auth')} size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Logg inn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/business')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Business
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Futuristisk animert bakgrunn */}
      <div className="fixed inset-0 opacity-30">
        <div 
          className="absolute inset-0 bg-gradient-cyber animate-circuit"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(140 100% 50% / 0.15) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, hsl(180 100% 50% / 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, hsl(280 100% 50% / 0.15) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
        {/* Cyberpunk grid overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%2300ff88' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${futuristicBg})` }}
          role="img"
          aria-label="Futuristisk elbil bakgrunnsbilde"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-85" />
        
        {/* Floating Energy Orbs - Decorative */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-20 left-1/4 w-4 h-4 bg-primary rounded-full animate-float shadow-neon"></div>
          <div className="absolute top-40 right-1/3 w-3 h-3 bg-secondary rounded-full animate-float animation-delay-1000 shadow-glow"></div>
          <div className="absolute bottom-40 left-1/3 w-5 h-5 bg-accent rounded-full animate-float animation-delay-2000 shadow-neon"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-10 w-10 text-primary animate-glow-pulse" aria-hidden="true" />
              <h2 id="hero-heading" className="text-5xl md:text-7xl font-orbitron font-black text-gradient animate-glow-pulse">
                ElRoute
              </h2>
              <Zap className="h-10 w-10 text-primary animate-glow-pulse" aria-hidden="true" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-exo animate-float">
              Smart ruteplanlegging for mer effektiv elbilkjøring
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-primary/30 neon-glow">
                <Car className="h-5 w-5 text-primary animate-glow-pulse" />
                <span className="font-exo font-medium">150+ elbilmodeller</span>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-secondary/30 cyber-glow animation-delay-500">
                <Route className="h-5 w-5 text-secondary animate-glow-pulse" />
                <span className="font-exo font-medium">AI-optimalisering</span>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-full px-6 py-3 border border-accent/30 neon-glow animation-delay-1000">
                <MapPin className="h-5 w-5 text-accent" />
                <span>900+ ladestasjoner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12" role="main">
        {/* Trial Banner - vis kun for innloggede brukere */}
        {user && <TrialBanner />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <section className="space-y-8" aria-label="Ruteplanlegging input">
            <div>
              <CarSelector 
                selectedCar={selectedCar}
                onCarSelect={setSelectedCar}
              />
            </div>
            
            <div>
              <RouteInput
                routeData={routeData}
                onRouteChange={setRouteData}
                onPlanRoute={handlePlanRoute}
                isPlanning={planningRoute}
              />
            </div>

            {/* Weather Impact Section */}
            <div>
              <WeatherImpact 
                selectedCar={selectedCar}
                routeData={routeData}
              />
            </div>

            {/* Favoritt-ruter */}
            <div>
              <FavoriteRoutes
                onRouteSelect={handleFavoriteRouteSelect}
              />
            </div>

            {selectedCar && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg" role="complementary">
                <h3 className="font-semibold mb-2 text-primary">Valgt bil:</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCar.brand} {selectedCar.model} - {selectedCar.batteryCapacity} kWh, {selectedCar.range} km rekkevidde
                </p>
              </Card>
            )}
          </section>

          {/* Right Column - Results */}
          <section className="space-y-8" aria-label="Ruteresultater">
            {!showRoute ? (
              <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border shadow-lg" role="status">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4 animate-glow-pulse" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Klar for ruteplanlegging</h3>
                <p className="text-muted-foreground">
                  Velg bil og angi rute for å se det futuristiske ladestasjonkartet
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                <RouteSelector
                  routes={routeOptions}
                  selectedRoute={selectedRouteId}
                  onRouteSelect={handleRouteSelect}
                  isLoading={loadingRoutes}
                />
                
                {/* Del rute - vis bare hvis rute er valgt */}
                {selectedRouteId && routeOptions.length > 0 && (
                  <Card className="p-4 bg-card/80 backdrop-blur-sm border-border shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-primary">Valgt rute</h3>
                      <ShareRoute
                        routeData={{
                          from: routeData.from,
                          to: routeData.to,
                          distance: String(routeOptions.find(r => r.id === selectedRouteId)?.distance) || '0 km',
                          duration: String(routeOptions.find(r => r.id === selectedRouteId)?.duration) || '0 min',
                          chargingCost: '150 kr', // Placeholder
                          batteryUsed: '65%' // Placeholder
                        }}
                      />
                    </div>
                  </Card>
                )}
                
                <RouteMap 
                  isVisible={showRoute} 
                  routeData={routeData}
                  selectedCar={selectedCar}
                  routeTrigger={routeTrigger}
                  selectedRouteId={selectedRouteId}
                  onChargingStationUpdate={handleChargingStationUpdate}
                  onRouteAnalysisUpdate={handleRouteAnalysisUpdate}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Analytics Dashboard - kun for autoriserte brukere */}
      {hasAnalyticsAccess && (
        <section className="py-12 bg-muted/30" aria-label="Analytics dashboard">
          <div className="container mx-auto px-4">
            <AnalyticsDashboard />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative bg-card/60 backdrop-blur-sm border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  ElRoute
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Fremtidens ruteplanlegging for elbiler i Norge
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Juridisk</h4>
              <div className="space-y-2">
                <Button 
                  variant="link" 
                  onClick={() => navigate('/privacy')}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground justify-start"
                >
                  Personvernerklæring
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/terms')}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground justify-start"
                >
                  Vilkår og betingelser
                </Button>
                {user && (
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/admin/test-users')}
                    className="p-0 h-auto text-xs text-muted-foreground/60 hover:text-foreground justify-start"
                  >
                    Testbruker admin
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Kontakt</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Elroutesup@gmail.com</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ElRoute. Alle rettigheter forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;