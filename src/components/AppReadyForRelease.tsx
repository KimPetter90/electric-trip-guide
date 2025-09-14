import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Download, 
  Smartphone, 
  Globe, 
  Zap,
  Heart,
  Shield,
  Users
} from "lucide-react";

export default function AppReadyForRelease() {
  const features = [
    { icon: Zap, title: "100% Offline", desc: "Fungerer uten internett" },
    { icon: Heart, title: "Gratis", desc: "Ingen skjulte kostnader" },
    { icon: Shield, title: "Privat", desc: "Data lagres lokalt" },
    { icon: Users, title: "Alle elbiler", desc: "25+ modeller inkludert" }
  ];

  const stats = [
    { label: "Elbilmodeller", value: "25+" },
    { label: "Offline lagring", value: "✓" },
    { label: "GPS støtte", value: "✓" },
    { label: "Språk", value: "Norsk" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-foreground">
              ElRoute App er klar for utgivelse!
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Gratis offline ruteplanlegger for elbiler - testet og klar for nedlasting
          </p>
          <Badge variant="default" className="text-lg px-6 py-2">
            Versjon 1.0.0 Beta
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center bg-card/80 backdrop-blur-sm">
              <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <Card className="p-8 mb-12 bg-primary/10 border-primary/30">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Platforms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Mobilapp</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Native mobilapp for Android og iOS med full offline funksjonalitet.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Android 7.0+</Badge>
              <Badge variant="outline">iOS 12.0+</Badge>
              <Badge variant="outline">GPS støtte</Badge>
              <Badge variant="outline">Offline lagring</Badge>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Web App (PWA)</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Installérbar web-app som fungerer som en ekte app i nettleseren.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Chrome, Safari, Firefox</Badge>
              <Badge variant="outline">Kan installeres</Badge>
              <Badge variant="outline">Offline tilgjengelig</Badge>
              <Badge variant="outline">Push notifications</Badge>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Neste steg for utgivelse
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">For mobilapp (Android/iOS):</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Eksporter til GitHub via "Export to GitHub" knappen</li>
                <li>Følg BUILD_GUIDE.md for byggeinstruksjoner</li>
                <li>Test på ekte enheter</li>
                <li>Submit til Google Play / App Store</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">For web app:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Publiser via Lovable's "Publish" knapp</li>
                <li>Eller host på egen server/hosting</li>
                <li>Del lenke for installasjon som PWA</li>
                <li>Kan også pakkes som desktop app</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm">
              <strong>Merk:</strong> Sjekk RELEASE_CHECKLIST.md før publisering. 
              Test alle funksjoner grundig på ulike enheter først!
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Appen er testet og klar for distribusjon når du har gjennomgått alt!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Klar for testing
            </Button>
            <Button size="lg" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Les byggeguide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}