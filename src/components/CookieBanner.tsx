import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Cookie, X, Settings, CheckCircle } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const savePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg">
        <CardContent className="p-6">
          {!showSettings ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Vi bruker cookies</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vi bruker cookies for å gi deg best mulig opplevelse. Nødvendige cookies sikrer 
                    at nettsiden fungerer, mens andre cookies hjelper oss å forbedre tjenesten.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/privacy')}
                    className="p-0 h-auto text-sm"
                  >
                    Les mer i vår personvernerklæring
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Tilpass
                </Button>
                <Button
                  variant="outline"
                  onClick={acceptNecessary}
                  className="w-full sm:w-auto"
                >
                  Kun nødvendige
                </Button>
                <Button
                  onClick={acceptAll}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Godta alle
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Cookie-preferanser</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Nødvendige cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Kreves for at nettsiden skal fungere korrekt
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">Alltid aktiv</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <h4 className="font-medium">Analytics cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Hjelper oss å forstå hvordan du bruker nettsiden
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      analytics: e.target.checked
                    })}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <h4 className="font-medium">Marketing cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Brukes for å vise relevante annonser og markedsføring
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      marketing: e.target.checked
                    })}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={acceptNecessary}
                  className="flex-1"
                >
                  Kun nødvendige
                </Button>
                <Button
                  onClick={savePreferences}
                  className="flex-1"
                >
                  Lagre preferanser
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}