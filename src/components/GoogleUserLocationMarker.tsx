import React, { useEffect, useRef } from 'react';

interface GoogleUserLocationMarkerProps {
  map: google.maps.Map | null;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    accuracy?: number;
  } | null;
  isVisible: boolean;
}

export const GoogleUserLocationMarker: React.FC<GoogleUserLocationMarkerProps> = ({
  map,
  location,
  isVisible
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    console.log('🔍 GoogleUserLocationMarker useEffect:', { 
      hasMap: !!map, 
      hasLocation: !!location, 
      isVisible, 
      location 
    });
    
    if (!map || !location || !isVisible) {
      console.log('❌ Mangler requirements for brukermarkør');
      // Fjern eksisterende markør og sirkel hvis ikke synlig
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
        console.log('🗑️ Fjernet brukermarkør');
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = null;
      }
      return;
    }

    const position = new google.maps.LatLng(location.latitude, location.longitude);

    // Opprett brukerposisjonspil
    const createUserIcon = () => {
      const heading = location.heading || 0;
      
      // Større og mer synlig SVG-pil som peker i kjøreretning
      const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
            </filter>
          </defs>
          <g transform="rotate(${heading} 20 20)">
            <!-- Outer circle -->
            <circle cx="20" cy="20" r="15" fill="#1E88E5" stroke="white" stroke-width="4" filter="url(#shadow)"/>
            <!-- Direction arrow -->
            <path d="M20 8 L26 22 L20 18 L14 22 Z" fill="white" stroke="white" stroke-width="1"/>
            <!-- Center dot -->
            <circle cx="20" cy="20" r="3" fill="white"/>
          </g>
        </svg>
      `;

      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        size: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
        scaledSize: new google.maps.Size(40, 40)
      };
    };

    // Fjern gammel markør
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Legg til ny markør
    const userMarker = new google.maps.Marker({
      position: position,
      map: map,
      icon: createUserIcon(),
      title: 'Din posisjon',
      zIndex: 10000, // Høy z-index for å være over andre markører
      optimized: false // Bedre for SVG-ikoner
    });

    markerRef.current = userMarker;
    
    // Sentrér kartet på brukerposisjonen første gang
    if (!markerRef.current || Math.abs(map.getCenter()!.lat() - location.latitude) > 0.01) {
      map.panTo(position);
      console.log('🎯 Sentrerte kart på brukerposisjon');
    }

    // Legg til nøyaktighetssirkel hvis accuracy er tilgjengelig
    if (location.accuracy && location.accuracy < 100) {
      // Fjern gammel sirkel
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }

      const accuracyCircle = new google.maps.Circle({
        center: position,
        radius: location.accuracy, // accuracy er i meter
        map: map,
        fillColor: '#4285f4',
        fillOpacity: 0.1,
        strokeColor: '#4285f4',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        zIndex: 100
      });

      accuracyCircleRef.current = accuracyCircle;
    }

    console.log('📍 Google Maps brukerposisjon oppdatert:', {
      position: { lat: location.latitude, lng: location.longitude },
      heading: location.heading,
      accuracy: location.accuracy,
      markerCreated: !!userMarker
    });

  }, [map, location, isVisible]);

  // Cleanup ved unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }
    };
  }, []);

  return null; // Denne komponenten rendrer ikke JSX
};