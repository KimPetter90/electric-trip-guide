import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, Zap, CheckCircle, ArrowRight, Download } from 'lucide-react';

const CaseStudies = () => {
  const caseStudies = [
    {
      company: "Posten Norge",
      industry: "Logistikk",
      challenge: "Optimalisering av 2.500 kjøretøy i overgangen til elektrisk",
      solution: "Implementerte vår API for ruteplanlegging og ladeoptimalisering",
      results: {
        costSaving: "40%",
        timeReduction: "25%",
        co2Reduction: "85%",
        routesPerDay: "12.000+"
      },
      testimonial: "EV Route API har revolusjonert vår flåtestyring. Vi sparer millioner årlig samtidig som vi når våre bærekraftsmål.",
      testimonialAuthor: "Lars Andersen, Flåtesjef",
      implementation: "3 måneder",
      roi: "280%"
    },
    {
      company: "Oslo Kommune",
      industry: "Offentlig sektor",
      challenge: "Elektrifisering av hele kommunens kjøretøypark innen 2025",
      solution: "Integrerte API-en i eksisterende systemer for optimal ruteplanlegging",
      results: {
        costSaving: "35%",
        timeReduction: "30%",
        co2Reduction: "90%",
        routesPerDay: "8.500+"
      },
      testimonial: "Løsningen har gjort elektrifiseringen sømløs. Innbyggerne merker forbedret service samtidig som vi kutter kostnader betydelig.",
      testimonialAuthor: "Anne Kjersti Berg, Digitaliseringssjef",
      implementation: "2 måneder",
      roi: "320%"
    },
    {
      company: "Equinor",
      industry: "Energi",
      challenge: "Koordinering av servicekjøretøy til offshore-installasjoner",
      solution: "Tilpasset API for spesialiserte ruter og værforhold",
      results: {
        costSaving: "50%",
        timeReduction: "45%",
        co2Reduction: "70%",
        routesPerDay: "3.200+"
      },
      testimonial: "Den prediktive ruteplanleggingen har forbedret vår operasjonelle effektivitet dramatisk. Uunnværlig for vår bærekraftsstrategi.",
      testimonialAuthor: "Kjetil Haugen, Operations Director",
      implementation: "4 måneder",
      roi: "450%"
    }
  ];

  const keyMetrics = [
    { label: "Gjennomsnittlig kostnadsbesparing", value: "42%", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Redusert planleggingstid", value: "33%", icon: <Zap className="h-5 w-5" /> },
    { label: "CO₂-reduksjon", value: "82%", icon: <CheckCircle className="h-5 w-5" /> },
    { label: "Gjennomsnittlig ROI", value: "350%", icon: <Users className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              Suksesshistorier
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Se hvordan ledende norske bedrifter har transformert sin virksomhet med vår EV Route API
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {keyMetrics.map((metric, index) => (
            <Card key={index} className="text-center border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {metric.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Case Studies */}
        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-2xl font-bold">{study.company}</h3>
                      <Badge variant="outline">{study.industry}</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                        Utfordring
                      </h4>
                      <p className="text-sm">{study.challenge}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                        Løsning
                      </h4>
                      <p className="text-sm">{study.solution}</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <blockquote className="text-sm italic mb-3">
                        "{study.testimonial}"
                      </blockquote>
                      <cite className="text-xs text-muted-foreground">
                        — {study.testimonialAuthor}
                      </cite>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-muted/20 p-8">
                  <h4 className="font-semibold text-lg mb-6">Resultater</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">{study.results.costSaving}</div>
                      <div className="text-xs text-muted-foreground">Kostnadsbesparing</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600">{study.results.timeReduction}</div>
                      <div className="text-xs text-muted-foreground">Tidsbesparelse</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-primary">{study.results.co2Reduction}</div>
                      <div className="text-xs text-muted-foreground">CO₂ reduksjon</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <div className="text-2xl font-bold text-purple-600">{study.results.routesPerDay}</div>
                      <div className="text-xs text-muted-foreground">Ruter/dag</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Implementeringstid:</span>
                      <Badge variant="secondary">{study.implementation}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ROI første år:</span>
                      <Badge className="bg-green-600 hover:bg-green-700">{study.roi}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Implementation Process */}
        <div className="mt-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Vår bevisste implementeringsprosess</CardTitle>
              <CardDescription>
                Slik sikrer vi rask tid til verdi og minimal risiko
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    step: "1",
                    title: "Analyse & Planning",
                    description: "Kartlegger behov og definerer målsetninger",
                    timeline: "1-2 uker"
                  },
                  {
                    step: "2", 
                    title: "Pilot implementering",
                    description: "Tester løsningen med begrenset scope",
                    timeline: "2-4 uker"
                  },
                  {
                    step: "3",
                    title: "Full utrulling",
                    description: "Gradvis skalering til hele organisasjonen",
                    timeline: "4-8 uker"
                  },
                  {
                    step: "4",
                    title: "Optimalisering",
                    description: "Kontinuerlig forbedring og support",
                    timeline: "Løpende"
                  }
                ].map((phase, index) => (
                  <div key={index} className="text-center">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                        {phase.step}
                      </div>
                      {index < 3 && (
                        <ArrowRight className="hidden md:block absolute top-6 left-full transform -translate-y-1/2 -translate-x-6 h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <h4 className="font-semibold mb-2">{phase.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                    <Badge variant="outline" className="text-xs">{phase.timeline}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Bli neste suksesshistorie</CardTitle>
              <CardDescription>
                Last ned vår komplette case study rapport og se detaljerte ROI-beregninger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Last ned case studies (PDF)
                </Button>
                <Button className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Book strategisamtale
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                100% konfidensielt • Ingen forpliktelser • Gratis ROI-analyse
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseStudies;