import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import futuristicBg from "@/assets/futuristic-ev-bg.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });

  // Redirect hvis allerede logget inn
  if (user) {
    navigate("/");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Feil innloggingsopplysninger",
            description: "E-post eller passord er feil. Prøv igjen.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Velkommen tilbake!",
        description: "Du er nå logget inn på ElRoute."
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Innlogging feilet",
        description: error.message || "En ukjent feil oppstod.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Bruker eksisterer allerede",
            description: "En konto med denne e-posten eksisterer allerede. Prøv å logge inn i stedet.",
            variant: "destructive"
          });
        } else if (error.message.includes("Password should be")) {
          toast({
            title: "Svakt passord",
            description: "Passordet må være minst 6 tegn langt.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Konto opprettet!",
        description: "Sjekk e-posten din for å bekrefte kontoen og logge inn.",
      });
      
      // Bytt til innlogging fane
      const tabsList = document.querySelector('[role="tablist"]');
      const signInTab = tabsList?.querySelector('[value="signin"]') as HTMLElement;
      signInTab?.click();
      
    } catch (error: any) {
      toast({
        title: "Registrering feilet",
        description: error.message || "En ukjent feil oppstod.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Futuristisk bakgrunn */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${futuristicBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%2300ff88' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }}></div>

      <div className="relative container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary animate-glow-pulse" />
              <h1 className="text-4xl font-orbitron font-black text-gradient">ElRoute</h1>
              <Zap className="h-8 w-8 text-primary animate-glow-pulse" />
            </div>
            <p className="text-muted-foreground">Smart ruteplanlegging for elbiler</p>
          </div>

          {/* Auth Card */}
          <Card className="p-6 glass-card cyber-glow border-primary/30">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-orbitron">Logg inn</TabsTrigger>
                <TabsTrigger value="signup" className="font-orbitron">Registrer</TabsTrigger>
              </TabsList>
              
              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-post
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="din@epost.no"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Passord
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-electric hover:shadow-neon font-orbitron"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logger inn...
                      </>
                    ) : (
                      'Logg inn'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Fullt navn
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ditt navn"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-post
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="din@epost.no"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Passord
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={6}
                      className="bg-background/50 border-border focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 tegn</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-eco hover:shadow-glow font-orbitron"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Oppretter konto...
                      </>
                    ) : (
                      'Opprett konto'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til hovedsiden
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}