import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  MapPin, 
  Calendar, 
  Heart,
  Download,
  Wifi,
  WifiOff,
  Navigation
} from "lucide-react";
import { offlineStorage, SavedRoute } from "@/utils/offlineStorage";
import { CarModel } from "@/components/CarSelector";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus, useGeolocation } from "@/hooks/useNativeCapabilities";

interface OfflineManagerProps {
  selectedCar: CarModel | null;
  routeData: any;
}

export default function OfflineManager({ selectedCar, routeData }: OfflineManagerProps) {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [favoriteCars, setFavoriteCars] = useState<CarModel[]>([]);
  const [routeName, setRouteName] = useState("");
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const { location, loading: gpsLoading, getCurrentPosition } = useGeolocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const routes = await offlineStorage.getSavedRoutes();
    const cars = await offlineStorage.getFavoriteCars();
    setSavedRoutes(routes);
    setFavoriteCars(cars);
  };

  const saveCurrentRoute = async () => {
    if (!selectedCar || !routeData.from || !routeData.to) {
      toast({
        title: "Ufullstendig rute",
        description: "Velg bil og fyll inn rute før lagring",
        variant: "destructive"
      });
      return;
    }

    const name = routeName || `${routeData.from} → ${routeData.to}`;
    
    await offlineStorage.saveRoute({
      name,
      from: routeData.from,
      to: routeData.to,
      car: selectedCar,
      batteryPercentage: routeData.batteryPercentage,
      trailerWeight: routeData.trailerWeight
    });

    await offlineStorage.logUsage('save_route', { name, car: selectedCar.brand });
    
    setRouteName("");
    loadData();
    
    toast({
      title: "Rute lagret!",
      description: `"${name}" er nå tilgjengelig offline`
    });
  };

  const deleteRoute = async (routeId: string) => {
    await offlineStorage.deleteRoute(routeId);
    await offlineStorage.logUsage('delete_route');
    loadData();
    
    toast({
      title: "Rute slettet",
      description: "Ruten er fjernet fra lagrede ruter"
    });
  };

  const toggleFavoriteCar = async (car: CarModel) => {
    const isFavorite = favoriteCars.find(fav => fav.id === car.id);
    
    if (isFavorite) {
      await offlineStorage.removeFavoriteCar(car.id);
      await offlineStorage.logUsage('remove_favorite_car', { car: car.brand });
    } else {
      await offlineStorage.addFavoriteCar(car);
      await offlineStorage.logUsage('add_favorite_car', { car: car.brand });
    }
    
    loadData();
    
    toast({
      title: isFavorite ? "Fjernet fra favoritter" : "Lagt til favoritter",
      description: `${car.brand} ${car.model}`
    });
  };

  const exportData = async () => {
    const allData = {
      routes: savedRoutes,
      favoriteCars,
      settings: await offlineStorage.getSettings(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elroute-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    await offlineStorage.logUsage('export_data');
    
    toast({
      title: "Data eksportert",
      description: "Alle dine data er lagret som backup-fil"
    });
  };

  const useMyLocation = async () => {
    await getCurrentPosition();
    
    if (location) {
      // This would normally reverse geocode, but for offline we'll use coordinates
      toast({
        title: "Posisjon funnet",
        description: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {isOnline ? 'Online' : 'Offline modus'}
            </span>
          </div>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? 'Tilkoblet' : 'Lokal lagring'}
          </Badge>
        </div>
      </Card>

      {/* GPS Location */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Min posisjon
          </h3>
          <Button 
            onClick={useMyLocation}
            disabled={gpsLoading}
            size="sm"
            variant="outline"
          >
            {gpsLoading ? 'Finner...' : 'Bruk GPS'}
          </Button>
        </div>
        {location && (
          <p className="text-sm text-muted-foreground">
            Breddegrad: {location.lat.toFixed(6)}, Lengdegrad: {location.lng.toFixed(6)}
          </p>
        )}
      </Card>

      {/* Save Current Route */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Lagre gjeldende rute
        </h3>
        
        <div className="space-y-3">
          <Input
            placeholder="Navn på rute (valgfritt)"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className="bg-background/50"
          />
          
          <Button 
            onClick={saveCurrentRoute}
            className="w-full"
            disabled={!selectedCar || !routeData.from || !routeData.to}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Lagre rute offline
          </Button>
        </div>
      </Card>

      {/* Saved Routes */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4" />
          Lagrede ruter ({savedRoutes.length})
        </h3>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {savedRoutes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Ingen lagrede ruter ennå
            </p>
          ) : (
            savedRoutes.map((route) => (
              <div key={route.id} className="p-3 bg-background/50 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{route.name}</h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      {route.car.brand} {route.car.model}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(route.createdAt).toLocaleDateString('no')}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteRoute(route.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Favorite Cars */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Favorittbiler ({favoriteCars.length})
        </h3>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {favoriteCars.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Ingen favorittbiler ennå
            </p>
          ) : (
            favoriteCars.map((car) => (
              <div key={car.id} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                <div className="flex items-center gap-2">
                  <span>{car.image}</span>
                  <div>
                    <p className="font-medium text-sm">{car.brand} {car.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {car.batteryCapacity} kWh • {car.range} km
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => toggleFavoriteCar(car)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <Heart className="h-3 w-3 fill-current text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
        
        {selectedCar && (
          <Button
            onClick={() => toggleFavoriteCar(selectedCar)}
            size="sm"
            variant="outline"
            className="w-full mt-3"
          >
            <Heart className="h-3 w-3 mr-2" />
            Legg til valgte bil som favoritt
          </Button>
        )}
      </Card>

      {/* Export Data */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border">
        <Button onClick={exportData} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Eksporter alle data som backup
        </Button>
      </Card>
    </div>
  );
}