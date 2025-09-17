import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Crown, Zap } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { subscription } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!subscription?.is_trial_active) {
    return null;
  }

  const daysLeft = subscription.days_left_in_trial;
  const isExpiringSoon = daysLeft <= 3;

  return (
    <Card className={`mb-6 border-2 ${isExpiringSoon ? 'border-warning/50 bg-warning/5' : 'border-primary/50 bg-primary/5'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isExpiringSoon ? 'bg-warning/20' : 'bg-primary/20'}`}>
              {isExpiringSoon ? (
                <Clock className={`h-5 w-5 ${isExpiringSoon ? 'text-warning' : 'text-primary'}`} />
              ) : (
                <Crown className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Gratis Premium Trial
              </h3>
              <p className="text-sm text-muted-foreground">
                {daysLeft > 0 ? (
                  <>
                    <span className={isExpiringSoon ? 'text-warning font-medium' : 'text-primary font-medium'}>
                      {daysLeft} {daysLeft === 1 ? 'dag' : 'dager'}
                    </span> igjen av full tilgang
                  </>
                ) : (
                  <span className="text-warning font-medium">Trial utløper i dag!</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Skjul' : 'Vis'} detaljer
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Oppgrader nå
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Ubegrensede ruter</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">⚡</div>
                <div className="text-sm text-muted-foreground">Værdata & optimering</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">💾</div>
                <div className="text-sm text-muted-foreground">Favoritt-ruter</div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Etter trial: 25 gratis ruter per måned, begrensede funksjoner
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}