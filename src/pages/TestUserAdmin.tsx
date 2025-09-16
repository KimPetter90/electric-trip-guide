import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, Shield } from 'lucide-react';

export default function TestUserAdmin() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgradeUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "E-post påkrevd",
        description: "Vennligst skriv inn en e-postadresse.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('upgrade-test-user', {
        body: { email: email.trim() },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Bruker oppgradert!",
          description: data.message,
        });
        setEmail('');
      } else {
        toast({
          title: "Feil",
          description: data.message || "Kunne ikke oppgradere bruker",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "Feil ved oppgradering",
        description: "Noe gikk galt. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Ingen tilgang</CardTitle>
            <CardDescription>Du må være logget inn for å bruke denne siden.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="absolute inset-0 bg-[url('/src/assets/futuristic-ev-bg.jpg')] bg-cover bg-center opacity-5"></div>
      
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-primary/20 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Testbruker Admin</CardTitle>
                <CardDescription>
                  Oppgrader brukere til testbrukere med premium-tilgang (100 ruter/måned)
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleUpgradeUser} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-postadresse til bruker</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="bruker@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Brukeren må allerede ha opprettet en konto i appen.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Oppgraderer...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Oppgrader til testbruker
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Hva skjer når du oppgraderer?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Brukeren får premium-tilgang uten å betale</li>
                    <li>• Økt grense til 100 ruter per måned</li>
                    <li>• Tilgang til alle premium-funksjoner</li>
                    <li>• Endringen skjer øyeblikkelig</li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>OBS:</strong> Denne funksjonen bør kun brukes for testing og demo-formål. 
                    I produksjon bør du implementere ordentlige admin-roller og sikkerhet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}