import React from "react";
import { Card } from "@/components/ui/card";
import { Zap, MapPin } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";

function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Circuit Background */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(140 100% 45% / 0.1) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, hsl(180 100% 45% / 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, hsl(220 100% 45% / 0.1) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${futuristicBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-85" />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground bg-gradient-neon bg-clip-text text-transparent">
                ElRoute
              </h1>
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Intelligent ruteplanlegging for fremtidens elbiler
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <Card className="p-8 text-center bg-glass-bg backdrop-blur-sm border-glass-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Bilvelger</h3>
              <p className="text-muted-foreground">Velg din elbil for optimalisert ruteplanlegging</p>
            </Card>
            
            <Card className="p-8 text-center bg-glass-bg backdrop-blur-sm border-glass-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Ruteinput</h3>
              <p className="text-muted-foreground">Angi start og destinasjon for din reise</p>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Card className="p-8 text-center bg-glass-bg backdrop-blur-sm border-glass-border">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Klar for ruteplanlegging</h3>
              <p className="text-muted-foreground">
                Systemet er tilbake online og klar for bruk
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-glass-bg backdrop-blur-sm border-t border-glass-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            ElRoute - Fremtidens ruteplanlegging for elbiler i Norge
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Index;