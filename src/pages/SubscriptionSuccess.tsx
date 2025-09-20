import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Crown, ArrowRight, Home } from "lucide-react";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, refreshSubscription } = useAuth();
  const sessionId = searchParams.get('session_id');
  
  // Determine plan type from session or URL
  const isPro = searchParams.get('plan') === 'pro' || sessionId?.includes('pro') || 
                window.location.href.includes('pro');
  const planName = isPro ? 'Pro' : 'Premium';

  useEffect(() => {
    if (sessionId) {
      // Refresh subscription status after successful payment
      setTimeout(() => {
        refreshSubscription();
        toast({
          title: `🎉 Velkommen til ${planName}!`,
          description: `Ditt ${planName} abonnement er nå aktivt. Du har tilgang til alle ${planName.toLowerCase()}-funksjoner.`,
          duration: 5000,
        });
      }, 2000);
    }
  }, [sessionId, refreshSubscription, toast, planName]);

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 animate-circuit" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-2xl mx-auto glass-card p-8 text-center animate-scale-in border-2 border-primary/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-green-500/10 rounded-full border-2 border-green-500/20">
              <Check className="h-12 w-12 text-green-500 animate-pulse-neon" />
            </div>
            <Crown className="h-8 w-8 text-primary animate-float" />
          </div>
          
          <h1 className="text-4xl font-bold text-gradient font-orbitron mb-4">
            Betaling vellykket!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            Takk for at du oppgraderer til {planName}! Du har nå tilgang til alle avanserte funksjoner.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Ubegrensede ruter</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Værintegrasjon</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">AI-optimalisering</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Prioritert support</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => {
                // Ensure user state is preserved
                if (user) {
                  navigate('/');
                } else {
                  // If user is somehow lost, wait a bit for auth to sync
                  setTimeout(() => navigate('/'), 500);
                }
              }}
              variant="premium"
              size="lg"
              className="font-semibold"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Start planlegging ruter
            </Button>
            
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="lg"
              className="glass-card"
            >
              <Home className="h-5 w-5 mr-2" />
              Se abonnement
            </Button>
          </div>
          
          {sessionId && (
            <p className="text-xs text-muted-foreground mt-6">
              Session ID: {sessionId}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}