import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Rocket } from "lucide-react";

// OPTIMALISERTE PRISER FOR MAKSIMAL SUKSESS! 🚀
const OPTIMIZED_PRICING = {
  premium: {
    monthly: { price: 199, priceId: "price_1S9U5rDgjF2NREPhuG6Kvd1Q" },
    yearly: { price: 169, priceId: "price_1S9U6eDgjF2NREPhAgggcpu0", savings: "15%" },
    student: { price: 149, priceId: "price_1S9U6yDgjF2NREPhZchK8E4m", savings: "25%" }
  },
  pro: {
    monthly: { price: 299, priceId: "price_1S9U6RDgjF2NREPhxe8pPOqz", oldPrice: 399 },
    yearly: { price: 254, priceId: "price_1S9U6oDgjF2NREPhkyi7IeoS", savings: "15%" }
  }
};

interface OptimizedPricingProps {
  onSelectPlan?: (priceId: string) => void;
}

export const OptimizedPricing: React.FC<OptimizedPricingProps> = ({ onSelectPlan }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient mb-4">
          🚀 Optimaliserte Priser for Lansering!
        </h2>
        <p className="text-muted-foreground">
          Konkurransedyktige priser designet for suksess i det norske markedet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Premium Plan */}
        <Card className="relative p-6 glass-card border-2 border-primary/50 hover:border-primary transition-all">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary/90 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              POPULÆR
            </Badge>
          </div>

          <div className="text-center mb-6">
            <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">ElRoute Premium</h3>
            <p className="text-muted-foreground">Perfekt for privatpersoner</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">199 NOK</div>
              <div className="text-sm text-muted-foreground">per måned</div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Årlig abonnement</span>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-500">169 NOK/mnd</div>
                    <Badge variant="secondary" className="text-xs">15% rabatt</Badge>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Student-rabatt</span>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-500">149 NOK/mnd</div>
                    <Badge variant="secondary" className="text-xs">25% rabatt</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              "100 ruter per måned",
              "Værintegrasjon",
              "Ruteoptimalisering",
              "Ladestasjonsinfo",
              "Mobil-app",
              "E-post support"
            ].map((feature) => (
              <div key={feature} className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full"
            onClick={() => onSelectPlan?.(OPTIMIZED_PRICING.premium.monthly.priceId)}
          >
            Start gratis trial (30 dager)
          </Button>
        </Card>

        {/* Pro Plan */}
        <Card className="relative p-6 glass-card border-2 border-secondary/50 hover:border-secondary transition-all">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1">
              <Crown className="w-3 h-3 mr-1" />
              REDUSERT PRIS!
            </Badge>
          </div>

          <div className="text-center mb-6">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-2xl font-bold mb-2">ElRoute Pro</h3>
            <p className="text-muted-foreground">For bedrifter og power-brukere</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg line-through text-muted-foreground">399 NOK</span>
                <Badge variant="destructive" className="text-xs">-100 NOK</Badge>
              </div>
              <div className="text-3xl font-bold text-secondary">299 NOK</div>
              <div className="text-sm text-muted-foreground">per måned</div>
            </div>

            <div className="p-3 bg-secondary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Årlig abonnement</span>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-500">254 NOK/mnd</div>
                  <Badge variant="secondary" className="text-xs">15% rabatt</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              "Ubegrensede ruter",
              "Avansert værintegrasjon",
              "AI-ruteoptimalisering",
              "Prioritert support",
              "API-tilgang",
              "Ferjeintegrasjon",
              "Eksport til GPX/KML",
              "Business analytics"
            ].map((feature) => (
              <div key={feature} className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <Button 
            variant="secondary"
            className="w-full"
            onClick={() => onSelectPlan?.(OPTIMIZED_PRICING.pro.monthly.priceId)}
          >
            Start gratis trial (30 dager)
          </Button>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>🎯 Optimalisert for det norske markedet • 🚀 Konkurransedyktige priser</p>
        <p>💡 30 dagers gratis prøveperiode • ❌ Ingen bindingstid</p>
      </div>
    </div>
  );
};