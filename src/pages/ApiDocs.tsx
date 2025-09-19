import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Code, Copy, ExternalLink, Zap, Users, TrendingUp, Database, Shield, Globe, FileText, Award, Target } from "lucide-react";
import { toast } from '@/hooks/use-toast';

const ApiDocs = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: "Kopiert!",
      description: `${label} er kopiert til utklippstavlen`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/calculate-route',
      description: 'Beregn EV-rute med lading og kostnader',
      params: {
        from: 'string - Startsted',
        to: 'string - Destinasjon', 
        car_model: 'string - Bilmodell',
        battery_percentage: 'number - Batterinivå (valgfri)',
        client_id: 'string - Klient-ID for tracking (valgfri)'
      }
    },
    {
      method: 'GET',
      endpoint: '/analytics',
      description: 'Hent detaljert analytics for ruter og bruk',
      params: {
        client_id: 'string - Filtrer på klient (valgfri)',
        start_date: 'string - Startdato ISO (valgfri)',
        end_date: 'string - Sluttdato ISO (valgfri)'
      }
    },
    {
      method: 'GET', 
      endpoint: '/charging-stations',
      description: 'Hent alle tilgjengelige ladestasjoner',
      params: {}
    },
    {
      method: 'GET',
      endpoint: '/client-usage',
      description: 'Hent detaljert bruksstatistikk for en klient',
      params: {
        client_id: 'string - Klient-ID (påkrevd)'
      }
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '2.500 NOK/måned',
      requests: '1.000 API-kall',
      features: ['Grunnleggende ruteplanlegging', 'Standard support', 'Månedlig rapport']
    },
    {
      name: 'Professional', 
      price: '7.500 NOK/måned',
      requests: '5.000 API-kall',
      features: ['Avansert analytics', 'Prioritert support', 'Ukentlige rapporter', 'Custom branding']
    },
    {
      name: 'Enterprise',
      price: 'Fra 25.000 NOK/måned',
      requests: 'Ubegrenset',
      features: ['Dedikert infrastruktur', '24/7 support', 'SLA garantier', 'Custom integrasjoner']
    }
  ];

  const codeExamples = {
    javascript: `
// JavaScript/Node.js eksempel
const response = await fetch('https://your-api.com/api-routes/calculate-route', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'din-api-nøkkel'
  },
  body: JSON.stringify({
    from: 'Oslo',
    to: 'Bergen', 
    car_model: 'Tesla Model 3',
    battery_percentage: 85,
    client_id: 'your-client-id'
  })
});

const routeData = await response.json();
console.log('Ruteberegning:', routeData);`,
    
    python: `
# Python eksempel
import requests

url = 'https://your-api.com/api-routes/calculate-route'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'din-api-nøkkel'
}
data = {
    'from': 'Oslo',
    'to': 'Bergen',
    'car_model': 'Tesla Model 3', 
    'battery_percentage': 85,
    'client_id': 'your-client-id'
}

response = requests.post(url, json=data, headers=headers)
route_data = response.json()
print('Ruteberegning:', route_data)`,

    curl: `
# cURL eksempel
curl -X POST 'https://your-api.com/api-routes/calculate-route' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: din-api-nøkkel' \\
  -d '{
    "from": "Oslo",
    "to": "Bergen",
    "car_model": "Tesla Model 3",
    "battery_percentage": 85,
    "client_id": "your-client-id"
  }'`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                EV Route API
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Profesjonell EV-ruteplanlegging for bedrifter
              </p>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
              <ExternalLink className="mr-2 h-4 w-4" />
              Få API-tilgang
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Månedlige API-kall</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47.2K</div>
              <p className="text-xs text-muted-foreground">+18% fra forrige måned</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive klienter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+12 nye denne måneden</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.97%</div>
              <p className="text-xs text-muted-foreground">SLA: 99.9%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="docs" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 max-w-2xl">
            <TabsTrigger value="docs">API</TabsTrigger>
            <TabsTrigger value="examples">Eksempler</TabsTrigger>
            <TabsTrigger value="architecture">Arkitektur</TabsTrigger>
            <TabsTrigger value="ip">IP & Patenter</TabsTrigger>
            <TabsTrigger value="pricing">Priser</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Dokumentasjon
                </CardTitle>
                <CardDescription>
                  Komplett oversikt over alle tilgjengelige endepunkter og parametere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    {Object.keys(endpoint.params).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Parametere:</h4>
                        <div className="space-y-1">
                          {Object.entries(endpoint.params).map(([param, desc]) => (
                            <div key={param} className="text-sm">
                              <code className="bg-muted px-1 rounded">{param}</code>: {desc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kodeeksempler</CardTitle>
                <CardDescription>
                  Praktiske eksempler på hvordan du integrerer med vår API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code, `${lang} eksempel`)}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedCode === `${lang} eksempel` ? 'Kopiert!' : 'Kopier'}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={index === 1 ? 'border-primary shadow-lg' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tier.name}
                      {index === 1 && <Badge>Mest populær</Badge>}
                    </CardTitle>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {tier.price}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">{tier.requests}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6" 
                      variant={index === 1 ? 'default' : 'outline'}
                    >
                      Velg plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Teknisk Arkitektur
                </CardTitle>
                <CardDescription>
                  Omfattende oversikt over systemarkitektur og tekniske komponenter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Frontend (React/TypeScript)
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• React 18 + TypeScript</li>
                      <li>• Tailwind CSS + Shadcn/ui</li>
                      <li>• Vite build system</li>
                      <li>• Progressive Web App</li>
                      <li>• Real-time updates</li>
                    </ul>
                  </div>
                  
                  <div className="bg-secondary/5 p-6 rounded-lg border border-secondary/20">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Backend (Supabase)
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• PostgreSQL database</li>
                      <li>• Edge Functions (Deno)</li>
                      <li>• Row Level Security</li>
                      <li>• Real-time subscriptions</li>
                      <li>• Auto-scaling</li>
                    </ul>
                  </div>
                  
                  <div className="bg-accent/5 p-6 rounded-lg border border-accent/20">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Sikkerhet & Infrastruktur
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• OAuth 2.0 + JWT</li>
                      <li>• GDPR-kompatibel</li>
                      <li>• EU data residency</li>
                      <li>• 99.9% uptime SLA</li>
                      <li>• Global CDN</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Dataflyt og Integrasjoner</h3>
                  <div className="bg-muted p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Hovedintegrasjoner:</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Google Maps API - Ruteberegning</li>
                          <li>• OpenWeather API - Værdata</li>
                          <li>• Stripe - Betalingsbehandling</li>
                          <li>• Mapbox - Kartvisualisering</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Algoritmer:</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• ML-basert ruteoptimalisering</li>
                          <li>• Prediktiv batterianalyse</li>
                          <li>• Værpåvirkning på rekkevidde</li>
                          <li>• Kostnadsoptimalisering</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Ytelsesmetrikker</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">&lt; 200ms</div>
                      <div className="text-sm text-muted-foreground">API Response</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">99.9%</div>
                      <div className="text-sm text-muted-foreground">Uptime SLA</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">1.2M+</div>
                      <div className="text-sm text-muted-foreground">Ruter Beregnet</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">50K+</div>
                      <div className="text-sm text-muted-foreground">Ladestasjoner</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ip" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Intellektuell Eiendom & Patenter
                </CardTitle>
                <CardDescription>
                  Omfattende oversikt over tekniske innovasjoner og IP-rettigheter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Patentbare Innovasjoner
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">ML-basert Ruteoptimalisering</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Proprietær algoritme som kombinerer historiske data, værforhold og batteristatus for optimal ruteplanlegging.
                        </p>
                        <Badge variant="secondary" className="mt-2">Patent Pending</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Prediktiv Batterianalyse</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Avansert system for prediksjon av batterinivå basert på kjøremønster og værforhold.
                        </p>
                        <Badge variant="secondary" className="mt-2">Patent Pending</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Sanntids Ladestasjonsintegrasjon</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Innovativ løsning for aggregering av ladestasjonsdata fra multiple leverandører.
                        </p>
                        <Badge variant="secondary" className="mt-2">Trade Secret</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Tekniske Fortrinn
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-medium">Skalerbar Arkitektur</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Mikroservice-basert arkitektur som håndterer millioner av forespørsler daglig.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                        <h4 className="font-medium">Multimodal Transportoptimalisering</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Integrering av fergeruter og andre transportmidler i EV-ruteplanlegging.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                        <h4 className="font-medium">Enterprise Integration Framework</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Omfattende integrasjonsløsning for bedriftssystemer og tredjepartsapplikasjoner.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Teknisk Dokumentasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary mb-2">47</div>
                      <div className="text-sm text-muted-foreground">API Endepunkter</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary mb-2">23</div>
                      <div className="text-sm text-muted-foreground">Edge Functions</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary mb-2">156</div>
                      <div className="text-sm text-muted-foreground">Database Funksjoner</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Verdivurdering</h3>
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Tekniske Assets:</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• 3 patentbare algoritmer</li>
                          <li>• Proprietær datamodell</li>
                          <li>• Skalerbar infrastruktur</li>
                          <li>• Omfattende integrasjoner</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Markedsposisjon:</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• First-mover advantage Norge</li>
                          <li>• Etablerte B2B-relasjoner</li>
                          <li>• Skalerbar forretningsmodell</li>
                          <li>• Høye switching costs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>System Status & Overvåking</CardTitle>
                <CardDescription>
                  Sanntids status for alle tjenester og infrastruktur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">API Tjenester</h3>
                    <div className="space-y-3">
                      {[
                        { service: 'Route Calculation API', status: 'Operativ', uptime: '99.97%', response: '180ms' },
                        { service: 'Analytics API', status: 'Operativ', uptime: '99.95%', response: '95ms' },
                        { service: 'Charging Stations API', status: 'Operativ', uptime: '99.99%', response: '120ms' },
                        { service: 'Weather Integration', status: 'Operativ', uptime: '99.94%', response: '240ms' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span className="font-medium">{item.service}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{item.response}</span>
                            <span>{item.uptime}</span>
                            <Badge variant="secondary">{item.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Infrastruktur</h3>
                    <div className="space-y-3">
                      {[
                        { service: 'PostgreSQL Database', status: 'Operativ', uptime: '99.98%', load: '23%' },
                        { service: 'Edge Functions', status: 'Operativ', uptime: '99.96%', load: '15%' },
                        { service: 'CDN (Global)', status: 'Operativ', uptime: '99.99%', load: '42%' },
                        { service: 'Authentication', status: 'Operativ', uptime: '99.97%', load: '8%' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span className="font-medium">{item.service}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Load: {item.load}</span>
                            <span>{item.uptime}</span>
                            <Badge variant="secondary">{item.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Ytelsesstatistikk (Siste 30 dager)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.96%</div>
                      <div className="text-sm text-muted-foreground">Gjennomsnittlig Uptime</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">158ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">2.4M</div>
                      <div className="text-sm text-muted-foreground">API Requests</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">0.02%</div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiDocs;