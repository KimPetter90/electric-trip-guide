import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Zap } from 'lucide-react';

export default function SubscriptionSuccess() {
  const { refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh subscription status when landing on success page
    const timer = setTimeout(() => {
      refreshSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshSubscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/src/assets/futuristic-ev-bg.jpg')] bg-cover bg-center opacity-10"></div>
      
      <Card className="w-full max-w-md relative backdrop-blur-sm border-green-200">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ElRoute
            </span>
          </div>
          <CardTitle className="text-2xl text-green-700">Abonnement aktivert!</CardTitle>
          <CardDescription className="text-green-600">
            Takk for at du oppgraderte til ElRoute Premium/Pro. 
            Ditt abonnement er nå aktivt og du har tilgang til alle funksjonene.
            {sessionId && (
              <span className="block text-xs mt-2 text-muted-foreground">
                Transaksjon: {sessionId.slice(-8)}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Hva skjer nå?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Din abonnementsstatus oppdateres automatisk</li>
              <li>• Du har nå tilgang til alle premium-funksjoner</li>
              <li>• Du får en bekreftelse på e-post fra Stripe</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Gå til ruteplanlegger
            </Button>
            <Button 
              onClick={() => navigate('/pricing')} 
              variant="outline"
              className="w-full"
            >
              Se abonnementsstatus
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}