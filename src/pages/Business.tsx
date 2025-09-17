import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  MapPin, 
  Zap, 
  Crown,
  Check,
  ArrowRight,
  BarChart3,
  Shield,
  Globe,
  Smartphone
} from "lucide-react";

const businessFeatures = [
  {
    icon: <Building2 className="h-5 w-5" />,
    title: "Flåtehåndtering",
    description: "Administrer hele elbil-flåten fra ett dashboard"
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Avansert analyse",
    description: "Detaljerte rapporter om forbruk, kostnader og effektivitet"
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Bedriftsintegrasjon",
    description: "API-tilgang for integrasjon med eksisterende systemer"
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Enterprise sikkerhet",
    description: "GDPR-compliance og dedikert support"
  }
];

const apiFeatures = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Værpåvirkning API",
    description: "Integrer realistiske rekkevidde-beregninger i dine tjenester"
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Ladestasjon API",
    description: "Sanntids data fra 900+ ladestasjoner i Norge"
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Ruteoptimalisering",
    description: "AI-drevet ruteplanlegging som tjeneste"
  }
];

export default function Business() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    fleetSize: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Her ville vi sendt skjemaet til backend
    console.log("Business inquiry:", contactForm);
    alert("Takk for din henvendelse! Vi tar kontakt innen 24 timer.");
  };

  return (
    <div className="min-h-screen bg-gradient-cyber">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-orbitron font-bold text-gradient">ElRoute Business</span>
            </div>
            <Button onClick={() => navigate("/")} variant="outline">
              Tilbake til hovedsiden
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Building2 className="h-3 w-3 mr-1" />
              B2B Løsninger
            </Badge>
            <h1 className="text-4xl md:text-6xl font-orbitron font-black text-gradient mb-6">
              Skalér elbil-flåten din
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Profesjonelle ruteplanlegging- og flåteløsninger for bedrifter som satser på bærekraft
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-electric font-orbitron">
                <Users className="h-4 w-4 mr-2" />
                Be om demo
              </Button>
              <Button size="lg" variant="outline" className="font-orbitron">
                Se priser
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Flåtehåndtering */}
          <Card className="p-8 glass-card cyber-glow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold text-gradient">Flåtehåndtering</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              {businessFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-background/30 rounded-lg">
                  <div className="text-primary mt-1">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">Perfekt for:</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  Leasingselskaper
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  Bedrifter med 10+ elbiler
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  Kommune og offentlig sektor
                </li>
              </ul>
            </div>
          </Card>

          {/* API som tjeneste */}
          <Card className="p-8 glass-card neon-glow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Globe className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold text-gradient">API som tjeneste</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              {apiFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-background/30 rounded-lg">
                  <div className="text-secondary mt-1">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold text-secondary mb-2">Perfekt for:</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-secondary" />
                  App-utviklere
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-secondary" />
                  Bilprodusenter
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-secondary" />
                  Navigasjonsselskaper
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <section>
          <Card className="max-w-2xl mx-auto p-8 glass-card">
            <h2 className="text-2xl font-orbitron font-bold text-gradient text-center mb-8">
              Interessert i bedriftsløsninger?
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Bedriftsnavn</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Kontaktperson</Label>
                  <Input
                    id="contactPerson"
                    value={contactForm.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fleetSize">Antall elbiler i flåten</Label>
                <Input
                  id="fleetSize"
                  value={contactForm.fleetSize}
                  onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                  placeholder="f.eks. 25 biler"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Beskrivelse av behov</Label>
                <textarea
                  id="message"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Fortell oss om dine behov..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-gradient-electric font-orbitron">
                <ArrowRight className="h-4 w-4 mr-2" />
                Send henvendelse
              </Button>
            </form>
          </Card>
        </section>

        {/* Stats */}
        <section className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 glass-card rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">150+</div>
              <div className="text-muted-foreground">Elbil-modeller</div>
            </div>
            <div className="p-6 glass-card rounded-lg">
              <div className="text-3xl font-bold text-secondary mb-2">900+</div>
              <div className="text-muted-foreground">Ladestasjoner</div>
            </div>
            <div className="p-6 glass-card rounded-lg">
              <div className="text-3xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-muted-foreground">Oppetid</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}