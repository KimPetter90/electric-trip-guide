import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouteOptimizer } from "@/utils/routeCalculation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/components/ComingSoon";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUserRole } from "@/hooks/useUserRole";
import CarSelector from "@/components/CarSelector";
import RouteImpact from "@/components/RouteImpact";
import RouteInput from "@/components/RouteInput";
import RouteSelector from "@/components/RouteSelector";
import ChargingMap from "@/components/ChargingMap";
import GoogleRouteMap from "@/components/GoogleRouteMap";
import { ShareRoute } from "@/components/ShareRoute";
import { EnhancedHeader } from "@/components/EnhancedHeader";
import { EnhancedRouteInput } from "@/components/EnhancedRouteInput";
import { EnhancedMapSection } from "@/components/EnhancedMapSection";
import { PricingSection } from "@/components/PricingSection";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

import ComprehensiveFerrySchedule from "@/components/ComprehensiveFerrySchedule";

import { Zap, Route, MapPin, Car, Battery, LogIn, User, CreditCard, LogOut, AlertTriangle, BarChart3, Building2, Cloud, TrendingUp, Clock, TreePine } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";
import { type RouteOption } from "@/components/RouteSelector";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SimpleAnalytics from "@/components/SimpleAnalytics";

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
  const { isAdmin, loading: roleLoading } = useAdminRole();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useAnalytics();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // All state declarations - MUST be unconditional
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    from: "",
    to: "",
    via: "",
    trailerWeight: 0,
    batteryPercentage: 80, // Default til 80% for bedre brukeropplevelse
    travelDate: undefined
  });
  const [showRoute, setShowRoute] = useState(true);
  const [routeTrigger, setRouteTrigger] = useState(0); // Start med 0 - ingen automatisk beregning
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [planningRoute, setPlanningRoute] = useState(false);
  const [showChargingButton, setShowChargingButton] = useState(false);
  const [currentChargingStation, setCurrentChargingStation] = useState<any>(null);
  const [chargingProgress, setChargingProgress] = useState(0);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [optimizedStations, setOptimizedStations] = useState<any[]>([]);
  const [tripAnalysis, setTripAnalysis] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<any[]>([]);

  // Stable callback functions to prevent re-renders
  const handleChargingStationUpdate = useCallback((station: any, showButton: boolean, optimizedStations?: any[]) => {
    setCurrentChargingStation(station);
    setShowChargingButton(showButton);
    if (optimizedStations) {
      setOptimizedStations(optimizedStations);
    }
  }, []);
  
  const handleRouteAnalysisUpdate = useCallback((analysis: RouteAnalysis | null) => {
    setRouteAnalysis(analysis);
  }, []);

  // Google Maps callbacks - MUST be stable to prevent map reinitialization
  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('🗺️ Google Maps loaded successfully');
  }, []);

  const onRouteCalculated = useCallback((analysis: any) => {
    setTripAnalysis(analysis);
  }, []);

  const onLoadingChange = useCallback((loading: boolean) => {
    setMapLoading(loading);
  }, []);

  const onError = useCallback((error: string | null) => {
    setMapError(error);
  }, []);

  // Optimized route selection - stable function reference
  const handleRouteSelect = useCallback((routeId: string) => {
    console.log('🎯 Route selected:', routeId);
    setSelectedRouteId(routeId);
    // Trigger kartberegning når bruker velger ny rute
    if (routeTrigger > 0) { // Kun hvis allerede har beregnet ruter
      setRouteTrigger(prev => prev + 1);
    }
  }, [routeTrigger]);

  // Load charging stations on component mount
  useEffect(() => {
    const loadChargingStations = async () => {
      console.log('🔋 Loading charging stations...');
      
      try {
        const { data, error } = await supabase
          .from('charging_stations')
          .select('*');
        
        if (error) {
          console.error('❌ Error loading charging stations:', error);
          return;
        }
        
        console.log('✅ Loaded', data?.length || 0, 'charging stations');
        console.log('🔋 First station sample:', data?.[0]);
        setChargingStations(data || []);
      } catch (error) {
        console.error('❌ Exception loading charging stations:', error);
      }
    };

    loadChargingStations();
  }, []);

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

  // Auto-select favorite car when user logs in (only once)
  useEffect(() => {
    if (user && favoriteCar && selectedCar === null) {
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
  }, [user, favoriteCar, toast]); // Removed selectedCar from dependencies!

  // CONDITIONAL RETURNS CAN ONLY HAPPEN AFTER ALL HOOKS
  
  // 🔒 ABSOLUTT PRODUKSJONSBESKYTTELSE
  const currentHost = window.location.hostname.toLowerCase();
  const currentHref = window.location.href.toLowerCase();
  
  console.log('🌍 FULL URL DEBUG:', {
    href: window.location.href,
    hostname: window.location.hostname,
    host: window.location.host,
    origin: window.location.origin
  });
  
  // ALLE mulige produksjonsdomener - MER AGGRESSIV
  const productionDomains = [
    'elroute.no',
    'www.elroute.no', 
    'elroute.com',
    'www.elroute.com',
    'elroute.npo', // i tilfelle typo
    'www.elroute.npo'
  ];
  
  // Sjekk om vi er på produksjon på NOEN måte - STRENGERE
  const isProduction = productionDomains.some(domain => 
    currentHost === domain || 
    currentHost.endsWith(domain) ||
    currentHref.includes(domain)
  );
  
  // Tillat både Lovable editor og preview for testing
  const isLovableEnvironment = currentHost.includes('lovableproject.com') || currentHost.includes('lovable.app');
  
  // BLOKKERING: Kun produksjon er blokkert, Lovable miljøer er OK
  if (isProduction) {
    console.log('🚫 PRODUCTION BLOCK:', { 
      currentHost, 
      currentHref,
      isProduction, 
      productionDomains,
      reason: 'PRODUCTION_DOMAIN_DETECTED'
    });
    return <ComingSoon />;
  }
  
  // DEBUG kun for Lovable miljø
  console.log('🔍 Environment debug:', { 
    isAdmin, 
    roleLoading, 
    user: !!user, 
    authLoading: loading,
    hostname: currentHost,
    isLovableEnvironment
  });
  
  // Vis auth loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <Zap className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Laster ElRoute...</p>
        </div>
      </div>
    );
  }
  
  // Vis role loading
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Temporarily allow all users for development
  console.log('✅ DEV: Access granted for development');

  // Handle route reset function
  const handleResetRoutes = async () => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må være innlogget for å nullstille ruter.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Nullstiller ruter...",
        description: "Vent litt mens vi nullstiller rutetellingen din.",
      });

      const { data, error } = await supabase.functions.invoke('reset-routes');

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Ukjent feil');
      }

      toast({
        title: "✅ Ruter nullstilt!",
        description: "Du har nå fått nullstilt rutetellingen og kan planlegge nye ruter.",
        variant: "default",
      });

      // Refresh subscription data to show updated route count
      setTimeout(() => refreshSubscription(), 100);
      
    } catch (error: any) {
      console.error('❌ Error resetting routes:', error);
      toast({
        title: "Feil ved nullstilling",
        description: error.message || "Kunne ikke nullstille ruter. Prøv igjen senere.",
        variant: "destructive",
      });
    }
  };

  // Optimalisert generering av rutevalg med caching og debounce
  const generateRouteOptions = async () => {
    if (!selectedCar || !routeData.from || !routeData.to) return;
    
    // Sjekk at begge feltene har minst 3 tegn for å unngå for tidlig beregning
    if (routeData.from.trim().length < 3 || routeData.to.trim().length < 3) return;

    const cacheKey = `${routeData.from}-${routeData.to}-${selectedCar.id}`;
    const cached = localStorage.getItem(`routeCache_${cacheKey}`);
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 300000) { // 5 min cache
          setRouteOptions(cachedData.routes);
          setSelectedRouteId(null);
          setLoadingRoutes(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(`routeCache_${cacheKey}`);
      }
    }

    setLoadingRoutes(true);

    // Fjernet delay for raskere respons

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
    setLoadingRoutes(false);
    
    console.log('🎯 Route options generated:', mockRoutes.length, 'routes');
    console.log('📋 Routes:', mockRoutes.map(r => r.name));
    
    // La brukeren velge rute selv - ikke automatisk valg
    
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
    
    // Fallback på koordinat-basert estimering
    const cityCoords: { [key: string]: [number, number] } = {
      'oslo': [59.9139, 10.7522], 'bergen': [60.3913, 5.3221], 'trondheim': [63.4305, 10.3951],
      'stavanger': [58.9700, 5.7331], 'kristiansand': [58.1467, 7.9956], 'ålesund': [62.4722, 6.1495],
      'tromsø': [69.6492, 18.9553], 'bodø': [67.2804, 14.4049], 'drammen': [59.7439, 10.2045],
      'fredrikstad': [59.2181, 10.9298], 'moss': [59.4369, 10.6567], 'sarpsborg': [59.2839, 11.1098]
    };
    
    const fromCoords = cityCoords[fromKey];
    const toCoords = cityCoords[toKey];
    
    if (fromCoords && toCoords) {
      // Beregn luftlinje-avstand og multipliser med 1.3 for veiavstand
      const lat1 = fromCoords[0] * Math.PI / 180;
      const lat2 = toCoords[0] * Math.PI / 180;
      const deltaLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
      const deltaLng = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const airDistance = 6371 * c; // Jorden radius i km
      
      return Math.round(airDistance * 1.3); // Multipliser med 1.3 for veiavstand
    }
    
    // Siste fallback - bruk lengden på stedsnavnet som grov estimering
    return Math.max(100, (from.length + to.length) * 25);
  };


  // Enhanced route planning with proper loading states
  const handlePlanRoute = async () => {
    console.log('🚀 PLANLEGG RUTE KNAPP TRYKKET!'); // Ny logging
    console.log('🔍 DEBUG: Planning route with:', {
      selectedCar: selectedCar?.brand + ' ' + selectedCar?.model,
      from: routeData.from,
      to: routeData.to,
      batteryPercentage: routeData.batteryPercentage
    });

    if (!selectedCar || !routeData.from || !routeData.to) {
      console.log('❌ Missing information for route planning');
      toast({
        title: "Manglende informasjon",
        description: "Vennligst velg bil og angi start- og sluttdestinasjon.",
        variant: "destructive",
      });
      return;
    }

    if (routeData.batteryPercentage <= 0) {
      console.log('❌ Battery percentage is 0 or less');
      toast({
        title: "Batterinivå påkrevd",
        description: "Vennligst angi ditt nåværende batterinivå.",
        variant: "destructive",
      });
      return;
    }

    // Sjekk om brukeren har nok ruter igjen
    if (subscription && subscription.route_limit !== -1 && subscription.route_count >= subscription.route_limit) {
      toast({
        title: "Rutegrense nådd",
        description: "Du har brukt opp dine månedlige ruter. Oppgrader for å planlegge flere ruter.",
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }

      console.log('🚀 Starting route planning...');
      console.log('📱 Is mobile:', window.innerWidth < 768);
      setPlanningRoute(true);
      setLoadingRoutes(true);
      
    try {
      // Vis kartet først
      setShowRoute(true);
    
      // Track route planning
      if (user && subscription) {
        try {
          const { error: trackError } = await supabase.functions.invoke('track-analytics', {
            body: {
              event: 'route_planned',
              user_id: user.id,
              metadata: {
                from: routeData.from,
                to: routeData.to,
                car_brand: selectedCar.brand,
                car_model: selectedCar.model,
                trailer_weight: routeData.trailerWeight,
                battery_percentage: routeData.batteryPercentage
              }
            }
          });
          
          if (trackError) {
            console.warn('Analytics tracking failed:', trackError);
          }
        } catch (trackError) {
          console.warn('Analytics tracking failed:', trackError);
        }
      }
      
      // Generer rutevalg
      await generateRouteOptions();
      
    } catch (error: any) {
      console.error('❌ Route planning failed:', error);
      setShowRoute(false);
    } finally {
      setPlanningRoute(false);
      setLoadingRoutes(false);
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
      console.error('Sign out error:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Header with Auth */}
      <header className="relative z-50 border-b border-border/20 bg-background/80 backdrop-blur-sm" role="banner">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary animate-glow-pulse" aria-hidden="true" />
              <h1 className="text-xl font-orbitron font-bold text-gradient">ElRoute</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="max-w-32 truncate">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/pricing')}
                      className={`relative transition-all duration-300 hover:shadow-lg ${
                        subscription?.is_trial_active 
                          ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-400/50 hover:border-orange-400/70 hover:shadow-orange-500/20' 
                          : 'bg-gradient-to-r from-background/50 to-background/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 hover:shadow-primary/20'
                      }`}
                    >
                      <CreditCard className={`h-4 w-4 mr-2 ${subscription?.is_trial_active ? 'text-orange-500' : 'text-primary'}`} />
                      <span className="font-medium">
                        {subscription?.subscription_status === 'free' ? 'Oppgrader' : 'Abonnement'}
                      </span>
                      {subscription?.is_trial_active && subscription?.days_left_in_trial !== undefined && (
                        <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 px-2.5 py-1 shadow-md font-medium text-xs">
                          PREMIUM {subscription.days_left_in_trial}d
                        </Badge>
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => navigate('/business')}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Business
                    </Button>
                  </div>
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
                
                
                <div data-testid="route-map" className="relative mt-8">
                  {/* Mobile-specific loading indicator */}
                  {(mapLoading || planningRoute) && window.innerWidth < 768 && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                      <div className="text-center space-y-2">
                        <Zap className="h-8 w-8 text-primary animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          {planningRoute ? 'Planlegger rute...' : 'Laster kart...'}
                        </p>
                        <p className="text-xs text-muted-foreground">Kan ta litt tid på mobil</p>
                      </div>
                    </div>
                  )}
                  {/* Desktop loading indicator */}
                  {(mapLoading || planningRoute) && window.innerWidth >= 768 && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                      <div className="text-center space-y-2">
                        <Zap className="h-8 w-8 text-primary animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          {planningRoute ? 'Planlegger rute...' : 'Laster kart...'}
                        </p>
                      </div>
                    </div>
                  )}
                  {mapError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{mapError}</p>
                      </div>
                    </div>
                  )}
                  <GoogleRouteMap 
                    key={`google-map-${selectedRouteId || 'default'}`}
                    center={{ lat: 60.472, lng: 8.4689 }}
                    zoom={6}
                    onMapLoad={onMapLoad}
                    chargingStations={chargingStations}
                    routeData={routeData}
                    selectedCar={selectedCar}
                    selectedRouteId={selectedRouteId}
                    routeOptions={routeOptions}
                    routeTrigger={routeTrigger}
                    onRouteCalculated={onRouteCalculated}
                    onLoadingChange={onLoadingChange}
                    onError={onError}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      
      {/* Påvirkningsanalyse - OVER rutestatistikk */}
      {selectedCar && routeData.from && routeData.to && (
        <section className="py-12 mt-8 bg-muted/5" aria-label="Påvirkningsanalyse">
          <div className="container mx-auto px-4">
            <RouteImpact 
              selectedCar={selectedCar}
              routeData={routeData}
            />
          </div>
        </section>
      )}

      {/* Route Statistics - always visible, positioned below main content */}
      <section className="py-8 mt-2 bg-muted/5" aria-label="Rutestatistikk">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary animate-glow-pulse" />
            <h2 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse tracking-wider">Rutestatistikk</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            <Card className="relative p-4 glass-card border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-blue-900/10 neon-glow hover-scale">
              <div className="text-center">
                <Route className="h-6 w-6 text-blue-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-blue-300 font-exo uppercase tracking-wide">Total distanse</p>
                <p className="text-xl font-orbitron font-bold text-blue-100">
                  {tripAnalysis && selectedRouteId ? tripAnalysis.distance : '0 km'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>

            <Card className="relative p-4 glass-card border border-green-500/30 bg-gradient-to-br from-green-950/20 to-green-900/10 cyber-glow hover-scale">
              <div className="text-center">
                <Clock className="h-6 w-6 text-green-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-green-300 font-exo uppercase tracking-wide">Total tid</p>
                <p className="text-xl font-orbitron font-bold text-green-100">
                  {tripAnalysis && selectedRouteId ? tripAnalysis.time : '0 min'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>

            <Card className="relative p-4 glass-card border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-purple-900/10 neon-glow hover-scale">
              <div className="text-center">
                <CreditCard className="h-6 w-6 text-purple-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-purple-300 font-exo uppercase tracking-wide">Ladekostnad</p>
                <p className="text-xl font-orbitron font-bold text-purple-100">
                  {tripAnalysis && selectedRouteId ? '245 kr' : '0 kr'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>

            <Card className="relative p-4 glass-card border border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-orange-900/10 cyber-glow hover-shade">
              <div className="text-center">
                <Zap className="h-6 w-6 text-orange-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-orange-300 font-exo uppercase tracking-wide">Ladetid</p>
                <p className="text-xl font-orbitron font-bold text-orange-100">
                  {tripAnalysis && selectedRouteId ? '45 min' : '0 min'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>

            <Card className="relative p-4 glass-card border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-emerald-900/10 neon-glow hover-scale">
              <div className="text-center">
                <TreePine className="h-6 w-6 text-emerald-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-emerald-300 font-exo uppercase tracking-wide">CO₂ spart</p>
                <p className="text-xl font-orbitron font-bold text-emerald-100">
                  {tripAnalysis && selectedRouteId ? '42 kg' : '0 kg'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>

            <Card className="relative p-4 glass-card border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-indigo-900/10 cyber-glow hover-scale">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-indigo-400 mx-auto mb-2 animate-glow-pulse" />
                <p className="text-xs text-indigo-300 font-exo uppercase tracking-wide">Effektivitet</p>
                <p className="text-xl font-orbitron font-bold text-indigo-100">
                  {tripAnalysis && selectedRouteId ? '87%' : '0%'}
                </p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Card>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard - kun for admin brukere */}
      {isAdmin && !roleLoading && (
        <section className="py-12 bg-muted/30" aria-label="Analytics dashboard">
          <div className="container mx-auto px-4">
            <SimpleAnalytics />
          </div>
        </section>
      )}

      {/* Performance & Security Dashboard - kun for admin */}
      {isAdmin && !roleLoading && (
        <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">App Optimalisering & Sikkerhet</h2>
              <p className="text-xl text-muted-foreground">
                Ytelse og sikkerhetsstatus for ElRoute
              </p>
            </div>
            <PerformanceOptimizer />
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section className="py-12" aria-label="Abonnement og priser">
        <PricingSection />
      </section>

      {/* Footer */}
      <footer className="relative bg-card/60 backdrop-blur-sm border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-orbitron font-bold text-lg">ElRoute</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fremtidens ruteplanlegging for elbiler i Norge.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Tjenester</h3>
              <div className="space-y-2">
                <Button 
                  variant="link" 
                  onClick={() => navigate('/pricing')}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground justify-start"
                >
                  Priser
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/business')}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground justify-start"
                >
                  Business
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Juridisk</h3>
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
                    Test User Admin
                  </Button>
                )}
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