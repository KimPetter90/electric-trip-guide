import { useEffect, useRef } from 'react';

interface ChargingStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fastCharger: boolean;
  cost: number;
  location: string;
}

interface RequiredStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  requiredStop: boolean;
  location: string;
  chargeTime: number;
  chargeAmount: number;
  cost: number;
}

export const useChargingStationMarkers = (
  map: google.maps.Map | null,
  chargingStations: ChargingStation[],
  requiredStations: RequiredStation[],
  batteryPercentage: number
) => {
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Clear all markers
  const clearMarkers = () => {
    console.log('🧹 Rydder alle ladestasjonsmarkører...');
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Add all charging stations as green markers
  useEffect(() => {
    if (!map || chargingStations.length === 0) return;

    clearMarkers();
    console.log(`🟢 STARTER: Legger til ${chargingStations.length} GRØNNE ladestasjoner...`);

    const newMarkers: google.maps.Marker[] = [];

    // Add all stations as GREEN markers first
    chargingStations.forEach((station, index) => {
      const marker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: map,
        title: station.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: station.fastCharger ? 8 : 6,
          fillColor: "#00ff41", // NEON GRØNN
          fillOpacity: 1.0,
          strokeColor: "#ffffff",
          strokeWeight: 2
        },
        zIndex: 1
      });

      // Log første 5 for debugging
      if (index < 5) {
        console.log(`✅ GRØNN MARKØR ${index + 1}: ${station.name} på (${station.lat}, ${station.lng})`);
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #00aa33;">${station.name}</h3>
            <p style="margin: 4px 0;"><strong>📍 Lokasjon:</strong> ${station.location}</p>
            <p style="margin: 4px 0;"><strong>⚡ Type:</strong> ${station.fastCharger ? 'Hurtiglader' : 'Standard lader'}</p>
            <p style="margin: 4px 0;"><strong>💰 Pris:</strong> ${station.cost} kr/kWh</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
    console.log(`✅ FERDIG: ${newMarkers.length} grønne ladestasjonsmarkører lagt til`);
  }, [map, chargingStations]);

  // Add required stations as special markers on top
  useEffect(() => {
    if (!map || requiredStations.length === 0) return;

    console.log(`🔴 Legger til ${requiredStations.length} rutestasjoner...`);
    const isCriticalBattery = batteryPercentage <= 10;

    requiredStations.forEach((station, index) => {
      // Kun obligatoriske stasjoner blir røde når batteriet er kritisk
      let markerColor = '#3b82f6'; // Blå for anbefalte
      if (station.requiredStop && isCriticalBattery) {
        markerColor = '#ff0000'; // Rød for obligatoriske ved kritisk batteri
        console.log(`🚨 RØD MARKØR: ${station.name} (obligatorisk + kritisk batteri)`);
      } else if (station.requiredStop) {
        markerColor = '#ef4444'; // Mørk rød for obligatoriske
        console.log(`🟠 OBLIGATORISK: ${station.name} (obligatorisk men ikke kritisk)`);
      } else {
        console.log(`🔵 ANBEFALT: ${station.name} (anbefalt)`);
      }

      const routeMarker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: map,
        title: `${station.requiredStop ? 'OBLIGATORISK' : 'ANBEFALT'}: ${station.name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 4
        },
        zIndex: 1000 // Øverst
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: ${markerColor};">
              ${station.requiredStop ? '⚠️ OBLIGATORISK' : '🔄 ANBEFALT'} ${station.name}
            </h3>
            <p style="margin: 4px 0;"><strong>📍 Lokasjon:</strong> ${station.location}</p>
            <p style="margin: 4px 0;"><strong>🛣️ Ladetid:</strong> ${station.chargeTime} min</p>
            <p style="margin: 4px 0;"><strong>⚡ Energi:</strong> ${station.chargeAmount} kWh</p>
            <p style="margin: 4px 0;"><strong>💰 Kostnad:</strong> ${station.cost} kr</p>
          </div>
        `
      });

      routeMarker.addListener('click', () => {
        infoWindow.open(map, routeMarker);
      });

      markersRef.current.push(routeMarker);
    });
  }, [map, requiredStations, batteryPercentage]);

  // Cleanup function
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  return { clearMarkers };
};