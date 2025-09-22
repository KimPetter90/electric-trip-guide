import React from 'react';

interface FirstPersonNavigationProps {
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
}

export const FirstPersonNavigation: React.FC<FirstPersonNavigationProps> = ({
  userLocation,
  routeData,
  isActive,
  onExit
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Mock road view with simple graphics */}
      <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-sky-400 to-gray-800">
        {/* Road surface */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-700">
          {/* Road markings */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute bg-yellow-300 w-2 h-12 left-1/2 transform -translate-x-1/2 animate-pulse"
                style={{
                  bottom: `${i * 30}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Side lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-white opacity-80" />
          <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-white opacity-80" />
        </div>
        
        {/* Horizon */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
        
        {/* Mock buildings/scenery */}
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="absolute bg-gray-600 opacity-60"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${30 + Math.random() * 20}%`,
              width: `${20 + Math.random() * 40}px`,
              height: `${30 + Math.random() * 60}px`,
            }}
          />
        ))}
      </div>
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top status bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-shadow">
          <div className="bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              GPS Aktiv
            </div>
          </div>
          <div className="bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm">
            {new Date().toLocaleTimeString('no-NO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        {/* Large navigation instruction - center top */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-white">
          <div className="bg-blue-600/95 px-8 py-6 rounded-xl shadow-2xl backdrop-blur-sm border border-blue-400/50">
            <div className="text-center">
              <div className="text-5xl mb-3">↱</div>
              <div className="text-3xl font-bold mb-2">500m</div>
              <div className="text-xl font-semibold">Sving til høyre</div>
              <div className="text-lg opacity-90">på Kongens gate</div>
            </div>
          </div>
        </div>
        
        {/* Speed and progress - bottom */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/80 rounded-xl p-6 backdrop-blur-sm border border-white/20">
            <div className="grid grid-cols-3 gap-6 text-center text-white">
              <div>
                <div className="text-4xl font-bold text-green-400">
                  {Math.round((userLocation?.speed || 0) * 3.6)}
                </div>
                <div className="text-sm opacity-80 mt-1">km/t</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">12.5</div>
                <div className="text-sm opacity-80 mt-1">km igjen</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-400">15:42</div>
                <div className="text-sm opacity-80 mt-1">ankomst</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: '35%' }} />
            </div>
          </div>
        </div>

        {/* Additional info - left side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white">
          <div className="bg-black/70 p-4 rounded-lg backdrop-blur-sm space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{routeData?.to || 'Destinasjon'}</div>
              <div className="text-sm opacity-80">via E6</div>
            </div>
            <div className="text-center border-t border-white/20 pt-3">
              <div className="text-lg font-semibold">12 min</div>
              <div className="text-xs opacity-80">raskeste rute</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit button - top right */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-60 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors pointer-events-auto text-lg font-semibold"
      >
        Avslutt kjøring
      </button>
      
      {/* Car dashboard effect */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};