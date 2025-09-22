import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';

interface DriverPerspectiveProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  route?: Array<{lat: number, lng: number}>;
  isActive: boolean;
}

// 3D Road component
function Road({ route, userPosition }: { route: Array<{lat: number, lng: number}>, userPosition: number }) {
  const roadRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (roadRef.current) {
      // Move road segments based on user progress
      roadRef.current.position.z = userPosition * 0.1;
    }
  });

  return (
    <group ref={roadRef}>
      {/* Road surface */}
      <Plane args={[8, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#333333" />
      </Plane>
      
      {/* Road markings */}
      {Array.from({ length: 20 }, (_, i) => (
        <Box
          key={i}
          args={[0.2, 0.01, 2]}
          position={[0, 0, -i * 10]}
        >
          <meshStandardMaterial color="#FFFF00" />
        </Box>
      ))}
      
      {/* Side barriers */}
      <Box args={[0.2, 0.5, 200]} position={[4, 0.25, 0]}>
        <meshStandardMaterial color="#CCCCCC" />
      </Box>
      <Box args={[0.2, 0.5, 200]} position={[-4, 0.25, 0]}>
        <meshStandardMaterial color="#CCCCCC" />
      </Box>
    </group>
  );
}

// Car dashboard
function Dashboard({ speed, nextTurn }: { speed: number, nextTurn?: string }) {
  return (
    <group position={[0, -2, -1]}>
      {/* Dashboard background */}
      <Box args={[6, 1, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#111111" />
      </Box>
      
      {/* Speed display */}
      <Text
        position={[-2, 0, 0.1]}
        fontSize={0.3}
        color="#00FF00"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(speed)} km/t
      </Text>
      
      {/* Next turn */}
      {nextTurn && (
        <Text
          position={[2, 0, 0.1]}
          fontSize={0.2}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {nextTurn}
        </Text>
      )}
    </group>
  );
}

// Main 3D scene
function DriveScene({ userLocation, route }: { userLocation?: any, route?: any }) {
  const [userPosition, setUserPosition] = useState(0);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame(({ camera }) => {
    // Simulate forward movement
    setUserPosition(prev => prev + 0.1);
    
    // Driver perspective - very low angle, looking forward
    camera.position.set(0, 0.5, 2); // Low height like sitting in car
    camera.rotation.set(-0.1, 0, 0); // Slight downward angle
    camera.lookAt(0, 0, -10); // Looking ahead down the road
  });

  const mockRoute = route || Array.from({ length: 100 }, (_, i) => ({
    lat: 60.472 + i * 0.001,
    lng: 8.4689 + i * 0.001
  }));

  const speed = userLocation?.speed ? userLocation.speed * 3.6 : 65;

  return (
    <>
      {/* Lighting for realistic road */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, 5]} intensity={0.5} />
      
      {/* The road */}
      <Road route={mockRoute} userPosition={userPosition} />
      
      {/* Dashboard */}
      <Dashboard speed={speed} nextTurn="Sving høyre om 500m" />
      
      {/* Sky */}
      <Box args={[200, 200, 200]} position={[0, 100, 0]}>
        <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
      </Box>
    </>
  );
}

export const DriverPerspective: React.FC<DriverPerspectiveProps> = ({
  userLocation,
  route,
  isActive
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [0, 0.5, 2], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <DriveScene userLocation={userLocation} route={route} />
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top status bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white">
          <div className="bg-black/50 px-3 py-2 rounded">
            GPS: {userLocation ? 'Aktiv' : 'Søker...'}
          </div>
          <div className="bg-black/50 px-3 py-2 rounded">
            {new Date().toLocaleTimeString('no-NO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        {/* Navigation instructions */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-white text-center">
          <div className="bg-blue-600/90 px-6 py-4 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">↱</div>
            <div className="text-xl font-semibold">500m</div>
            <div className="text-lg">Sving til høyre</div>
            <div className="text-sm opacity-80">på Kongens gate</div>
          </div>
        </div>
        
        {/* Bottom navigation info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/70 rounded-lg p-4 text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{Math.round((userLocation?.speed || 0) * 3.6)}</div>
                <div className="text-sm opacity-80">km/t</div>
              </div>
              <div>
                <div className="text-2xl font-bold">12.5</div>
                <div className="text-sm opacity-80">km igjen</div>
              </div>
              <div>
                <div className="text-2xl font-bold">15:42</div>
                <div className="text-sm opacity-80">ETA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit button */}
      <div className="absolute top-4 right-4 z-60">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('exitDriverView'))}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          Avslutt
        </button>
      </div>
    </div>
  );
};