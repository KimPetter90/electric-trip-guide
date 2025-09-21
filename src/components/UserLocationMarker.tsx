import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface UserLocationMarkerProps {
  map: mapboxgl.Map | null;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    accuracy?: number;
  } | null;
  isVisible: boolean;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  map,
  location,
  isVisible
}) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const accuracyCircleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !location || !isVisible) {
      // Fjern eksisterende markør og sirkel hvis ikke synlig
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        if (map.getLayer(accuracyCircleRef.current)) {
          map.removeLayer(accuracyCircleRef.current);
        }
        if (map.getSource(accuracyCircleRef.current)) {
          map.removeSource(accuracyCircleRef.current);
        }
        accuracyCircleRef.current = null;
      }
      return;
    }

    const coordinates: [number, number] = [location.longitude, location.latitude];

    // Opprett brukerposisjonspil
    const createUserMarker = () => {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      
      // Pil som peker i kjøreretning
      const heading = location.heading || 0;
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: #4285f4;
        border: 3px solid white;
        border-radius: 50%;
        position: relative;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(${heading}deg);
      `;

      // Legg til pil-indikator for retning
      if (location.heading !== undefined) {
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 12px solid #4285f4;
          z-index: 1001;
        `;
        el.appendChild(arrow);
      }

      return el;
    };

    // Fjern gammel markør
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Legg til ny markør
    const userMarker = new mapboxgl.Marker(createUserMarker())
      .setLngLat(coordinates)
      .addTo(map);

    markerRef.current = userMarker;

    // Legg til nøyaktighetssirkel hvis accuracy er tilgjengelig
    if (location.accuracy && location.accuracy < 100) {
      const circleId = 'user-accuracy-circle';
      
      // Fjern gammel sirkel
      if (accuracyCircleRef.current) {
        if (map.getLayer(accuracyCircleRef.current)) {
          map.removeLayer(accuracyCircleRef.current);
        }
        if (map.getSource(accuracyCircleRef.current)) {
          map.removeSource(accuracyCircleRef.current);
        }
      }

      // Konverter accuracy (meter) til grader (omtrentlig)
      const radiusInDegrees = location.accuracy / 111320; // 1 grad ≈ 111320 meter

      map.addSource(circleId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          properties: {}
        }
      });

      map.addLayer({
        id: circleId,
        type: 'circle',
        source: circleId,
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, radiusInDegrees * 100000] // Juster skaleringen
            ],
            base: 2
          },
          'circle-color': '#4285f4',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#4285f4',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.3
        }
      });

      accuracyCircleRef.current = circleId;
    }

    console.log('📍 Brukerposisjon oppdatert:', {
      coordinates,
      heading: location.heading,
      accuracy: location.accuracy
    });

  }, [map, location, isVisible]);

  // Cleanup ved unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (accuracyCircleRef.current && map) {
        if (map.getLayer(accuracyCircleRef.current)) {
          map.removeLayer(accuracyCircleRef.current);
        }
        if (map.getSource(accuracyCircleRef.current)) {
          map.removeSource(accuracyCircleRef.current);
        }
      }
    };
  }, []);

  return null; // Denne komponenten rendrer ikke JSX
};