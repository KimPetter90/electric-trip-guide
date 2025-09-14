import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkConnection();

    const setupListener = async () => {
      const listener = await Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      });
      
      return () => {
        listener.remove();
      };
    };

    let cleanup: (() => void) | undefined;
    setupListener().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return isOnline;
}

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const getDeviceInfo = async () => {
      const info = await Device.getInfo();
      setDeviceInfo(info);
    };

    getDeviceInfo();
  }, []);

  return deviceInfo;
}

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (err) {
      setError('Kunne ikke hente posisjon. Sjekk GPS-tillatelser.');
      console.error('Geolocation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    error,
    loading,
    getCurrentPosition
  };
}