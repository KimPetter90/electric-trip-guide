import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Download, Share2, Play, TrendingUp, Users, Zap, Building2, CheckCircle, DollarSign, Clock, MapPin, Battery, Globe, Shield, Smartphone, BarChart3 } from 'lucide-react';

const SalesDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'cover',
      title: 'EV Route API',
      subtitle: 'Transformér din virksomhet med intelligent ruteplanlegging',
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            42%
          </div>
          <p className="text-xl text-muted-foreground">Gjennomsnittlig kostnadsbesparing</p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-muted-foreground">CO₂ reduksjon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">30%</div>
              <div className="text-muted-foreground">Tidsbesparelse</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">350%</div>
              <div className="text-muted-foreground">Gjennomsnittlig ROI</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'problem',
      title: 'Utfordringen med EV-flåtestyring',
      subtitle: 'Kompleksiteten vokser eksponentielt',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dagens utfordringer:</h3>
              <ul className="space-y-3">
                {[
                  'Kompleks ladeinfrastruktur',
                  'Uforutsigbar rekkevidde',
                  'Manuelle planleggingsprosesser',
                  'Høye driftskostnader',
                  'Dårlig sjåførtilfredshet'
                ].map((challenge, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/20 p-6 rounded-lg">
              <h4 className="font-semibold mb-4">Kostnad av inaction:</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Overflødig driftstid</span>
                  <span className="font-semibold text-red-600">+25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ekstra personalkostnader</span>
                  <span className="font-semibold text-red-600">+40%</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilfredse sjåfører</span>
                  <span className="font-semibold text-red-600">+60%</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total ekstra kostnad</span>
                    <span className="text-red-600">2-5M NOK/år</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'solution',
      title: 'Vår løsning: EV Route API',
      subtitle: 'Enterprise-grade ruteplanlegging i sanntid',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Sanntids optimalisering',
                description: 'AI-drevet ruteplanlegging som tilpasser seg trafikk, vær og ladekapasitet'
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Enterprise sikkerhet',
                description: '99.9% oppetid, SOC2 compliance, GDPR-samsvar'
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: 'Sømløs integrasjon',
                description: 'RESTful API som integreres med eksisterende systemer på timer'
              }
            ].map((feature, index) => (
              <Card key={index}>
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">Unik konkurransefordel:</h4>
            <p className="text-sm">Den eneste API-en som kombinerer sanntids trafikkdata, værprognoser, ladestasjonskapasitet og kjøretøyspesifikke parametere i én intelligent løsning.</p>
          </div>
        </div>
      )
    },
    {
      id: 'market',
      title: 'Markedsmulighet',
      subtitle: 'Norge leder EV-revolusjonen',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Markedsstørrelse:</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span>Norsk EV-marked 2024</span>
                  <span className="font-bold">500.000 kjøretøy</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span>Forventet vekst 2025</span>
                  <span className="font-bold text-green-600">+35%</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span>Bedriftssegment</span>
                  <span className="font-bold">180.000 kjøretøy</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10">
                  <span>Adresserbart marked</span>
                  <span className="font-bold">15 mrd NOK</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Drivere:</h3>
              <div className="space-y-3">
                {[
                  { driver: 'Regjeringsmål: 100% EV innen 2025', impact: 'Kritisk' },
                  { driver: 'EU-krav til CO₂-reduksjon', impact: 'Høy' },
                  { driver: 'Økende drivstoffpriser', impact: 'Høy' },
                  { driver: 'Forbedret ladeinfrastruktur', impact: 'Medium' },
                  { driver: 'Teknologimodning', impact: 'Medium' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">{item.driver}</span>
                    <Badge variant={item.impact === 'Kritisk' ? 'destructive' : item.impact === 'Høy' ? 'default' : 'secondary'}>
                      {item.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'competitive',
      title: 'Konkurranselandskap',
      subtitle: 'Vi leder innen intelligens og norsk tilpasning',
      content: (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Funksjon</th>
                  <th className="text-center p-3 bg-primary/10 font-bold">EV Route API</th>
                  <th className="text-center p-3">Google Maps</th>
                  <th className="text-center p-3">Mapbox</th>
                  <th className="text-center p-3">HERE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'EV-spesifik ruteplanlegging', us: '✓', google: '✓', mapbox: '✗', here: '✓' },
                  { feature: 'Sanntids ladestasjonsdata', us: '✓', google: '✗', mapbox: '✗', here: '✗' },
                  { feature: 'Norske værforhold', us: '✓', google: '✗', mapbox: '✗', here: '✗' },
                  { feature: 'Flåteoptimalisering', us: '✓', google: '✗', mapbox: '✗', here: '✓' },
                  { feature: 'Business intelligence', us: '✓', google: '✗', mapbox: '✗', here: '✗' },
                  { feature: 'Norsk support', us: '✓', google: '✗', mapbox: '✗', here: '✓' }
                ].map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{row.feature}</td>
                    <td className="text-center p-3 bg-primary/5">
                      <span className={row.us === '✓' ? 'text-green-600 font-bold' : 'text-red-500'}>{row.us}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className={row.google === '✓' ? 'text-green-600' : 'text-red-500'}>{row.google}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className={row.mapbox === '✓' ? 'text-green-600' : 'text-red-500'}>{row.mapbox}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className={row.here === '✓' ? 'text-green-600' : 'text-red-500'}>{row.here}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">Vår unike posisjon:</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Den eneste løsningen som kombinerer global teknologi med norsk lokalkunnskaper og skreddersyd forretningslogikk.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pricing',
      title: 'Investering & ROI',
      subtitle: 'Lønnsom fra dag én',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                plan: 'Starter',
                price: '2.500 NOK/måned',
                features: ['1.000 API-kall', 'Standard support', 'Månedlig rapport'],
                highlight: false
              },
              {
                plan: 'Professional',
                price: '7.500 NOK/måned', 
                features: ['5.000 API-kall', 'Prioritert support', 'Ukentlige rapporter', 'Custom branding'],
                highlight: true
              },
              {
                plan: 'Enterprise',
                price: 'Fra 25.000 NOK/måned',
                features: ['Ubegrenset API-kall', '24/7 support', 'SLA garantier', 'Custom integrasjoner'],
                highlight: false
              }
            ].map((tier, index) => (
              <Card key={index} className={tier.highlight ? 'border-primary shadow-lg' : ''}>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-between">
                    {tier.plan}
                    {tier.highlight && <Badge>Mest populær</Badge>}
                  </CardTitle>
                  <div className="text-2xl font-bold">{tier.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="bg-muted/20 p-6 rounded-lg">
            <h4 className="font-semibold mb-4">ROI-kalkulator (Professional plan):</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">90.000 NOK</div>
                <div className="text-xs text-muted-foreground">Årlig kostnad</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">380.000 NOK</div>
                <div className="text-xs text-muted-foreground">Årlig besparelse</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">290.000 NOK</div>
                <div className="text-xs text-muted-foreground">Netto gevinst</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">320%</div>
                <div className="text-xs text-muted-foreground">ROI første år</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'next-steps',
      title: 'Neste steg',
      subtitle: 'Fra demo til produksjon på 30 dager',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Implementeringsplan:</h3>
              <div className="space-y-4">
                {[
                  { phase: 'Uke 1-2', title: 'Discovery & Setup', description: 'Kartlegger behov og oppsett av pilot' },
                  { phase: 'Uke 3-4', title: 'Pilot testing', description: 'Test med utvalgte ruter og sjåfører' },
                  { phase: 'Måned 2', title: 'Full deployment', description: 'Gradvis utrulling til hele flåten' },
                  { phase: 'Løpende', title: 'Optimalisering', description: 'Kontinuerlig forbedring og support' }
                ].map((step, index) => (
                  <div key={index} className="flex gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Badge variant="outline">{step.phase}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Hva får du:</h3>
              <div className="space-y-3">
                {[
                  'Dedikert onboarding-team',
                  'Custom integrasjonsstøtte',
                  'Sjåføropplæring og support',
                  'Månedlige ROI-rapporter',
                  'Direkte kontakt med utviklingsteam',
                  'SLA på 99.9% oppetid'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Special tilbud:</h4>
                <p className="text-sm">Book demo før månedens slutt og få 50% rabatt første måned + gratis setup (verdi 25.000 NOK)</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sales Deck</h1>
              <p className="text-sm text-muted-foreground">
                Slide {currentSlide + 1} av {slides.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Eksporter PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Del
              </Button>
              <Button size="sm">
                <Play className="mr-2 h-4 w-4" />
                Start presentasjon
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Slide Content */}
        <Card className="min-h-[600px]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{slides[currentSlide].title}</CardTitle>
            <CardDescription className="text-lg">{slides[currentSlide].subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {slides[currentSlide].content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Forrige
          </Button>

          {/* Slide indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            Neste
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2" />
              <div className="font-medium">Book demo</div>
              <div className="text-sm text-muted-foreground">30 min personlig demo</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto p-4">
            <div className="text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2" />
              <div className="font-medium">ROI-kalkulator</div>
              <div className="text-sm text-muted-foreground">Beregn din besparelse</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto p-4">
            <div className="text-center">
              <Download className="h-6 w-6 mx-auto mb-2" />
              <div className="font-medium">Case studies</div>
              <div className="text-sm text-muted-foreground">Detaljerte kundehistorier</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalesDeck;