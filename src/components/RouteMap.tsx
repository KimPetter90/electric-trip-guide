import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder } from '@react-three/drei';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign, MapPin } from "lucide-react";
import * as THREE from 'three';

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface RouteData {
  from: string;
  to: string;
  trailerWeight: number;
  batteryPercentage: number;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  position: [number, number, number];
  chargeTime: number;
  chargeAmount: number;
  cost: number;
  fastCharger: boolean;
}

// 3D posisjoner for norske byer (x, y, z)
const cityPositions3D: Record<string, [number, number, number]> = {
  'oslo': [2, 0, -1],
  'bergen': [-3, 0, -1],
  'trondheim': [1, 0, 2],
  'stavanger': [-3, 0, -3],
  'tromsø': [1, 0, 5],
  'ålesund': [-2, 0, 1],
  'kristiansand': [-1, 0, -3],
  'drammen': [1.8, 0, -1.2],
  'fredrikstad': [2.2, 0, -1.5],
  'lillehammer': [1.5, 0, 0],
  'bodø': [0, 0, 4],
  'molde': [-1.5, 0, 1.2]
};

const mockChargingStations: ChargingStation[] = [
  {
    id: "1",
    name: "Circle K Gardermoen",
    location: "Jessheim",
    position: [2.2, 0.5, -0.5],
    chargeTime: 25,
    chargeAmount: 35,
    cost: 175,
    fastCharger: true
  },
  {
    id: "2",
    name: "Ionity Lillehammer",
    location: "Lillehammer", 
    position: [1.5, 0.5, 0],
    chargeTime: 30,
    chargeAmount: 45,
    cost: 225,
    fastCharger: true
  },
  {
    id: "3",
    name: "Mer Gol",
    location: "Gol",
    position: [0.5, 0.5, -0.8],
    chargeTime: 35,
    chargeAmount: 50,
    cost: 250,
    fastCharger: true
  }
];

// 3D Norge-form (forenklet)
function NorwayMap() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  // Forenklet Norge-form som extruded shape
  const norwayShape = new THREE.Shape();
  norwayShape.moveTo(0, -2);
  norwayShape.lineTo(2, -1);
  norwayShape.lineTo(3, 1);
  norwayShape.lineTo(2, 3);
  norwayShape.lineTo(1, 5);
  norwayShape.lineTo(0, 4);
  norwayShape.lineTo(-1, 3);
  norwayShape.lineTo(-2, 2);
  norwayShape.lineTo(-3, 0);
  norwayShape.lineTo(-3, -2);
  norwayShape.lineTo(-1, -3);
  norwayShape.lineTo(0, -2);

  return (
    <mesh ref={meshRef} position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
      <extrudeGeometry
        args={[
          norwayShape,
          {
            depth: 0.2,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.1,
            bevelThickness: 0.1,
          },
        ]}
      />
      <meshLambertMaterial color="#10b981" />
    </mesh>
  );
}

// Animerte bymarkører
function CityMarker({ position, label, isStart, isEnd }: { 
  position: [number, number, number]; 
  label: string; 
  isStart?: boolean; 
  isEnd?: boolean; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  const color = isStart ? '#10b981' : isEnd ? '#ef4444' : '#3b82f6';

  return (
    <group position={position}>
      <Cylinder ref={meshRef} args={[0.1, 0.1, 0.3]} position={[0, 0.15, 0]}>
        <meshLambertMaterial color={color} />
      </Cylinder>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label.toUpperCase()}
      </Text>
    </group>
  );
}

// Ladestasjon markører
function ChargingStationMarker({ station }: { station: ChargingStation }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime();
      meshRef.current.position.y = station.position[1] + Math.sin(state.clock.getElapsedTime() * 3) * 0.1;
    }
  });

  return (
    <group position={station.position}>
      <Box ref={meshRef} args={[0.15, 0.15, 0.15]}>
        <meshLambertMaterial color="#fbbf24" />
      </Box>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.1}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        ⚡{station.name.split(' ')[0]}
      </Text>
    </group>
  );
}

// Rutelinje i 3D
function RouteLine({ fromPos, toPos }: { 
  fromPos: [number, number, number]; 
  toPos: [number, number, number]; 
}) {
  const points = [
    new THREE.Vector3(...fromPos),
    new THREE.Vector3((fromPos[0] + toPos[0]) / 2, 1, (fromPos[2] + toPos[2]) / 2), // Midtpunkt høyere opp
    new THREE.Vector3(...toPos),
  ];

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.02, 8, false);

  return (
    <mesh geometry={tubeGeometry}>
      <meshLambertMaterial color="#3b82f6" />
    </mesh>
  );
}

