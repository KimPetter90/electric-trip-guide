import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Mail } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-3xl font-bold">Personvernerklæring</h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Om denne erklæringen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Denne personvernerklæringen beskriver hvordan ElRoute ("vi", "oss", "vår") samler inn, 
                bruker og beskytter dine personopplysninger når du bruker vår tjeneste.
              </p>
              <p className="text-sm text-muted-foreground">
                Sist oppdatert: {new Date().toLocaleDateString('no-NO')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Hvilke opplysninger samler vi inn?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Kontoopplysninger:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>E-postadresse (for innlogging og kommunikasjon)</li>
                    <li>Abonnementsstatus og betalingshistorikk</li>
                    <li>Bruksstatistikk (antall ruter planlagt)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Rutedata:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Start- og stoppadresser du angir</li>
                    <li>Valgte elbilmodeller</li>
                    <li>Reisepreferanser (tilhengervekt, batterinivå)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tekniske data:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>IP-adresse og nettleserinformasjon</li>
                    <li>Cookies for funksjonalitet og preferanser</li>
                    <li>Feillogger for å forbedre tjenesten</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Hvordan bruker vi opplysningene?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Levere ruteplanleggingstjenester</li>
                  <li>Administrere din konto og abonnement</li>
                  <li>Behandle betalinger gjennom Stripe</li>
                  <li>Sende viktige oppdateringer om tjenesten</li>
                  <li>Forbedre og utvikle nye funksjoner</li>
                  <li>Sikre tjenestens sikkerhet og forhindre misbruk</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deling av opplysninger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Vi deler dine opplysninger med:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Stripe:</strong> For betalingsbehandling (kryptert og sikret)</li>
                  <li><strong>Google Maps:</strong> For kartdata og ruteberegninger</li>
                  <li><strong>Supabase:</strong> For sikker datalagring (EU-servere)</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Vi selger aldri dine personopplysninger til tredjeparter.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dine rettigheter (GDPR)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li><strong>Innsyn:</strong> Se hvilke opplysninger vi har om deg</li>
                  <li><strong>Retting:</strong> Endre feil i dine opplysninger</li>
                  <li><strong>Sletting:</strong> Be om å få slettet dine opplysninger</li>
                  <li><strong>Begrensning:</strong> Begrense behandlingen av dine data</li>
                  <li><strong>Dataportabilitet:</strong> Få utlevert dine data</li>
                  <li><strong>Motsette deg:</strong> Motsette deg visse former for behandling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sikkerhet og oppbevaring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Vi bruker industristandarder for å beskytte dine opplysninger:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>SSL/TLS-kryptering for all dataoverføring</li>
                  <li>Sikre servere hos EU-baserte tilbydere</li>
                  <li>Regelmessige sikkerhetskopier</li>
                  <li>Begrenset tilgang for ansatte</li>
                </ul>
                <p className="text-sm">
                  Vi oppbevarer dine opplysninger så lenge du har en aktiv konto, 
                  og i inntil 3 år etter kontoens nedleggelse for regnskapsmessige formål.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Kontakt oss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Har du spørsmål om denne personvernerklæringen eller ønsker å utøve dine rettigheter?
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>E-post:</strong> Elroutesup@gmail.com</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Du kan også klage til Datatilsynet hvis du mener vi behandler dine 
                  personopplysninger i strid med personvernlovgivningen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}