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
    if (!map || !location || !isVisible) {
      // Fjern eksisterende markør og sirkel hvis ikke synlig
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
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
      
      // SVG-pil som peker i kjøreretning
      const svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          <g transform="rotate(${heading} 16 16)">
            <!-- Outer circle -->
            <circle cx="16" cy="16" r="12" fill="#4285f4" stroke="white" stroke-width="3" filter="url(#shadow)"/>
            <!-- Direction arrow -->
            <path d="M16 6 L22 18 L16 15 L10 18 Z" fill="white"/>
          </g>
        </svg>
      `;

      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        size: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
        scaledSize: new google.maps.Size(32, 32)
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
      zIndex: 1000
    });

    markerRef.current = userMarker;

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
      accuracy: location.accuracy
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