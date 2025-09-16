import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Zap, Star, Crown, Loader2 } from 'lucide-react';

const plans = [
  {
    name: 'Gratis',
    price: '0',
    description: 'Perfekt for å teste ElRoute',
    features: [
      '5 ruter per måned',
      'Grunnleggende ruteplanlegging',
      'Ladestasjons-oversikt',
      'E-post support'
    ],
    buttonText: 'Kom i gang gratis',
    popular: false,
    priceId: null,
    status: 'free'
  },
  {
    name: 'Premium',
    price: '199',
    description: 'For regelmessige elbilister',
    features: [
      '100 ruter per måned',
      'Værintegrasjon',
      'Ruteoptimalisering',
      'Ladekostnads-kalkulator',
      'Prioritert support'
    ],
    buttonText: 'Oppgrader til Premium',
    popular: true,
    priceId: 'price_1S80tCDgjF2NREPhFod9JnwM',
    status: 'premium'
  },
  {
    name: 'Pro',
    price: '399',
    description: 'For profesjonelle brukere',
    features: [
      'Ubegrensede ruter',
      'Avansert ruteoptimalisering',
      'API-tilgang',
      'Masseutførelse av ruter',
      'Dedikert support',
      'Eksport til kalender'
    ],
    buttonText: 'Oppgrader til Pro',
    popular: false,
    priceId: 'price_1S80tNDgjF2NREPhc16tZZVw',
    status: 'pro'
  }
];

export default function Pricing() {
  const { user, subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Feil ved åpning av kundeportal",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!priceId) {
      toast({
        title: "Du er allerede på gratis-planen",
        description: "Denne planen krever ingen betaling.",
      });
      return;
    }

    setLoading(priceId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${user ? (await supabase.auth.getSession()).data.session?.access_token : ''}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Feil ved opprettelse av betaling",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (status: string) => {
    return subscription?.subscription_status === status;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Premium':
        return <Star className="h-6 w-6 text-yellow-500" />;
      case 'Pro':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Zap className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="absolute inset-0 bg-[url('/src/assets/futuristic-ev-bg.jpg')] bg-cover bg-center opacity-5"></div>
      
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Velg din ElRoute-plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fra enkle ruter til avanserte optimaliseringer - vi har en plan som passer dine behov
            </p>
            
            {subscription && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  Aktiv plan: <span className="font-semibold capitalize text-foreground">{subscription.subscription_status}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Ruter brukt: {subscription.route_count} / {subscription.route_limit === -1 ? '∞' : subscription.route_limit}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border'
              } ${isCurrentPlan(plan.status) ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Mest populær
                  </Badge>
                )}
                
                {isCurrentPlan(plan.status) && (
                  <Badge variant="secondary" className="absolute -top-3 right-4">
                    Din plan
                  </Badge>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price} kr</span>
                    {plan.price !== '0' && <span className="text-muted-foreground">/måned</span>}
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={loading === plan.priceId || isCurrentPlan(plan.status)}
                  >
                    {loading === plan.priceId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Behandler...
                      </>
                    ) : isCurrentPlan(plan.status) ? (
                      'Aktiv plan'
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                  
                  {plan.priceId && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      14 dagers angrerett • Kanseller når som helst
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Alle planer inkluderer 14 dagers gratis prøveperiode. Kanseller når som helst.
            </p>
            
            {user && subscription?.subscribed && (
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                className="mr-4"
              >
                Administrer abonnement
              </Button>
            )}
            
            <Button 
              variant="link" 
              onClick={() => refreshSubscription()}
            >
              Oppdater abonnementsstatus
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}