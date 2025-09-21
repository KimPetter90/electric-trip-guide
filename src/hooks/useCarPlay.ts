import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface CarPlayStatus {
  isConnected: boolean;
  isSupported: boolean;
}

export const useCarPlay = () => {
  const [carPlayStatus, setCarPlayStatus] = useState<CarPlayStatus>({
    isConnected: false,
    isSupported: false
  });

  useEffect(() => {
    // Check if running on iOS
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    if (isIOS) {
      setCarPlayStatus(prev => ({ ...prev, isSupported: true }));
      
      // Listen for CarPlay connection events
      const checkCarPlayConnection = () => {
        // This would typically use a CarPlay plugin to detect connection
        // For now, we'll simulate the detection
        setCarPlayStatus(prev => ({ ...prev, isConnected: false }));
      };

      checkCarPlayConnection();
    }
  }, []);

  const optimizeForCarPlay = () => {
    if (carPlayStatus.isConnected) {
      // Optimize UI for CarPlay display
      document.body.classList.add('carplay-mode');
    } else {
      document.body.classList.remove('carplay-mode');
    }
  };

  useEffect(() => {
    optimizeForCarPlay();
  }, [carPlayStatus.isConnected]);

  return {
    ...carPlayStatus,
    optimizeForCarPlay
  };
};