// Hovedscene
function Scene({ routeData, selectedCar, tripInfo }: { 
  routeData: RouteData; 
  selectedCar: CarModel | null; 
  tripInfo: any; 
}) {
  const fromCity = routeData.from.toLowerCase().trim();
  const toCity = routeData.to.toLowerCase().trim();
  
  const fromPosition = cityPositions3D[fromCity];
  const toPosition = cityPositions3D[toCity];

  return (
    <>
      {/* Belysning */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#fbbf24" />

      {/* Norge kart */}
      <NorwayMap />

      {/* By-markører */}
      {fromPosition && (
        <CityMarker 
          position={fromPosition} 
          label={routeData.from} 
          isStart={true} 
        />
      )}
      {toPosition && (
        <CityMarker 
          position={toPosition} 
          label={routeData.to} 
          isEnd={true} 
        />
      )}

      {/* Rutelinje */}
      {fromPosition && toPosition && (
        <RouteLine fromPos={fromPosition} toPos={toPosition} />
      )}

      {/* Ladestasjoner - kun hvis nødvendig */}
      {tripInfo?.needsCharging && mockChargingStations.map((station) => (
        <ChargingStationMarker key={station.id} station={station} />
      ))}

      {/* Kamera kontroller */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

interface RouteMapProps {
  isVisible: boolean;
  routeData: RouteData;
  selectedCar: CarModel | null;
}

export default function RouteMap({ isVisible, routeData, selectedCar }: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Beregn reiseinformasjon
  const calculateTripInfo = () => {
    if (!selectedCar) return null;
    
    const baseDistance = 500;
    const extraConsumption = routeData.trailerWeight > 0 ? routeData.trailerWeight * 0.15 / 1000 : 0;
    const totalConsumption = selectedCar.consumption + extraConsumption;
    const maxRange = selectedCar.range * (routeData.batteryPercentage / 100);
    const needsCharging = baseDistance > maxRange;
    
    return {
      distance: baseDistance,
      consumption: totalConsumption,
      range: maxRange,
      needsCharging
    };
  };

  const tripInfo = calculateTripInfo();

  const fromCity = routeData.from.toLowerCase().trim();
  const toCity = routeData.to.toLowerCase().trim();
  const fromPosition = cityPositions3D[fromCity];
  const toPosition = cityPositions3D[toCity];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-glass-bg backdrop-blur-sm border-glass-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-electric rounded-full animate-pulse-neon"></div>
          3D Rutekart: {routeData.from || 'Start'} → {routeData.to || 'Destinasjon'}
        </h3>
        
        <div className="h-96 rounded-lg overflow-hidden border border-glass-border shadow-neon relative bg-gradient-to-b from-sky-400 to-blue-600">
          {!mapReady ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold">Laster 3D kart...</p>
              </div>
            </div>
          ) : (
            <Canvas camera={{ position: [0, 5, 8], fov: 60 }}>
              <Scene routeData={routeData} selectedCar={selectedCar} tripInfo={tripInfo} />
            </Canvas>
          )}

          {/* Kontroller overlay */}
          <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded text-xs">
            <div>🖱️ Dra for å rotere</div>
            <div>🎯 Scroll for zoom</div>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border-2 border-primary rounded-lg p-3 shadow-xl max-w-64">
            <div className="flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-gray-800">3D RUTEKART</span>
            </div>
            <div className="text-xs text-gray-700 mt-2 space-y-1 font-medium">
              {routeData.from && routeData.to ? (
                <>
                  <div>🚗 Rute: {routeData.from} → {routeData.to}</div>
                  {selectedCar && (
                    <div>🚙 Bil: {selectedCar.brand} {selectedCar.model}</div>
                  )}
                  {tripInfo && (
                    <>
                      <div>📏 Rekkevidde: {Math.round(tripInfo.range)} km</div>
                      {tripInfo.needsCharging && (
                        <div className="text-yellow-600 font-bold">⚡ LADING KREVES</div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-500">Skriv inn start og destinasjon</div>
              )}
            </div>
          </div>

          {/* Advarsler for manglende byer */}
          {routeData.from && !fromPosition && (
            <div className="absolute top-4 left-4 bg-red-100 border-2 border-red-500 rounded-lg p-2 text-sm font-bold text-red-700">
              ❌ By ikke funnet: {routeData.from}
            </div>
          )}
          {routeData.to && !toPosition && (
            <div className="absolute top-16 left-4 bg-red-100 border-2 border-red-500 rounded-lg p-2 text-sm font-bold text-red-700">
              ❌ By ikke funnet: {routeData.to}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500 opacity-80"></div>
              <span>3D Rute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-400"></div>
              <span>Ladestasjoner</span>
            </div>
          </div>
        </div>

        {/* Trip information */}
        {selectedCar && tripInfo && (
          <div className="mt-4 p-3 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Reiseinformasjon</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Forbruk:</span>
                <div className="font-semibold">{tripInfo.consumption.toFixed(1)} kWh/100km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Rekkevidde:</span>
                <div className="font-semibold">{Math.round(tripInfo.range)} km</div>
              </div>
              <div>
                <span className="text-muted-foreground">Batteri:</span>
                <div className="font-semibold">{routeData.batteryPercentage}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Henger:</span>
                <div className="font-semibold">{routeData.trailerWeight > 0 ? `${routeData.trailerWeight} kg` : 'Nei'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ladestasjoner - kun hvis nødvendig */}
        {tripInfo?.needsCharging && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Anbefalte ladestopp:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {mockChargingStations.map((station, index) => (
                <div key={station.id} className="bg-glass-bg backdrop-blur-sm rounded-lg p-3 border border-glass-border hover:bg-primary/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-yellow-400 text-yellow-900 flex items-center justify-center text-xs font-semibold">
                      ⚡
                    </div>
                    <h5 className="font-semibold text-xs">{station.name}</h5>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{station.location}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{station.chargeTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span>{station.chargeAmount} kWh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{station.cost} kr</span>
                    </div>
                  </div>
                  
                  {station.fastCharger && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      <Zap className="h-3 w-3 mr-1" />
                      Hurtig
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}