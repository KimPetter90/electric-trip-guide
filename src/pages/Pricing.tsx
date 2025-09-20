import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/PricingSection';
import { ArrowLeft, Home } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 animate-circuit" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* Header */}
      <header className="relative z-50 border-b border-border/20 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="hover-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til hovedsiden
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="glass-card"
            >
              <Home className="h-4 w-4 mr-2" />
              Hjem
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10">
        <PricingSection />
      </div>
    </div>
  );
}