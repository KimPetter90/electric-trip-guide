import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Star, 
  Route, 
  Clock, 
  MapPin, 
  Trash2, 
  Plus,
  ArrowRight,
  CreditCard,
  Battery
} from 'lucide-react';

interface FavoriteRoute {
  id: string;
  name: string;
  from_location: string;
  to_location: string;
  distance: string;
  duration: string;
  estimated_cost: string;
  battery_usage: string;
  use_count: number;
  created_at: string;
}

interface FavoriteRoutesProps {
  onRouteSelect?: (from: string, to: string) => void;
  className?: string;
}

export function FavoriteRoutes({ onRouteSelect, className }: FavoriteRoutesProps) {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    from_location: '',
    to_location: '',
    distance: '',
    duration: '',
    estimated_cost: '',
    battery_usage: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadFavoriteRoutes();
    }
  }, [user]);

  const loadFavoriteRoutes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorite_routes' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false });
      
      if (error) throw error;
      setFavorites((data as any) || []);
    } catch (error) {
      console.error('Error loading favorite routes:', error);
      toast({
        title: "Kunne ikke laste favoritt-ruter",
        description: "Prøv å oppdatere siden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavoriteRoute = async () => {
    if (!user) {
      toast({
        title: "Logg inn for å lagre favoritter",
        description: "Du må være logget inn for å lagre favoritt-ruter",
        variant: "destructive",
      });
      return;
    }

    if (!newRoute.name || !newRoute.from_location || !newRoute.to_location) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst fyll ut navn, fra og til lokasjon",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('favorite_routes' as any)
        .insert([{
          user_id: user.id,
          ...newRoute,
          use_count: 0
        }]);

      if (error) throw error;

      toast({
        title: "Favoritt-rute lagret!",
        description: `"${newRoute.name}" er lagt til i favorittene dine`,
      });

      setNewRoute({
        name: '',
        from_location: '',
        to_location: '',
        distance: '',
        duration: '',
        estimated_cost: '',
        battery_usage: ''
      });
      setIsAddModalOpen(false);
      loadFavoriteRoutes();
    } catch (error) {
      console.error('Error saving favorite route:', error);
      toast({
        title: "Kunne ikke lagre rute",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    }
  };

  const deleteFavoriteRoute = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from('favorite_routes' as any)
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      toast({
        title: "Favoritt-rute slettet",
        description: "Ruten er fjernet fra favorittene dine",
      });

      loadFavoriteRoutes();
    } catch (error) {
      console.error('Error deleting favorite route:', error);
      toast({
        title: "Kunne ikke slette rute",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    }
  };

  const useFavoriteRoute = async (route: FavoriteRoute) => {
    // Increment use count
    try {
      await supabase
        .from('favorite_routes' as any)
        .update({ use_count: route.use_count + 1 })
        .eq('id', route.id);
    } catch (error) {
      console.error('Error updating use count:', error);
    }

    // Call onRouteSelect if provided
    if (onRouteSelect) {
      onRouteSelect(route.from_location, route.to_location);
    }

    toast({
      title: "Favoritt-rute valgt",
      description: `Planlegger rute: ${route.from_location} → ${route.to_location}`,
    });

    loadFavoriteRoutes(); // Refresh to update use count
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Favoritt-ruter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Logg inn for å lagre og bruke favoritt-ruter
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Favoritt-ruter
          </CardTitle>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Legg til
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Legg til favoritt-rute</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="route-name">Rutename</Label>
                  <Input
                    id="route-name"
                    placeholder="F.eks. 'Jobb', 'Hytta', 'Oslo-Bergen'"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-location">Fra</Label>
                    <Input
                      id="from-location"
                      placeholder="Oslo"
                      value={newRoute.from_location}
                      onChange={(e) => setNewRoute({ ...newRoute, from_location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-location">Til</Label>
                    <Input
                      id="to-location"
                      placeholder="Bergen"
                      value={newRoute.to_location}
                      onChange={(e) => setNewRoute({ ...newRoute, to_location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distance">Distanse</Label>
                    <Input
                      id="distance"
                      placeholder="467 km"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Kjøretid</Label>
                    <Input
                      id="duration"
                      placeholder="7t 30m"
                      value={newRoute.duration}
                      onChange={(e) => setNewRoute({ ...newRoute, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Ladekostnad</Label>
                    <Input
                      id="cost"
                      placeholder="250 kr"
                      value={newRoute.estimated_cost}
                      onChange={(e) => setNewRoute({ ...newRoute, estimated_cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="battery">Batteribruk</Label>
                    <Input
                      id="battery"
                      placeholder="85%"
                      value={newRoute.battery_usage}
                      onChange={(e) => setNewRoute({ ...newRoute, battery_usage: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={saveFavoriteRoute} className="flex-1">
                    Lagre rute
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Laster favoritt-ruter...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Ingen favoritt-ruter ennå
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til din første rute
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((route) => (
              <Card key={route.id} className="border-l-4 border-l-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {route.name}
                        {route.use_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {route.use_count}
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 text-green-600" />
                        {route.from_location}
                        <ArrowRight className="h-3 w-3" />
                        <MapPin className="h-4 w-4 text-red-600" />
                        {route.to_location}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFavoriteRoute(route.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {(route.distance || route.duration || route.estimated_cost || route.battery_usage) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {route.distance && (
                        <Badge variant="outline" className="text-xs">
                          <Route className="h-3 w-3 mr-1" />
                          {route.distance}
                        </Badge>
                      )}
                      {route.duration && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {route.duration}
                        </Badge>
                      )}
                      {route.estimated_cost && (
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {route.estimated_cost}
                        </Badge>
                      )}
                      {route.battery_usage && (
                        <Badge variant="outline" className="text-xs">
                          <Battery className="h-3 w-3 mr-1" />
                          {route.battery_usage}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => useFavoriteRoute(route)}
                    size="sm"
                    className="w-full"
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Bruk denne ruten
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}