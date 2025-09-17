import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
  fallback?: ReactNode;
}

export function PremiumGate({ 
  children, 
  feature, 
  description = "Denne funksjonen krever Premium tilgang", 
  fallback 
}: PremiumGateProps) {
  const { subscription } = useAuth();

  // Allow access if user has active subscription or active trial
  const hasAccess = subscription?.subscribed || subscription?.is_trial_active;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-2 border-dashed border-border/50 bg-muted/20">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary/60" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {feature}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Zap className="h-4 w-4 mr-2" />
              Start 30-dagers gratis trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline">
              Se alle Premium-funksjoner
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            ✨ Full tilgang i 30 dager, ingen forpliktelser
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility hook for checking premium access
export function usePremiumAccess() {
  const { subscription } = useAuth();
  
  return {
    hasAccess: subscription?.subscribed || subscription?.is_trial_active,
    isTrialActive: subscription?.is_trial_active || false,
    daysLeftInTrial: subscription?.days_left_in_trial || 0,
    subscriptionStatus: subscription?.subscription_status || 'free'
  };
}