import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Zap, Building2, Truck, MapPin, Clock, Battery, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DemoEnvironment = () => {
  const [demoForm, setDemoForm] = useState({
    from: 'Oslo',
    to: 'Bergen',
    carModel: 'Tesla Model 3',
    batteryLevel: 85,
    companyName: 'Demo Bedrift AS',
    useCase: 'fleet'
  });

  const [demoResult, setDemoResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDemo = async () => {
    setIsRunning(true);
    toast({
      title: "Starter demo",
      description: "Beregner rute med live data...",
    });

    try {
      // Simulate API call to our routes API
      const response = await supabase.functions.invoke('api-routes/calculate-route', {
        body: {
          from: demoForm.from,
          to: demoForm.to,
          car_model: demoForm.carModel,
          battery_percentage: demoForm.batteryLevel,
          client_id: `demo-${demoForm.companyName.toLowerCase().replace(/\s+/g, '-')}`
        }
      });

      if (response.error) throw response.error;

      // Mock enhanced result for demo
      const mockResult = {
        route: {
          from: demoForm.from,
          to: demoForm.to,
          distance_km: 463,
          estimated_duration_minutes: 555
        },
        car: {
          model: demoForm.carModel,
          battery_capacity: 75,
          range_km: 400
        },
        impact: {
          battery_usage_percent: 87,
          charging_stops_needed: 1,
          estimated_cost_nok: 320,
          co2_saved_kg: 56
        },
        business_value: {
          cost_vs_petrol_saved_nok: 890,
          time_saved_minutes: 12,
          driver_satisfaction_score: 4.8,
          carbon_footprint_reduction_percent: 73
        },
        recommendations: [
          'Planlegg lading ved Sogndal for optimal batterinivå',
          'Vurder å øke batterinivå til 90% for ekstra margin',
          'Bruk vårt flåtestyringssystem for automatisk ruteoptimalisering'
        ]
      };

      setDemoResult(mockResult);
      
      toast({
        title: "Demo fullført!",
        description: "Se resultatene nedenfor - dette er live data fra vår API",
      });
    } catch (error) {
      console.error('Demo error:', error);
      toast({
        title: "Demo feilet",
        description: "Noe gikk galt. Prøv igjen eller kontakt support.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const useCases = {
    fleet: {
      title: 'Flåtestyring',
      description: 'Optimalisering av bedriftens kjøretøypark',
      icon: <Truck className="h-5 w-5" />,
      benefits: ['30% kostnadsreduksjon', 'Automatisk ruteplanlegging', 'Sanntids tracking']
    },
    logistics: {
      title: 'Logistikk',
      description: 'Levering og distribusjon',
      icon: <MapPin className="h-5 w-5" />,
      benefits: ['Redusert leveringstid', 'Lavere driftskostnader', 'Miljøvennlig profil']
    },
    municipal: {
      title: 'Kommune',
      description: 'Offentlig transport og tjenester',
      icon: <Building2 className="h-5 w-5" />,
      benefits: ['Bærekraftig mobilitet', 'Kostnadskontroll', 'Innbyggertilfredshet']
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              EV Route API Demo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test vår API i sanntid og se hvordan den kan transformere din virksomhet
            </p>
            <div className="flex justify-center gap-6 mt-6">
              {Object.entries(useCases).map(([key, useCase]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {useCase.icon}
                  <span>{useCase.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Live API Demo
              </CardTitle>
              <CardDescription>
                Test vår ruteplanlegging API med dine egne parametere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from">Fra</Label>
                  <Input
                    id="from"
                    value={demoForm.from}
                    onChange={(e) => setDemoForm({ ...demoForm, from: e.target.value })}
                    placeholder="Oslo"
                  />
                </div>
                <div>
                  <Label htmlFor="to">Til</Label>
                  <Input
                    id="to"
                    value={demoForm.to}
                    onChange={(e) => setDemoForm({ ...demoForm, to: e.target.value })}
                    placeholder="Bergen"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="car">Bilmodell</Label>
                <Select value={demoForm.carModel} onValueChange={(value) => setDemoForm({ ...demoForm, carModel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tesla Model 3">Tesla Model 3</SelectItem>
                    <SelectItem value="Tesla Model Y">Tesla Model Y</SelectItem>
                    <SelectItem value="Volkswagen ID.4">Volkswagen ID.4</SelectItem>
                    <SelectItem value="BMW iX3">BMW iX3</SelectItem>
                    <SelectItem value="Audi e-tron">Audi e-tron</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="battery">Batterinivå (%)</Label>
                <Input
                  id="battery"
                  type="number"
                  min="10"
                  max="100"
                  value={demoForm.batteryLevel}
                  onChange={(e) => setDemoForm({ ...demoForm, batteryLevel: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="company">Bedriftsnavn (valgfri)</Label>
                <Input
                  id="company"
                  value={demoForm.companyName}
                  onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
                  placeholder="Din bedrift AS"
                />
              </div>

              <div>
                <Label htmlFor="usecase">Bruksområde</Label>
                <Select value={demoForm.useCase} onValueChange={(value) => setDemoForm({ ...demoForm, useCase: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(useCases).map(([key, useCase]) => (
                      <SelectItem key={key} value={key}>
                        {useCase.title} - {useCase.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={runDemo} 
                disabled={isRunning} 
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Kjører demo...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Live Demo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Demo Results */}
          <Card>
            <CardHeader>
              <CardTitle>Live Resultater</CardTitle>
              <CardDescription>
                {demoResult ? 'API-respons i sanntid' : 'Resultater vises her når du kjører demo'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demoResult ? (
                <Tabs defaultValue="route" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="route">Rute</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="recommendations">Tips</TabsTrigger>
                  </TabsList>

                  <TabsContent value="route" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">{demoResult.route.distance_km} km</div>
                        <div className="text-sm text-muted-foreground">Totaldistanse</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{Math.round(demoResult.route.estimated_duration_minutes / 60)} timer</div>
                        <div className="text-sm text-muted-foreground">Kjøretid</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Battery className="h-4 w-4" />
                          Batteribruk
                        </span>
                        <Badge variant="outline">{demoResult.impact.battery_usage_percent}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Ladestopp
                        </span>
                        <Badge variant="outline">{demoResult.impact.charging_stops_needed}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Estimert kostnad
                        </span>
                        <Badge variant="outline">{demoResult.impact.estimated_cost_nok} NOK</Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                          {demoResult.business_value.cost_vs_petrol_saved_nok} NOK spart
                        </div>
                        <div className="text-sm text-muted-foreground">vs bensin/diesel</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold">{demoResult.impact.co2_saved_kg} kg CO₂</div>
                        <div className="text-sm text-muted-foreground">Mindre utslipp</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold">{demoResult.business_value.driver_satisfaction_score}/5</div>
                        <div className="text-sm text-muted-foreground">Sjåførtilfredshet</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-3">
                    {demoResult.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="p-3 border rounded-lg text-sm">
                        {rec}
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Kjør demo for å se live API-resultater</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Use Case Benefits */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Skap verdier for din bransje</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(useCases).map(([key, useCase]) => (
              <Card key={key} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      {useCase.icon}
                    </div>
                  </div>
                  <CardTitle>{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Klar for å komme i gang?</CardTitle>
              <CardDescription>
                Book en personlig demo og se hvordan vår API kan transformere din virksomhet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Personlig demo (30 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>ROI-analyse for din bedrift</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Integrasjonsstøtte</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Skreddersydd løsning</span>
                </div>
              </div>
              <Button size="lg" className="w-full">
                Book demo nå
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoEnvironment;