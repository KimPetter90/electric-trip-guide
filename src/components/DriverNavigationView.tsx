import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DriverNavigationViewProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  };
  routeData?: {
    from: string;
    to: string;
  };
  isActive: boolean;
  onExit: () => void;
  nextTurn?: {
    direction: 'left' | 'right' | 'straight' | 'u-turn';
    distance: number;
    instruction: string;
    streetName?: string;
  };
  remainingDistance?: number;
  remainingTime?: number;
  estimatedArrival?: string;
  currentSpeed?: number;
}

export const DriverNavigationView: React.FC<DriverNavigationViewProps> = ({
  userLocation,
  routeData,
  isActive,
  onExit,
  nextTurn,
  remainingDistance = 12.5,
  remainingTime = 15,
  estimatedArrival = '15:42',
  currentSpeed = 54
}) => {
  const [roadOffset, setRoadOffset] = useState(0);

  // Animate road markings
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setRoadOffset(prev => (prev + 2) % 60);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isActive]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'left': return '←';
      case 'right': return '→';
      case 'u-turn': return '↻';
      default: return '↑';
    }
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}t ${mins}min`;
    }
    return `${mins}min`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-gray-100 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Map Background - Google Maps style */}
      <div className="absolute inset-0 bg-gray-200">
        {/* Street grid pattern */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
          {/* Background streets */}
          <defs>
            <pattern id="streets" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="#f5f5f5"/>
              <line x1="0" y1="40" x2="80" y2="40" stroke="#e5e5e5" strokeWidth="1"/>
              <line x1="40" y1="0" x2="40" y2="80" stroke="#e5e5e5" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streets)"/>
          
          {/* Main route - blue line */}
          <polyline
            points="100,500 200,400 400,350 600,300 700,250"
            fill="none"
            stroke="#4285f4"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Some buildings */}
          <rect x="150" y="250" width="60" height="40" fill="#ddd" opacity="0.7"/>
          <rect x="250" y="200" width="80" height="60" fill="#ddd" opacity="0.7"/>
          <rect x="450" y="180" width="70" height="50" fill="#ddd" opacity="0.7"/>
          <rect x="580" y="150" width="90" height="70" fill="#ddd" opacity="0.7"/>
          
          {/* Green areas */}
          <circle cx="320" cy="400" r="30" fill="#34d399" opacity="0.3"/>
          <circle cx="520" cy="250" r="25" fill="#34d399" opacity="0.3"/>
        </svg>
        
        {/* Current location - blue arrow */}
        <div className="absolute" style={{ left: '45%', top: '60%', transform: 'translate(-50%, -50%)' }}>
          <div className="relative">
            {/* Outer circle */}
            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-500">
              {/* Blue arrow */}
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="text-white text-xs font-bold">▲</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time and status bar - top left */}
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <div className="text-2xl font-bold text-black">
          {new Date().toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <span className="text-sm font-medium">5G</span>
        </div>
      </div>

      {/* Green instruction panel - Optimized for cars */}
      {nextTurn && (
        <div className="absolute top-12 left-6 right-6">
          <div className="bg-green-600 text-white p-6 rounded-2xl shadow-2xl flex items-center space-x-6 min-h-[100px]">
            {/* Large white arrow icon - easier to see while driving */}
            <div className="bg-white text-green-600 w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg">
              {nextTurn.direction === 'right' ? '↱' : 
               nextTurn.direction === 'left' ? '↰' : 
               nextTurn.direction === 'u-turn' ? '↻' : '↑'}
            </div>
            <div className="flex-1">
              <div className="text-4xl font-bold mb-2">
                {formatDistance(nextTurn.distance / 1000)}
              </div>
              <div className="text-2xl font-medium">
                {nextTurn.streetName || nextTurn.instruction || 'Hovedveien'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* White bottom info panel - Car optimized */}
      <div className="absolute bottom-6 left-6 right-20">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-200">
          <div className="flex justify-between items-center text-black">
            <div className="text-center flex-1">
              <div className="text-3xl font-bold">{estimatedArrival}</div>
              <div className="text-lg text-gray-600 font-medium">ankomst</div>
            </div>
            <div className="text-center flex-1 border-x border-gray-300 mx-4">
              <div className="text-3xl font-bold text-green-600">{Math.round(remainingTime)}</div>
              <div className="text-lg text-gray-600 font-medium">min</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-3xl font-bold">{formatDistance(remainingDistance)}</div>
              <div className="text-lg text-gray-600 font-medium">km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Side controls - Car optimized */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 space-y-4">
        {/* Speed limit sign - larger for visibility */}
        <div className="w-16 h-16 bg-white rounded-full border-4 border-red-500 flex items-center justify-center shadow-2xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">30</div>
          </div>
        </div>
        
        {/* Other controls - larger touch targets */}
        <button className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-gray-50 transition-colors">
          <div className="text-2xl">🔄</div>
        </button>
        
        <button className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-gray-50 transition-colors">
          <div className="text-2xl">🔇</div>
        </button>
      </div>

      {/* Exit button - Car optimized */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 z-50 w-14 h-14 bg-white hover:bg-gray-100 text-black rounded-2xl shadow-2xl transition-all duration-200 pointer-events-auto flex items-center justify-center text-xl font-bold border-2 border-gray-200"
      >
        ✕
      </button>
    </div>
  );
};