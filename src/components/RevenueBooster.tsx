import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Crown, Users, TrendingUp, Star, Clock, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const RevenueBooster: React.FC = () => {
  const [showBooster, setShowBooster] = useState(false);
  const [recentSignups, setRecentSignups] = useState(23);
  const [todayRevenue, setTodayRevenue] = useState(4780);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Vis booster etter 30 sekunder
    const timer = setTimeout(() => {
      if (!user) setShowBooster(true);
    }, 30000);

    // Oppdater tall hvert 10. sekund for å skape urgency
    const updateTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        setRecentSignups(prev => prev + 1);
        setTodayRevenue(prev => prev + Math.floor(Math.random() * 199) + 99);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(updateTimer);
    };
  }, [user]);

  const handleUpgrade = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må logge inn for å oppgradere.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, mode: 'subscription' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        setShowBooster(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (user || !showBooster) return null;

  return (
    <Dialog open={showBooster} onOpenChange={setShowBooster}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-500/50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-orange-600">
            🔥 SISTE SJANSE - MEGA RABATT! 🔥
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Urgency indicators */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-bold text-lg">{recentSignups}</p>
                  <p className="text-sm text-gray-600">nye kunder i dag</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-bold text-lg">{todayRevenue.toLocaleString()} kr</p>
                  <p className="text-sm text-gray-600">omsetning i dag</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main offer */}
          <div className="text-center space-y-4">
            <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
              85% RABATT - BARE I 15 MINUTTER!
            </Badge>
            
            <div className="bg-white/70 p-6 rounded-lg border border-yellow-300">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 line-through">Normalpris: 199 kr/mnd</p>
                <p className="text-4xl font-bold text-green-600">Kun 29 kr/mnd</p>
                <p className="text-lg font-semibold text-orange-600">
                  💰 SPAR 2.040 kr i året!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">DU FÅR:</h4>
                <ul className="space-y-1 text-left">
                  <li>✅ Ubegrensede ruter</li>
                  <li>✅ Værintegrasjon</li>
                  <li>✅ AI-optimalisering</li>
                  <li>✅ Prioritert support</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">BONUS:</h4>
                <ul className="space-y-1 text-left">
                  <li>🎁 3 måneder gratis</li>
                  <li>🎁 Eksklusiv beta-tilgang</li>
                  <li>🎁 Personlig onboarding</li>
                  <li>🎁 Livstidssupport</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleUpgrade('price_1S9U5rDgjF2NREPhuG6Kvd1Q')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 text-lg animate-pulse"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              HENT MEGA-RABATTEN NÅ!
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Avbryt når som helst</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                <span>30 dager pengene tilbake</span>
              </div>
            </div>

            <p className="text-center text-xs text-red-600 font-bold animate-bounce">
              ⚡ Kun 7 plasser igjen til denne prisen!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};