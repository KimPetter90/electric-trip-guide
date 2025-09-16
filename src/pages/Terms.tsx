import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CreditCard, AlertTriangle, Phone } from 'lucide-react';

export default function Terms() {
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
            <h1 className="text-3xl font-bold">Vilkår og betingelser</h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Avtalevilkår for ElRoute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Ved å bruke ElRoute aksepterer du disse vilkårene. Les dem nøye før du bruker tjenesten.
              </p>
              <p className="text-sm text-muted-foreground">
                Sist oppdatert: {new Date().toLocaleDateString('no-NO')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Tjenestebeskrivelse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  ElRoute er en digital ruteplanleggingstjeneste for elbiler i Norge. 
                  Tjenesten tilbyr:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Optimaliserte ruter for elbiler</li>
                  <li>Informasjon om ladestasjoner</li>
                  <li>Værdata og ruteanalyse</li>
                  <li>Kostnadsberegninger</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Vi forbeholder oss retten til å endre eller oppdatere tjenesten uten forvarsel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Brukerkonto og registrering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Du må være minimum 18 år for å opprette konto</li>
                  <li>Du er ansvarlig for å holde påloggingsinformasjon sikker</li>
                  <li>Kun én konto per person eller organisasjon</li>
                  <li>Du må oppgi korrekte og oppdaterte opplysninger</li>
                  <li>Vi kan suspendere kontoer som bryter våre regler</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  3. Abonnement og betaling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Abonnementsplaner:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Gratis:</strong> 5 ruter per måned</li>
                    <li><strong>Premium:</strong> 100 ruter per måned (199 kr/mnd)</li>
                    <li><strong>Pro:</strong> Ubegrensede ruter (399 kr/mnd)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Betalingsvilkår:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Alle priser er oppgitt inkludert 25% mva.</li>
                    <li>Betaling skjer månedlig på forhånd</li>
                    <li>Betalinger behandles av Stripe</li>
                    <li>Ved manglende betaling suspenderes tjenesten</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    14 dagers angrerett
                  </h4>
                  <p className="text-sm text-blue-700">
                    Som forbruker har du 14 dagers angrerett fra abonnementet startes. 
                    Kontakt oss for å kansellere og få refundert beløpet.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Bruksregler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Du forplikter deg til IKKE å:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Bruke tjenesten til ulovlige formål</li>
                  <li>Dele påloggingsinformasjon med andre</li>
                  <li>Omgå tekniske begrensninger eller sikkerhetstiltak</li>
                  <li>Overbelaste våre servere med automatiserte forespørsler</li>
                  <li>Kopiere, distribuere eller modifisere tjenesten</li>
                  <li>Bruke tjenesten på måter som kan skade andre brukere</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Ansvarsbegrensning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Viktig:</strong> ElRoute er et hjelpemiddel for ruteplanlegging. 
                    Du er selv ansvarlig for å følge trafikkregler og vurdere kjøreforhold.
                  </p>
                </div>
                
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Vi garanterer ikke 100% oppetid eller feilfri drift</li>
                  <li>Ruteforslag er basert på tilgjengelige data og kan være unøyaktige</li>
                  <li>Vi er ikke ansvarlige for tap som følge av tjenestens bruk</li>
                  <li>Vårt ansvar er begrenset til den betalte abonnementsavgiften</li>
                  <li>Ladestasjonsdata kan være utdatert eller feil</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Oppsigelse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Oppsigelse fra din side:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Du kan kansellere abonnementet når som helst</li>
                    <li>Kanselleringen gjelder fra neste faktureringsdato</li>
                    <li>Du beholder tilgang til betalte tjenester til perioden utløper</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Oppsigelse fra vår side:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Vi kan suspendere kontoer som bryter våre regler</li>
                    <li>Ved alvorlige brudd kan kontoen stenges permanent</li>
                    <li>Vi kan avslutte tjenesten med 30 dagers varsel</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Immaterielle rettigheter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  All programvare, design, innhold og varemerker tilhører ElRoute eller våre lisensgivere. 
                  Du får kun rett til å bruke tjenesten i henhold til disse vilkårene.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Lovvalg og verneting</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Disse vilkårene er underlagt norsk rett</li>
                  <li>Tvister løses ved ordinære norske domstoler</li>
                  <li>Forbrukertvister kan tas til Forbrukerrådet</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  9. Kontaktinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>ElRoute</strong></p>
                  <p>E-post: Elroutesup@gmail.com</p>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Klagebehandling:</strong> Klager behandles først av vår kundeservice. 
                    Forbrukertvister kan tas til Forbrukerrådet eller allmenne domstoler.
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