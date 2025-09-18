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
    <Card className={`mb-3 glass-card border ${isExpiringSoon ? 'border-destructive/30' : 'border-primary/30'} transition-all duration-500`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isExpiringSoon ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              {isExpiringSoon ? (
                <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-destructive' : 'text-primary'}`} />
              ) : (
                <Crown className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm text-gradient">
                Gratis Premium Trial
              </h3>
              <p className="text-xs text-muted-foreground">
                {daysLeft > 0 ? (
                  <>
                    <span className={`${isExpiringSoon ? 'text-destructive' : 'text-primary'} font-medium`}>
                      {daysLeft} {daysLeft === 1 ? 'dag' : 'dager'}
                    </span> igjen
                  </>
                ) : (
                  <span className="text-destructive font-medium">Trial utløper i dag!</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs px-3 py-1 h-7"
            >
              {showDetails ? 'Skjul' : 'Detaljer'}
            </Button>
            <Button 
              size="sm"
              className="bg-primary hover:bg-primary/80 text-primary-foreground text-xs px-3 py-1 h-7"
            >
              Oppgrader
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 pt-4 border-t border-glass-border animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 glass-card hover:neon-glow transition-all duration-300 group">
                <div className="text-3xl font-orbitron font-bold text-primary text-glow group-hover:scale-110 transition-transform duration-300">∞</div>
                <div className="text-sm text-foreground font-exo font-medium mt-2">Ubegrensede ruter</div>
              </div>
              <div className="text-center p-4 glass-card hover:cyber-glow transition-all duration-300 group">
                <div className="text-3xl font-orbitron font-bold text-secondary text-glow group-hover:scale-110 transition-transform duration-300">⚡</div>
                <div className="text-sm text-foreground font-exo font-medium mt-2">Værdata & optimering</div>
              </div>
              <div className="text-center p-4 glass-card hover:neon-glow transition-all duration-300 group">
                <div className="text-3xl font-orbitron font-bold text-accent text-glow group-hover:scale-110 transition-transform duration-300">💾</div>
                <div className="text-sm text-foreground font-exo font-medium mt-2">Favoritt-ruter</div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground text-center font-exo italic">
              Etter trial: 25 gratis ruter per måned, begrensede funksjoner
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}