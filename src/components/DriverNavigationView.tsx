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
  
  console.log('🚗 DriverNavigationView AKTIV - viser førerperspektiv!');

  return (
    <div className="fixed inset-0 z-[999] bg-gradient-to-b from-sky-400 via-sky-300 to-gray-800 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Road Surface with Perspective */}
      <div className="absolute bottom-0 left-0 right-0 h-3/5">
        {/* Road */}
        <div 
          className="absolute bottom-0 w-full h-full bg-gray-700"
          style={{
            clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)'
          }}
        >
          {/* Center line dashes */}
          <div className="absolute inset-0 flex flex-col items-center justify-end">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="bg-yellow-300 mb-4"
                style={{
                  width: `${8 - i * 0.3}px`,
                  height: `${20 - i * 1}px`,
                  transform: `translateY(${roadOffset - i * 8}px)`,
                  opacity: Math.max(0.3, 1 - i * 0.05)
                }}
              />
            ))}
          </div>
          
          {/* Side lines */}
          <div 
            className="absolute top-0 bottom-0 bg-white opacity-80"
            style={{
              left: '35%',
              width: '2px',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }}
          />
          <div 
            className="absolute top-0 bottom-0 bg-white opacity-80"
            style={{
              right: '35%',
              width: '2px',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }}
          />
        </div>
        
        {/* Road shoulders */}
        <div className="absolute bottom-0 left-0 w-full h-full bg-green-600 opacity-40" />
      </div>

      {/* Horizon */}
      <div className="absolute top-2/5 left-0 right-0 h-px bg-white/50" />

      {/* Mock scenery */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute bg-gray-600 opacity-40 rounded-sm"
          style={{
            left: `${10 + i * 10 + Math.sin(i) * 20}%`,
            top: `${25 + Math.random() * 15}%`,
            width: `${15 + Math.random() * 25}px`,
            height: `${20 + Math.random() * 40}px`,
            transform: `perspective(100px) rotateX(${Math.random() * 10}deg)`
          }}
        />
      ))}

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Status Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Badge className="bg-green-600/90 text-white border-none">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-2" />
            GPS Aktiv
          </Badge>
          <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-lg font-mono">
            {new Date().toLocaleTimeString('no-NO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Large Navigation Instruction */}
        {nextTurn && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-600/95 text-white p-6 rounded-2xl shadow-2xl border-2 border-blue-400/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-6xl mb-3 font-bold">
                  {getDirectionIcon(nextTurn.direction)}
                </div>
                <div className="text-4xl font-bold mb-2">
                  {formatDistance(nextTurn.distance / 1000)}
                </div>
                <div className="text-2xl font-semibold mb-1">
                  {nextTurn.instruction}
                </div>
                {nextTurn.streetName && (
                  <div className="text-lg opacity-90">
                    på {nextTurn.streetName}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Dashboard */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/85 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="grid grid-cols-3 gap-8 text-center text-white mb-4">
              <div>
                <div className="text-5xl font-bold text-green-400 font-mono">
                  {Math.round(currentSpeed)}
                </div>
                <div className="text-lg opacity-80 font-semibold">km/t</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-400">
                  {formatDistance(remainingDistance)}
                </div>
                <div className="text-lg opacity-80 font-semibold">igjen</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-orange-400 font-mono">
                  {estimatedArrival}
                </div>
                <div className="text-lg opacity-80 font-semibold">ankomst</div>
              </div>
            </div>
            
            {/* Route Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: '35%' }}
              />
            </div>

            {/* Destination Info */}
            <div className="text-center text-white">
              <div className="text-2xl font-bold">{routeData?.to || 'Destinasjon'}</div>
              <div className="text-lg opacity-75">via E6 • {formatTime(remainingTime)}</div>
            </div>
          </div>
        </div>

        {/* Left side info panel */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="bg-black/70 text-white p-4 rounded-xl backdrop-blur-sm space-y-3 border border-white/20">
            <div className="text-center">
              <div className="text-xl font-bold">Neste sving</div>
              <div className="text-sm opacity-80">Hold til høyre</div>
            </div>
            <div className="text-center border-t border-white/20 pt-3">
              <div className="text-lg font-semibold">E6 Nord</div>
              <div className="text-xs opacity-80">Hovedvei</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Navigation Button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-2xl transition-all duration-200 pointer-events-auto text-lg font-bold border-2 border-red-400"
      >
        ✕ Avslutt
      </button>

      {/* Car Dashboard Bottom Edge Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
    </div>
  );
};