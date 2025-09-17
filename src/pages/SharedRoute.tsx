import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Battery, CreditCard, Route, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function SharedRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  useAnalytics();

  const [routeData, setRouteData] = useState({
    from: '',
    to: '',
    distance: '',
    duration: '',
    cost: '',
    battery: '',
  });

  useEffect(() => {
    // Extract route data from URL parameters
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const distance = searchParams.get('distance') || '';
    const duration = searchParams.get('duration') || '';
    const cost = searchParams.get('cost') || '';
    const battery = searchParams.get('battery') || '';

    if (!from || !to) {
      toast({
        title: "Ugyldig rute-lenke",
        description: "Denne lenken ser ut til å være ødelagt eller ugyldig.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setRouteData({ from, to, distance, duration, cost, battery });
  }, [searchParams, navigate, toast]);

  const planSimilarRoute = () => {
    // Navigate to main page with pre-filled route data
    navigate(`/?from=${encodeURIComponent(routeData.from)}&to=${encodeURIComponent(routeData.to)}`);
  };

  if (!routeData.from || !routeData.to) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster delt rute...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="absolute inset-0 bg-[url('/src/assets/futuristic-ev-bg.jpg')] bg-cover bg-center opacity-5"></div>
      
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Route className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Delt elbilrute
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Noen har delt en elbilrute med deg via ElRoute
            </p>
          </div>

          {/* Route Card */}
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="text-muted-foreground">{routeData.from}</span>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{routeData.to}</span>
                <MapPin className="h-5 w-5 text-red-600" />
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Route Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Route className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold">{routeData.distance}</div>
                  <div className="text-sm text-muted-foreground">Distanse</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold">{routeData.duration}</div>
                  <div className="text-sm text-muted-foreground">Kjøretid</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold">{routeData.cost}</div>
                  <div className="text-sm text-muted-foreground">Ladekostnad</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Battery className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <div className="font-semibold">{routeData.battery}</div>
                  <div className="text-sm text-muted-foreground">Batteribruk</div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-primary">✨</span>
                  Hvorfor bruke ElRoute?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1">✓</Badge>
                    Værjustert rekkevidde
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1">✓</Badge>
                    Sanntids ladestasjoner
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1">✓</Badge>
                    Kostnadsberegning
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1">✓</Badge>
                    25 gratis ruter/måned
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={planSimilarRoute}
                  className="flex-1"
                  size="lg"
                >
                  <Route className="h-5 w-5 mr-2" />
                  Planlegg min rute
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="flex-1"
                  size="lg"
                >
                  Utforsk ElRoute
                </Button>
              </div>

              {/* Social Proof */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Bli med <span className="font-semibold text-primary">1000+</span> elbilister som bruker ElRoute for optimal ruteplanlegging
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Norges smarteste elbil-ruteplanlegger
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Sanntids ladestasjoner</h3>
                  <p className="text-sm text-muted-foreground">
                    Oppdaterte ladestasjoner med tilgjengelighet og priser
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Battery className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Værjustert rekkevidde</h3>
                  <p className="text-sm text-muted-foreground">
                    Nøyaktige beregninger basert på værforhold og temperatur
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Kostnadsoptimering</h3>
                  <p className="text-sm text-muted-foreground">
                    Finn de billigste ladestasjonene på ruten din
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}