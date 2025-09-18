import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { RouteOptimizer, type OptimizedChargingPlan } from '@/utils/routeCalculation';
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

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fast_charger: boolean;
  power: string;
  cost: number;
  provider: string;
  address: string;
}

interface TripAnalysis {
  totalDistance: number;
  totalTime: number;
  totalChargingTime: number;
  totalCost: number;
  batteryUsage: number;
  requiredStops: number;
  weatherImpact: string;
  routeEfficiency: string;
}

// Component
const GoogleRouteMap: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  onMapLoad?: (map: google.maps.Map) => void;
  chargingStations: ChargingStation[];
  routeData: RouteData;
  selectedCar: CarModel | null;
  routeTrigger: number;
  onRouteCalculated: (analysis: TripAnalysis) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
}> = ({ center, zoom, onMapLoad, chargingStations, routeData, selectedCar, routeTrigger, onRouteCalculated, onLoadingChange, onError }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const allMarkersRef = useRef<google.maps.Marker[]>([]);
  const chargingStationMarkersRef = useRef<google.maps.Marker[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<google.maps.DirectionsResult | null>(null);

  // Clear markers on unmount
  useEffect(() => {
    return () => {
      allMarkersRef.current.forEach(marker => marker.setMap(null));
      chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  // Initialize Google Maps only once
  useEffect(() => {
    if (typeof window === 'undefined' || isMapInitialized) return;

    const initializeMap = async () => {
      try {
        onLoadingChange(true);
        onError(null);
        console.log('🗺️ Initialiserer Google Maps...');

        // Get API key from Supabase function
        const { data, error } = await supabase.functions.invoke('google-maps-proxy');
        
        if (error || !data?.apiKey) {
          console.error('❌ Feil ved henting av API-nøkkel:', error);
          onError('Kunne ikke laste Google Maps. Prøv igjen senere.');
          onLoadingChange(false);
          return;
        }

        console.log('✅ API-nøkkel mottatt, laster Google Maps...');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          region: 'NO',
          language: 'no'
        });

        console.log('🔧 Loading Google Maps JavaScript API...');
        const google = await loader.load();
        console.log('✅ Google Maps JavaScript API loaded successfully');

        if (!mapRef.current) {
          console.error('❌ Map container element not found');
          onError('Kartcontainer ikke tilgjengelig');
          onLoadingChange(false);
          return;
        }

        console.log('🗺️ Creating Google Maps instance...');
        
        // Initialize map with explicit error handling
        try {
          const map = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            mapTypeControl: true,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'auto', // Endre til auto for å unngå instruksjoner
            keyboardShortcuts: false,
            clickableIcons: false,
            disableDoubleClickZoom: false,
            scrollwheel: false, // Deaktiver scroll-to-zoom helt
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });

          console.log('✅ Google Maps instance created successfully');
          mapInstanceRef.current = map;
          
          // Skjul alle Google Maps status-meldinger og tooltips
          const hideAllMapMessages = () => {
            // Global CSS style
            if (!document.getElementById('hide-map-messages')) {
              const globalStyle = document.createElement('style');
              globalStyle.id = 'hide-map-messages';
              globalStyle.textContent = `
                .gm-style .gm-style-cc,
                .gm-style .gmnoprint[style*="position: absolute"],
                .gm-style .gmnoprint[style*="z-index: 1000000"],
                .gm-bundled-control[style*="position: absolute"]:not(.gm-bundled-control-on-bottom),
                .gm-style div[jsaction*="wheel.capture"] div[style*="background"],
                .gm-style div[style*="Use Ctrl + scroll"],
                .gm-style div[style*="Use ⌘ + scroll"],
                .gm-style div[style*="border-radius: 2px"][style*="background"][style*="position: absolute"],
                .gm-style div[aria-live="polite"],
                .gm-style div[role="status"],
                .gm-style div[style*="position: absolute"][style*="bottom: 0px"],
                .gm-style div[style*="position: absolute"][style*="left: 0px"][style*="bottom"],
                .gm-style .gm-ui-hover-effect + div[style*="absolute"] {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                .gm-style .gm-style-mtc,
                .gm-style .gm-bundled-control {
                  display: block !important;
                  visibility: visible !important;
                }
              `;
              document.head.appendChild(globalStyle);
            }
            
            // Direkte DOM-manipulering
            const hideStatusElements = () => {
              // Finn alle elementer som kan inneholde status-meldinger
              const allDivs = document.querySelectorAll('#google-map-container *');
              allDivs.forEach(el => {
                const text = el.textContent?.toLowerCase() || '';
                const style = (el as HTMLElement).getAttribute('style') || '';
                
                if (
                  text.includes('stabilt') || 
                  text.includes('stable') || 
                  text.includes('status') ||
                  (style.includes('position: absolute') && style.includes('bottom') && !style.includes('width: 100%'))
                ) {
                  (el as HTMLElement).style.display = 'none';
                  (el as HTMLElement).style.visibility = 'hidden';
                  (el as HTMLElement).style.opacity = '0';
                  (el as HTMLElement).style.height = '0';
                  (el as HTMLElement).style.width = '0';
                  (el as HTMLElement).style.overflow = 'hidden';
                }
              });
            };
            
            hideStatusElements();
          };
          
          // Kjør umiddelbart og med intervals
          hideAllMapMessages();
          
          // Sett opp kontinuerlig overvåking
          const hideInterval = setInterval(hideAllMapMessages, 100);
          
          // Overvåk DOM-endringer
          const observer = new MutationObserver(() => {
            hideAllMapMessages();
          });
          observer.observe(mapRef.current, { 
            childList: true, 
            subtree: true,
            attributes: true,
            characterData: true
          });
          
          // Cleanup interval når komponenten unmountes
          const cleanup = () => {
            clearInterval(hideInterval);
            observer.disconnect();
          };
          
          // Lagre cleanup-funksjon
          (map as any)._cleanup = cleanup;
          
          console.log('✅ Google Maps instance created successfully');
          mapInstanceRef.current = map;
          
          // Initialize directions service and renderer
          directionsServiceRef.current = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true, // Vi lager egne start/slutt-markører
            polylineOptions: {
              strokeColor: '#3b82f6', // Blå farge som på det gamle kartet
              strokeWeight: 6, // Samme tykkelse som det gamle kartet  
              strokeOpacity: 0.8 // Samme opasitet som det gamle kartet
            }
          });
          
          directionsRendererRef.current.setMap(map);
          console.log('✅ Google Maps DirectionsService and DirectionsRenderer initialized');

          setIsMapInitialized(true);
          onLoadingChange(false);
          onMapLoad?.(map);
          
        } catch (mapInitError: any) {
          console.error('❌ Error creating Google Maps instance:', mapInitError);
          onError(`Kunne ikke initialisere Google Maps: ${mapInitError.message}`);
          onLoadingChange(false);
        }

      } catch (err) {
        console.error('❌ Feil ved initialisering av Google Maps:', err);
        onError('Kunne ikke laste Google Maps. Sjekk internetforbindelsen.');
        onLoadingChange(false);
      }
    };

    initializeMap();
  }, []);

  // Hjelpefunksjon for å sjekke om stasjon er nær ruten
  const isStationNearRoute = useCallback((station: ChargingStation): boolean => {
    if (!calculatedRoute || !window.google?.maps?.geometry) {
      return false;
    }
    
    const stationPos = new google.maps.LatLng(station.latitude, station.longitude);
    const route = calculatedRoute.routes[0];
    
    // Sjekk om stasjonen er innenfor 5km fra rutelinjen
    let minDistance = Infinity;
    
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        // Sjekk mange punkter langs hvert steg av ruten for meget nøyaktig avstand
        const path = step.path || [];
        
        if (path && path.length > 0) {
          // Bruk den faktiske rutegeometrien hvis tilgjengelig
          path.forEach(point => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, point);
            minDistance = Math.min(minDistance, distance);
          });
        } else {
          // Fallback: sjekk 20 punkter langs segmentet
          const stepStart = step.start_location;
          const stepEnd = step.end_location;
          
          for (let i = 0; i <= 20; i++) {
            const ratio = i / 20;
            const lat = stepStart.lat() + (stepEnd.lat() - stepStart.lat()) * ratio;
            const lng = stepStart.lng() + (stepEnd.lng() - stepStart.lng()) * ratio;
            const routePoint = new google.maps.LatLng(lat, lng);
            
            const distance = google.maps.geometry.spherical.computeDistanceBetween(stationPos, routePoint);
            minDistance = Math.min(minDistance, distance);
          }
        }
      });
    });
    
    const isNear = minDistance <= 5000; // 5km grense
    return isNear;
  }, [calculatedRoute]);

  // Hjelpefunksjon for å finne de beste anbefalte ladestasjonene med avansert optimalisering
  const getOptimizedChargingPlan = useCallback((): OptimizedChargingPlan[] => {
    if (!calculatedRoute || !selectedCar || !routeData || !chargingStations) {
      return [];
    }

    // Få total rutedistanse fra Google Maps
    const totalDistance = calculatedRoute.routes[0].legs.reduce((sum, leg) => {
      return sum + (leg.distance?.value || 0);
    }, 0) / 1000; // Konverter til km

    // Hent værdata (kan utvides senere med faktisk API-kall)
    const mockWeatherData = {
      temperature: 5, // 5°C
      windSpeed: 8, // 8 m/s
      precipitation: 0, // Ingen nedbør
      humidity: 70,
      conditions: 'cloudy'
    };

    // Bruk RouteOptimizer for avansert beregning
    const optimizedPlan = RouteOptimizer.calculateOptimalChargingPlan(
      selectedCar,
      routeData,
      chargingStations,
      mockWeatherData,
      totalDistance
    );

    // Filtrer bare stasjoner som er nær ruten (men IKKE filtrer på posisjon ennå)
    const filteredPlan = optimizedPlan.filter(plan => {
      const isNearRoute = isStationNearRoute(plan.station);
      console.log(`🔍 Stasjon ${plan.station.name}: nær rute=${isNearRoute}, avstand=${plan.distanceFromStart.toFixed(0)}km, batteri=${plan.batteryLevelOnArrival.toFixed(1)}%`);
      return isNearRoute; // Kun filtrer på nærhet til rute
    });

    console.log(`🎯 Optimal ladeplan: ${filteredPlan.length} stasjoner langs ruten`);
    filteredPlan.forEach(plan => {
      console.log(`  📍 ${plan.station.name} - ${plan.distanceFromStart.toFixed(0)}km fra start`);
    });

    return filteredPlan;
  }, [calculatedRoute, selectedCar, routeData, chargingStations, isStationNearRoute]);

  // Hjelpefunksjon for å sjekke om stasjon er anbefalt for lading
  const isRecommendedStation = useCallback((station: ChargingStation): boolean => {
    const optimizedPlan = getOptimizedChargingPlan();
    return optimizedPlan.some(plan => plan.station.id === station.id);
  }, [getOptimizedChargingPlan]);

  // Add charging station markers - update when route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !chargingStations || chargingStations.length === 0) {
      return;
    }

    console.log(`🔌 Legger til ${chargingStations.length} ladestasjoner på kartet`);

    // Clear existing charging station markers
    chargingStationMarkersRef.current.forEach(marker => marker.setMap(null));
    chargingStationMarkersRef.current = [];

    // Add new charging station markers
    chargingStations.forEach(station => {
      // Sjekk kategorier for markør-type
      const isRecommended = isRecommendedStation(station);
      const isNearRoute = !isRecommended && calculatedRoute && isStationNearRoute(station);
      
      
      const markerIcon = isRecommended ? {
        // Blå markører for anbefalte ladestasjoner (basert på batteriprosent)
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="#0066ff" stroke="#004499" stroke-width="1"/>
            <text x="10" y="14" text-anchor="middle" fill="white" font-size="11" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(20, 20),
        anchor: new google.maps.Point(10, 10)
      } : isNearRoute ? {
        // Røde markører for stasjoner nær ruten (som på det gamle kartet)
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
            <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">⚡</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 8)
      } : {
        // Grønne markører for stasjoner langt fra ruten (små som på det gamle kartet)
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" fill="#00ff41" stroke="#00cc33" stroke-width="1"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(8, 8),
        anchor: new google.maps.Point(4, 4)
      };

      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: mapInstanceRef.current!,
        title: `${station.name}\n${station.available}/${station.total} tilgjengelig\n${station.cost} kr/kWh${isRecommended ? '\n💙 ANBEFALT LADESTASJON' : isNearRoute ? '\n🔴 NÆR RUTEN' : '\n🟢 LANGT FRA RUTEN'}`,
        icon: markerIcon
      });

      // Legg til klikk-event for ladestasjon-markør
      marker.addListener('click', () => {
        const statusColor = station.available > 0 ? 'hsl(140 100% 50%)' : 'hsl(0 84% 60%)';
        const statusText = station.available > 0 ? 'TILGJENGELIG' : 'OPPTATT';
        const routeIndicator = isRecommended ? 'ANBEFALT LADESTASJON' : isNearRoute ? 'PÅ RUTEN' : 'LADESTASJON';
        const routeColor = isRecommended ? 'hsl(240 100% 60%)' : isNearRoute ? 'hsl(0 84% 60%)' : 'hsl(140 100% 50%)';
        
        const infoWindow = new google.maps.InfoWindow({
          maxWidth: 380,
          disableAutoPan: false,
          pixelOffset: new google.maps.Size(0, -10),
          content: `
            <style>
              .gm-style .gm-style-iw-c {
                background: transparent !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                padding: 0 !important;
                overflow: visible !important;
                max-height: none !important;
              }
              .gm-style .gm-style-iw-d {
                overflow: visible !important;
                max-height: none !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              .gm-style .gm-style-iw-d::-webkit-scrollbar {
                display: none !important;
              }
              .gm-style .gm-style-iw-tc {
                display: none !important;
              }
            </style>
            <div style="
              font-family: Inter, system-ui, sans-serif; 
              padding: 0; 
              line-height: 1.4; 
              width: 360px; 
              max-height: none;
              overflow: visible;
              background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(180 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
              border: 1px solid ${isNearRoute ? 'hsl(0 84% 60% / 0.5)' : 'hsl(140 100% 50% / 0.5)'};
              border-radius: 12px;
              box-shadow: 0 8px 32px ${isNearRoute ? 'hsl(0 84% 60% / 0.2)' : 'hsl(140 100% 50% / 0.2)'}, 0 0 0 1px ${isNearRoute ? 'hsl(0 84% 60% / 0.15)' : 'hsl(140 100% 50% / 0.15)'};
              backdrop-filter: blur(16px);
            ">
              <div style="
                background: linear-gradient(135deg, ${routeColor} 0%, ${isNearRoute ? 'hsl(320 100% 60%)' : 'hsl(120 100% 60%)'} 100%);
                color: hsl(225 25% 6%);
                padding: 16px;
                position: relative;
                overflow: hidden;
              ">
                <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  background: hsl(225 25% 6% / 0.3);
                  border: 1px solid hsl(225 25% 6% / 0.2);
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 700;
                  color: hsl(225 25% 6%);
                  z-index: 10;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: radial-gradient(circle at ${isNearRoute ? '20% 80%' : '70% 20%'}, ${isNearRoute ? 'hsl(320 100% 70% / 0.3)' : 'hsl(120 100% 70% / 0.3)'} 0%, transparent 50%);
                "></div>
                <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">${isRecommended ? '💙' : isNearRoute ? '🔴' : '⚡'} ${station.name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${station.address || station.location || 'Ukjent adresse'}</p>
                <div style="margin-top: 8px; position: relative; z-index: 1; display: flex; gap: 8px;">
                  <span style="
                    background: hsl(225 25% 6% / 0.2);
                    color: hsl(225 25% 6%);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid hsl(225 25% 6% / 0.1);
                  ">${routeIndicator}</span>
                  <span style="
                    background: ${statusColor}20;
                    color: hsl(225 25% 6%);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid ${statusColor}40;
                  ">${statusText}</span>
                </div>
              </div>
              <div style="padding: 16px; background: transparent;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                  <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">🔋 Tilgjengelighet</span>
                  <span style="font-weight: 600; font-size: 13px; color: ${station.available > 0 ? 'hsl(140 100% 80%)' : 'hsl(0 84% 70%)'};">${station.available}/${station.total} ledige</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                  <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">⚡ Ladeeffekt</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.power || 'Ikke oppgitt'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                  <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">💰 Kostnad</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.cost || 'Gratis'} kr/kWh</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(45 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(45 100% 50%);">
                  <span style="color: hsl(45 100% 80%); font-size: 13px; font-weight: 500;">🏢 Leverandør</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${station.provider || 'Ukjent'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(120 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(120 100% 50%);">
                  <span style="color: hsl(120 100% 80%); font-size: 13px; font-weight: 500;">🚀 Hurtiglader</span>
                  <span style="font-weight: 600; font-size: 13px; color: ${station.fast_charger ? 'hsl(140 100% 80%)' : 'hsl(0 84% 70%)'};">${station.fast_charger ? 'Ja' : 'Nei'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 8px; background: hsl(200 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(200 100% 50%);">
                  <span style="color: hsl(200 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                  <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}</span>
                </div>
                ${isNearRoute ? `
                <div style="
                  margin: 12px 0 0 0; 
                  padding: 12px; 
                  background: linear-gradient(135deg, hsl(0 84% 60% / 0.15) 0%, hsl(320 100% 50% / 0.15) 100%); 
                  border-radius: 8px; 
                  border: 1px solid hsl(0 84% 60% / 0.3);
                  position: relative;
                  overflow: hidden;
                ">
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 80% 20%, hsl(0 84% 60% / 0.1) 0%, transparent 70%);
                  "></div>
                  <p style="
                    margin: 0; 
                    color: hsl(0 84% 70%); 
                    font-weight: 700; 
                    font-size: 14px;
                    position: relative;
                    z-index: 1;
                  ">⚡ Denne ladestasjonen ligger strategisk langs ruten din!</p>
                </div>
                ` : ''}
              </div>
            </div>
          `
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      chargingStationMarkersRef.current.push(marker);
    });
  }, [chargingStations?.length, calculatedRoute, isStationNearRoute, getOptimizedChargingPlan]); // Oppdater når rute endres

  // Calculate route when trigger changes - ROBUST and FOOLPROOF
  const calculateRoute = useCallback(async () => {
    console.log('🔍 ROBUST ruteberegning startet');
    
    // Wait for map to be fully initialized
    let attempts = 0;
    const maxAttempts = 20;
    
    while ((!mapInstanceRef.current || !directionsServiceRef.current || !directionsRendererRef.current) && attempts < maxAttempts) {
      console.log(`⏳ Venter på kart initialisering (forsøk ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    // Final validation
    if (!mapInstanceRef.current || !directionsServiceRef.current || !directionsRendererRef.current || 
        !routeData.from || !routeData.to || !selectedCar || routeTrigger === 0) {
      console.log('⏸️ Requirements fortsatt ikke oppfylt etter venting:');
      console.log('📊 mapInstanceRef.current:', !!mapInstanceRef.current);
      console.log('📊 directionsServiceRef.current:', !!directionsServiceRef.current);
      console.log('📊 directionsRendererRef.current:', !!directionsRendererRef.current);
      console.log('📊 routeData.from:', routeData.from);
      console.log('📊 routeData.to:', routeData.to);
      console.log('📊 selectedCar:', !!selectedCar);
      console.log('📊 routeTrigger:', routeTrigger);
      return;
    }

    console.log('🚀 STARTER GOOGLE MAPS RUTEPLANLEGGING');
    console.log('📍 Fra:', routeData.from, 'Til:', routeData.to);
    onLoadingChange(true);
    onError(null);

    try {
      const request: google.maps.DirectionsRequest = {
        origin: routeData.from + ', Norge',
        destination: routeData.to + ', Norge',
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'NO',
        avoidHighways: false,
        avoidTolls: false,
      };

      if (routeData.via && routeData.via.trim()) {
        request.waypoints = [{
          location: routeData.via + ', Norge',
          stopover: true
        }];
      }

      console.log('📞 Sender Google Directions API-forespørsel...');
      
      // Create Promise wrapper for Directions API call with timeout
      const directionsPromise = new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('💥 Google Directions API TIMEOUT etter 20 sekunder');
          reject(new Error('API_TIMEOUT'));
        }, 20000);

        directionsServiceRef.current!.route(request, (result, status) => {
          clearTimeout(timeout);
          console.log('🗺️ Google Directions API respons:', status);
          
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(status));
          }
        });
      });

      const result = await directionsPromise;
      
      console.log('✅ Google Maps rute beregnet');
      console.log('🗺️ Setter rute på kartet med DirectionsRenderer...');
      
      // Sørg for at DirectionsRenderer er koblet til kartet
      if (directionsRendererRef.current && mapInstanceRef.current) {
        directionsRendererRef.current.setMap(mapInstanceRef.current);
        directionsRendererRef.current.setDirections(result);
        
        // Lag egne start og slutt-markører som på det gamle kartet
        const route = result.routes[0];
        const leg = route.legs[0];
        
        // Start-markør (grønn som på det gamle kartet)
        const startMarker = new google.maps.Marker({
          position: leg.start_location,
          map: mapInstanceRef.current,
          title: `Start: ${routeData.from}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
        
        // Legg til klikk-event for start-markør
        startMarker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            maxWidth: 350,
            disableAutoPan: false,
            pixelOffset: new google.maps.Size(0, -10),
            content: `
              <style>
                .gm-style .gm-style-iw-c {
                  background: transparent !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                .gm-style .gm-style-iw-d {
                  overflow: visible !important;
                  max-height: none !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .gm-style .gm-style-iw-d::-webkit-scrollbar {
                  display: none !important;
                }
                .gm-style .gm-style-iw-tc {
                  display: none !important;
                }
              </style>
              <div style="
                font-family: Inter, system-ui, sans-serif; 
                padding: 0; 
                line-height: 1.4; 
                width: 320px; 
                max-height: none;
                overflow: visible;
                background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(140 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
                border: 1px solid hsl(140 100% 50% / 0.4);
                border-radius: 12px;
                box-shadow: 0 8px 32px hsl(140 100% 50% / 0.2), 0 0 0 1px hsl(140 100% 50% / 0.15);
                backdrop-filter: blur(16px);
              ">
                <div style="
                  background: linear-gradient(135deg, hsl(140 100% 50%) 0%, hsl(120 100% 60%) 100%);
                  color: hsl(225 25% 6%);
                  padding: 16px;
                  position: relative;
                  overflow: hidden;
                ">
                  <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: hsl(225 25% 6% / 0.3);
                    border: 1px solid hsl(225 25% 6% / 0.2);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    color: hsl(225 25% 6%);
                    z-index: 10;
                    transition: all 0.2s ease;
                  " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 30% 20%, hsl(120 100% 70% / 0.3) 0%, transparent 50%);
                  "></div>
                  <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">🟢 STARTPUNKT</h4>
                  <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${routeData.from}</p>
                  <div style="margin-top: 8px; position: relative; z-index: 1;">
                    <span style="
                      background: hsl(225 25% 6% / 0.2);
                      color: hsl(225 25% 6%);
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: 600;
                      border: 1px solid hsl(225 25% 6% / 0.1);
                    ">RUTE START</span>
                  </div>
                </div>
                <div style="padding: 16px; background: transparent;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                    <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${leg.start_location.lat().toFixed(4)}, ${leg.start_location.lng().toFixed(4)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                    <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">📏 Total avstand</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.distance?.text || 'Beregner...'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                    <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">⏰ Estimert tid</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.duration?.text || 'Beregner...'}</span>
                  </div>
                </div>
              </div>
            `
          });
          infoWindow.open(mapInstanceRef.current, startMarker);
        });
        
        // Slutt-markør (rød som på det gamle kartet)
        const endMarker = new google.maps.Marker({
          position: leg.end_location,
          map: mapInstanceRef.current,
          title: `Slutt: ${routeData.to}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">M</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
        
        // Legg til klikk-event for slutt-markør
        endMarker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            maxWidth: 350,
            disableAutoPan: false,
            pixelOffset: new google.maps.Size(0, -10),
            content: `
              <style>
                .gm-style .gm-style-iw-c {
                  background: transparent !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                .gm-style .gm-style-iw-d {
                  overflow: visible !important;
                  max-height: none !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .gm-style .gm-style-iw-d::-webkit-scrollbar {
                  display: none !important;
                }
                .gm-style .gm-style-iw-tc {
                  display: none !important;
                }
              </style>
              <div style="
                font-family: Inter, system-ui, sans-serif; 
                padding: 0; 
                line-height: 1.4; 
                width: 320px; 
                max-height: none;
                overflow: visible;
                background: linear-gradient(135deg, hsl(225 25% 8% / 0.98) 0%, hsl(280 100% 8% / 0.95) 30%, hsl(225 25% 8% / 0.98) 100%);
                border: 1px solid hsl(280 100% 50% / 0.4);
                border-radius: 12px;
                box-shadow: 0 8px 32px hsl(280 100% 50% / 0.2), 0 0 0 1px hsl(280 100% 50% / 0.15);
                backdrop-filter: blur(16px);
              ">
                <div style="
                  background: linear-gradient(135deg, hsl(280 100% 50%) 0%, hsl(320 100% 60%) 100%);
                  color: hsl(225 25% 6%);
                  padding: 16px;
                  position: relative;
                  overflow: hidden;
                ">
                  <button onclick="this.closest('.gm-style-iw').parentNode.querySelector('.gm-ui-hover-effect').click()" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: hsl(225 25% 6% / 0.3);
                    border: 1px solid hsl(225 25% 6% / 0.2);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    color: hsl(225 25% 6%);
                    z-index: 10;
                    transition: all 0.2s ease;
                  " onmouseover="this.style.background='hsl(225 25% 6% / 0.5)'" onmouseout="this.style.background='hsl(225 25% 6% / 0.3)'">×</button>
                  <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 70% 20%, hsl(320 100% 70% / 0.3) 0%, transparent 50%);
                  "></div>
                  <h4 style="margin: 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1;">🔴 MÅLPUNKT</h4>
                  <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; position: relative; z-index: 1;">📍 ${routeData.to}</p>
                  <div style="margin-top: 8px; position: relative; z-index: 1;">
                    <span style="
                      background: hsl(225 25% 6% / 0.2);
                      color: hsl(225 25% 6%);
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: 600;
                      border: 1px solid hsl(225 25% 6% / 0.1);
                    ">DESTINASJON</span>
                  </div>
                </div>
                <div style="padding: 16px; background: transparent;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(280 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(280 100% 50%);">
                    <span style="color: hsl(280 100% 80%); font-size: 13px; font-weight: 500;">📍 Koordinater</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%); font-family: 'Courier New', monospace;">${leg.end_location.lat().toFixed(4)}, ${leg.end_location.lng().toFixed(4)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(180 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(180 100% 50%);">
                    <span style="color: hsl(180 100% 80%); font-size: 13px; font-weight: 500;">📏 Total avstand</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.distance?.text || 'Beregner...'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: hsl(140 100% 50% / 0.1); border-radius: 6px; border-left: 3px solid hsl(140 100% 50%);">
                    <span style="color: hsl(140 100% 80%); font-size: 13px; font-weight: 500;">⏰ Total tid</span>
                    <span style="font-weight: 600; font-size: 13px; color: hsl(210 15% 95%);">${leg.duration?.text || 'Beregner...'}</span>
                  </div>
                </div>
              </div>
            `
          });
          infoWindow.open(mapInstanceRef.current, endMarker);
        });
        
        // Lagre markørene for cleanup
        allMarkersRef.current.push(startMarker, endMarker);
        
        // Lagre den beregnede ruten for ladestasjon-filtrering
        setCalculatedRoute(result);
        
        console.log('🎯 Rute er satt på kartet - skal være synlig nå!');
      } else {
        console.error('❌ DirectionsRenderer eller kart ikke tilgjengelig');
      }
      
      // Extract route information
      const route = result.routes[0];
      let totalDistance = 0;
      let totalTime = 0;
      
      route.legs.forEach(leg => {
        totalDistance += leg.distance?.value || 0;
        totalTime += leg.duration?.value || 0;
      });
      
      // Convert to appropriate units
      const distanceKm = totalDistance / 1000;
      const timeMinutes = totalTime / 60;
      
      // Calculate battery usage based on car and distance
      const batteryUsagePercent = Math.min(100, (distanceKm / selectedCar.range) * 100);
      const remainingBattery = Math.max(0, routeData.batteryPercentage - batteryUsagePercent);
      
      // Estimate charging needs
      const needsCharging = remainingBattery < 20;
      const requiredStops = needsCharging ? Math.ceil(batteryUsagePercent / 60) : 0;
      
      // Create trip analysis
      const analysis: TripAnalysis = {
        totalDistance: distanceKm,
        totalTime: timeMinutes,
        totalChargingTime: requiredStops * 30,
        totalCost: requiredStops * 150,
        batteryUsage: batteryUsagePercent,
        requiredStops: requiredStops,
        weatherImpact: 'Normalt',
        routeEfficiency: distanceKm > 300 ? 'God' : 'Meget god',
      };

      onRouteCalculated(analysis);
      onLoadingChange(false);
      
      // Adjust map bounds to show entire route - men ikke hvis det overskriver ruten
      const bounds = new google.maps.LatLngBounds();
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
      });
      
      // Sett bounds med litt padding og etter en kort delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, 50);
        }
      }, 500);
      
      console.log('📊 Rute:', {
        distance: `${distanceKm.toFixed(0)} km`,
        time: `${Math.round(timeMinutes)} min`,
        batteryUsage: `${batteryUsagePercent.toFixed(0)}%`,
        stops: requiredStops
      });

    } catch (error: any) {
      console.error('❌ GOOGLE DIRECTIONS FEIL:', error);
      onLoadingChange(false);
      
      let errorMessage = 'Kunne ikke beregne rute';
      
      if (error.message === 'API_TIMEOUT') {
        errorMessage = 'Ruteberegning tok for lang tid. Google Maps svarer ikke.';
      } else {
        switch (error.message) {
          case google.maps.DirectionsStatus.NOT_FOUND:
            errorMessage = 'Fant ikke rute mellom destinasjonene';
            break;
          case google.maps.DirectionsStatus.ZERO_RESULTS:
            errorMessage = 'Ingen rute funnet. Sjekk destinasjonene.';
            break;
          case google.maps.DirectionsStatus.REQUEST_DENIED:
            errorMessage = 'API-nøkkelen mangler tilgang til Directions API.';
            break;
          case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
            errorMessage = 'For mange forespørsler til Google Maps. Vent litt.';
            break;
          default:
            errorMessage = `Rutefeil: ${error.message}`;
        }
      }
      
      onError(errorMessage);
    }
  }, [routeData.from, routeData.to, routeData.via, routeData.batteryPercentage, selectedCar, routeTrigger, onRouteCalculated, onLoadingChange, onError]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      <div 
        ref={mapRef} 
        id="google-map-container" 
        style={{ 
          width: '100%', 
          height: '500px',
          backgroundColor: '#f0f0f0',
          border: '2px solid #007bff',
          borderRadius: '8px',
          minHeight: '500px' // Ensure minimum height
        }} 
      />
      {/* Debug info overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        🗺️ Status: {isMapInitialized ? '✅ Kart stabilt' : '⏳ Laster...'}
      </div>
      
      {/* Custom Zoom Controls */}
      {mapInstanceRef.current && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000
        }}>
          <button
            onClick={() => {
              const currentZoom = mapInstanceRef.current?.getZoom() || 10;
              mapInstanceRef.current?.setZoom(currentZoom + 1);
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              const currentZoom = mapInstanceRef.current?.getZoom() || 10;
              mapInstanceRef.current?.setZoom(currentZoom - 1);
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            -
          </button>
        </div>
      )}
      {/* Loading overlay */}
      {!isMapInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(240, 240, 240, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#666',
          borderRadius: '8px',
          zIndex: 999
        }}>
          🔄 Laster Google Maps...
        </div>
      )}
    </div>
  );
};

export default GoogleRouteMap;