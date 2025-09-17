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
    <Card className={`mb-6 glass-card border-2 ${isExpiringSoon ? 'border-destructive/50 neon-glow' : 'border-primary/50 cyber-glow'} transition-all duration-500 animate-fade-in`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full relative ${isExpiringSoon ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              {isExpiringSoon ? (
                <Clock className={`h-6 w-6 ${isExpiringSoon ? 'text-destructive' : 'text-primary'} animate-pulse`} />
              ) : (
                <Crown className="h-6 w-6 text-primary animate-float" />
              )}
              <div className={`absolute inset-0 rounded-full ${isExpiringSoon ? 'bg-destructive/20' : 'bg-primary/20'} blur-xl animate-pulse-glow`} />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-lg flex items-center gap-3 text-gradient">
                <Zap className="h-5 w-5 text-primary animate-float" style={{ animationDelay: '0.5s' }} />
                Gratis Premium Trial
              </h3>
              <p className="text-sm text-muted-foreground font-exo">
                {daysLeft > 0 ? (
                  <>
                    <span className={`${isExpiringSoon ? 'text-destructive' : 'text-primary'} font-semibold text-glow`}>
                      {daysLeft} {daysLeft === 1 ? 'dag' : 'dager'}
                    </span> igjen av full tilgang
                  </>
                ) : (
                  <span className="text-destructive font-semibold text-glow animate-pulse">Trial utløper i dag!</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="glass-card hover:neon-glow transition-all duration-300 font-exo font-medium"
            >
              {showDetails ? 'Skjul' : 'Vis'} detaljer
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-electric hover:bg-gradient-neon text-primary-foreground font-orbitron font-bold px-6 py-3 neon-glow hover:scale-105 transition-all duration-300"
            >
              Oppgrader nå
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