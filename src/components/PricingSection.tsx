import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Crown, 
  Zap, 
  MapPin, 
  Cloud, 
  Smartphone, 
  Shield, 
  Check,
  Star,
  Rocket
} from "lucide-react";

// Pris-konfigurering (fra Stripe)
const PRICING_PLANS = {
  premium: {
    name: "ElRoute Premium",
    price: 199,
    priceId: "price_1S9JMqDgjF2NREPhOy9s16kw", // Ny price med trial support
    description: "Perfekt for private brukere",
    features: [
      "100 ruter per måned",
      "Værintegrasjon",
      "Ruteoptimalisering",
      "Ladestasjonsinfo",
      "Mobil-app",
      "E-post support"
    ],
    icon: Star,
    popular: true
  },
  pro: {
    name: "ElRoute Pro", 
    price: 399,
    priceId: "price_1S9JN2DgjF2NREPhiV6kkPrP", // Ny price med trial support
    description: "For power-brukere og bedrifter",
    features: [
      "Ubegrensede ruter",
      "Avansert værintegrasjon", 
      "AI-ruteoptimalisering",
      "Prioritert support",
      "API-tilgang",
      "Ferjeintegrasjon",
      "Eksport til GPX/KML",
      "Business analytics"
    ],
    icon: Crown,
    popular: false
  }
};

export const PricingSection: React.FC = () => {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleTrialStart = async (planType: string) => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må være innlogget for å starte gratis prøveperiode.",
        variant: "destructive",
      });
      return;
    }

    setLoading(planType);

    try {
      console.log(`🎯 Starting ${planType} trial...`);
      
      const { data, error } = await supabase.functions.invoke('activate-trial', {
        body: { planType }
      });

      console.log('📋 Trial activation response:', { data, error });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "🎉 Prøveperiode aktivert!",
          description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} prøveperiode er nå aktiv i 30 dager.`,
        });
        
        // Refresh subscription status to show the trial
        await refreshSubscription();
      } else {
        throw new Error(data?.error || 'Kunne ikke aktivere prøveperiode');
      }
    } catch (error: any) {
      console.error('Trial activation error:', error);
      toast({
        title: "Feil ved aktivering",
        description: error.message || "Kunne ikke aktivere prøveperiode. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (planKey: keyof typeof PRICING_PLANS) => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må være innlogget for å abonnere.",
        variant: "destructive",
      });
      return;
    }

    const plan = PRICING_PLANS[planKey];
    setLoading(plan.priceId);

    try {
      console.log(`🚀 Starting subscription for ${plan.name}...`);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.priceId,
          mode: 'subscription'
        }
      });

      console.log('📋 Checkout response:', { data, error });

      if (error) throw error;

      if (data?.url) {
        console.log('🔗 Opening checkout URL:', data.url);
        
        // Open Stripe checkout in new tab
        const checkoutWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
        
        if (checkoutWindow) {
          toast({
            title: "Stripe Checkout åpnet",
            description: `${plan.name} checkout ble åpnet i en ny fane.`,
          });
        } else {
          // If popup blocked, copy URL
          try {
            await navigator.clipboard.writeText(data.url);
            toast({
              title: "Lenke kopiert!",
              description: "Checkout-lenken er kopiert. Lim inn i en ny fane.",
            });
          } catch {
            toast({
              title: "Popup blokkert",
              description: `Checkout URL: ${data.url}`,
            });
          }
        }
      } else {
        throw new Error('Ingen checkout-URL mottatt');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Feil ved abonnement",
        description: error.message || "Kunne ikke starte abonnement. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setPortalLoading(true);
    try {
      console.log('🚀 Calling customer-portal function...');
      const { data, error } = await supabase.functions.invoke('customer-portal');

      console.log('📋 Portal response:', { data, error });

      if (error) throw error;

      if (data?.url) {
        console.log('🔗 Opening portal URL:', data.url);
        
        // Try opening in new tab (standard for Stripe portal)
        const portalWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
        
        if (portalWindow) {
          toast({
            title: "Portal åpnet",
            description: "Customer Portal ble åpnet i en ny fane.",
          });
        } else {
          // If popup blocked, copy URL and show message
          try {
            await navigator.clipboard.writeText(data.url);
            toast({
              title: "Lenke kopiert!",
              description: "Portal-lenken er kopiert. Lim inn i en ny fane.",
            });
          } catch {
            toast({
              title: "Popup blokkert",
              description: `Portal URL: ${data.url}`,
            });
          }
        }
      } else {
        console.error('❌ No URL received in response');
        throw new Error('Ingen portal-URL mottatt');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke åpne abonnement-portal. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Bakgrunnseffekter */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Crown className="h-8 w-8 text-primary animate-pulse-neon" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gradient font-orbitron">
              Velg din plan
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Oppgrader til premium for ubegrensede ruter og avanserte funksjoner
          </p>
        </div>

        {/* Gratis plan info */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="glass-card p-6 border-2 border-muted/20 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-muted/20 rounded-lg">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Gratis versjon</h3>
                <p className="text-muted-foreground">Perfekt for å teste tjenesten</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Gratis
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>25 ruter/måned</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Grunnleggende kart</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Ladestasjoner</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Community support</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Premium planer */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {Object.entries(PRICING_PLANS).map(([key, plan], index) => {
            const Icon = plan.icon;
            const isLoading = loading === plan.priceId;
            
            return (
              <Card 
                key={key}
                className={`
                  relative p-8 animate-card-reveal hover-lift
                  ${plan.popular 
                    ? 'border-2 border-primary neon-glow scale-105' 
                    : 'glass-card border-2 border-primary/20'
                  }
                `}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mest populær
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Icon className="h-8 w-8 text-primary animate-float" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient-static">
                      {plan.name}
                    </h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> NOK/mnd</span>
                  </div>
                  
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.popular ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleTrialStart(key)}
                      disabled={isLoading}
                      variant="premium"
                      size="lg"
                      className="w-full font-semibold"
                    >
                      {isLoading ? (
                        <LoadingSpinner variant="neon" size="sm" />
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          Start Gratis prøveperiode
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSubscribe(key as keyof typeof PRICING_PLANS)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Kjøp direkte
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(key as keyof typeof PRICING_PLANS)}
                    disabled={isLoading}
                    variant="outline"
                    size="lg"
                    className="w-full font-semibold"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Rocket className="h-5 w-5 mr-2" />
                        Start Abonnement
                      </>
                    )}
                  </Button>
                )}

                {plan.popular && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    14 dager gratis prøveperiode • Avbryt når som helst
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Manage subscription for existing users */}
        {user && (
          <div className="text-center mt-12 animate-fade-in">
            <Card className="glass-card p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">Har du allerede et abonnement?</h3>
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="w-full"
              >
                {portalLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Administrer abonnement
                  </>
                )}
              </Button>
            </Card>
          </div>
        )}

        {/* Trust indicators */}
        <div className="flex justify-center items-center gap-8 mt-16 text-sm text-muted-foreground animate-fade-in">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sikker betaling</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Avbryt når som helst</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>14 dager gratis</span>
          </div>
        </div>
      </div>
    </section>
  );
};