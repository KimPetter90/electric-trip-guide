import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, X, Crown, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ExitIntentPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutter
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown && !user) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(timer);
    };
  }, [hasShown, user]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGetDiscount = async () => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må logge inn for å få rabatten.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: "price_1S9U5rDgjF2NREPhuG6Kvd1Q", // Premium plan
          mode: 'subscription'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke åpne checkout. Prøv igjen.",
        variant: "destructive",
      });
    }
  };

  if (user) return null; // Ikke vis for innloggede brukere

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-500/50">
        <DialogHeader className="text-center">
          <div className="flex justify-between items-start">
            <div />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="animate-bounce">
              <Zap className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            
            <DialogTitle className="text-2xl font-bold text-red-600">
              VENT! Ikke gå ennå! 🚨
            </DialogTitle>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                Eksklusiv rabatt bare for deg:
              </p>
              <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
                70% RABATT - KUN I {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="p-4 bg-white/50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 line-through">Vanlig pris: 199 kr</span>
              <Crown className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              Kun 59 kr/mnd
            </div>
            <p className="text-xs text-gray-600">
              Spar 1.680 kr i året!
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleGetDiscount}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 animate-pulse"
              size="lg"
            >
              <Clock className="h-5 w-5 mr-2" />
              HENT RABATTEN NÅ!
            </Button>
            
            <p className="text-xs text-gray-600">
              ⚡ Kun gyldig i {formatTime(timeLeft)} • Ingen bindingstid
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>✅ 30 dager gratis prøveperiode</p>
            <p>✅ Avbryt når som helst</p>
            <p>✅ Sikkert betalingssystem</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};