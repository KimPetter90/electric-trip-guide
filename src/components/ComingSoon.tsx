import { Zap, Battery, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";

export default function ComingSoon() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Futuristisk bakgrunn */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${futuristicBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%2300ff88' stroke-width='0.5' opacity='0.4'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }}></div>

      <div className="relative container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-4xl">
          {/* Logo og tittel */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Zap className="h-12 w-12 text-primary animate-glow-pulse" />
            <h1 className="text-6xl md:text-8xl font-orbitron font-black text-gradient">
              ElRoute
            </h1>
            <Zap className="h-12 w-12 text-primary animate-glow-pulse" />
          </div>

          {/* Hovedmelding */}
          <Card className="p-8 md:p-12 glass-card cyber-glow border-primary/30 mb-8">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-6">
              Her kommer ElRoute 🚗⚡
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Din fremtidige ruteplanlegger for mer effektiv elbilkjøring
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center text-center p-4">
                <Battery className="h-12 w-12 text-primary mb-3 animate-glow-pulse" />
                <h3 className="font-orbitron font-semibold text-white mb-2">Smart Batteristyring</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent optimalisering av lading og rekkevidde
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <MapPin className="h-12 w-12 text-primary mb-3 animate-glow-pulse" />
                <h3 className="font-orbitron font-semibold text-white mb-2">Avansert Ruteplanlegging</h3>
                <p className="text-sm text-muted-foreground">
                  Finn den mest effektive ruten med sanntids data
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <Clock className="h-12 w-12 text-primary mb-3 animate-glow-pulse" />
                <h3 className="font-orbitron font-semibold text-white mb-2">Sanntidsoppdateringer</h3>
                <p className="text-sm text-muted-foreground">
                  Live data for ladestasjoner og trafikk
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-6 py-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <span className="text-white font-orbitron font-medium">
                Under utvikling
              </span>
            </div>
          </Card>

          {/* Kontaktinfo */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Følg med for oppdateringer om lansering
            </p>
            <Button 
              variant="outline" 
              className="border-primary/50 text-primary hover:bg-primary/10 font-orbitron"
              onClick={() => window.location.href = 'mailto:kontakt@elroute.no'}
            >
              Kontakt oss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}