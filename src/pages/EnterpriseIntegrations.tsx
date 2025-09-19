import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slack, MessageSquare, Webhook, Building2, Calendar, CheckCircle, AlertTriangle, Settings, Zap, Shield, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EnterpriseIntegrations = () => {
  const [activeIntegrations, setActiveIntegrations] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const integrations = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Motta rutenotifications og kostnadsrapporter direkte i Slack',
      icon: <Slack className="h-6 w-6" />,
      category: 'Communication',
      popularity: 'Høy',
      setup_time: '2 min',
      features: ['Real-time notifications', 'Kostnadrapporter', 'Team collaboration', 'Custom commands']
    },
    {
      id: 'teams',
      name: 'Microsoft Teams', 
      description: 'Integrer med Teams for sømløs kommunikasjon og statusoppdateringer',
      icon: <MessageSquare className="h-6 w-6" />,
      category: 'Communication',
      popularity: 'Høy',
      setup_time: '3 min',
      features: ['Teams notifications', 'Møteintegrasjon', 'Gruppechat', 'File sharing']
    },
    {
      id: 'webhook',
      name: 'Custom Webhooks',
      description: 'Koble til egne systemer med sikre webhook-integrasjoner',
      icon: <Webhook className="h-6 w-6" />,
      category: 'Development',
      popularity: 'Medium',
      setup_time: '5 min',
      features: ['HMAC security', 'Custom events', 'Real-time data', 'Flexible payloads']
    },
    {
      id: 'sap',
      name: 'SAP ERP',
      description: 'Direkte integrasjon med SAP for flåtestyring og kostnadsoppfølging',
      icon: <Building2 className="h-6 w-6" />,
      category: 'Enterprise',
      popularity: 'Medium',
      setup_time: '15 min',
      features: ['Fleet management', 'Cost center tracking', 'Maintenance scheduling', 'Reporting']
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      description: 'Automatisk kalenderoppføringer for ruter og ladepauser',
      icon: <Calendar className="h-6 w-6" />,
      category: 'Productivity',
      popularity: 'Høy',
      setup_time: '5 min',
      features: ['Auto scheduling', 'Pre-trip reminders', 'Charging stops', 'Cost summaries']
    }
  ];

  const setupIntegration = async (integration: any, formData: any) => {
    setLoading(integration.id);
    
    try {
      const response = await supabase.functions.invoke(`enterprise-integrations/${integration.id}`, {
        body: formData
      });

      if (response.error) throw response.error;

      setActiveIntegrations(prev => [...prev, integration.id]);
      
      toast({
        title: "Integrasjon aktivert!",
        description: `${integration.name} er nå koblet til ditt system`,
      });
    } catch (error) {
      console.error('Integration error:', error);
      toast({
        title: "Integrasjon feilet",
        description: `Kunne ikke aktivere ${integration.name}. Prøv igjen.`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const IntegrationCard = ({ integration }: { integration: any }) => {
    const [formData, setFormData] = useState<any>({});
    const isActive = activeIntegrations.includes(integration.id);
    const isLoading = loading === integration.id;

    const renderSetupForm = () => {
      switch (integration.id) {
        case 'slack':
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook_url">Slack Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={formData.webhook_url || ''}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="channel">Kanal</Label>
                <Input
                  id="channel"
                  placeholder="#general"
                  value={formData.channel || ''}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template">Meldingsmal</Label>
                <Select 
                  value={formData.message_template || 'default'} 
                  onValueChange={(value) => setFormData({ ...formData, message_template: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard</SelectItem>
                    <SelectItem value="detailed">Detaljert</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case 'teams':
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook_url">Teams Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={formData.webhook_url || ''}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template">Notifikasjonsformat</Label>
                <Select 
                  value={formData.template || 'default'} 
                  onValueChange={(value) => setFormData({ ...formData, template: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard kort</SelectItem>
                    <SelectItem value="adaptive">Adaptive kort</SelectItem>
                    <SelectItem value="hero">Hero kort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case 'webhook':
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://your-api.com/webhook"
                  value={formData.webhook_url || ''}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="secret">Secret (HMAC signering)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Valgfri sikkerhetsnøkkel"
                  value={formData.secret || ''}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="events">Events å lytte til</Label>
                <Textarea
                  id="events"
                  placeholder="route_calculated, cost_optimization, driver_notification"
                  value={formData.events?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, events: e.target.value.split(', ') })}
                />
              </div>
            </div>
          );

        case 'sap':
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sap_server">SAP Server</Label>
                <Input
                  id="sap_server"
                  placeholder="sap-server.company.com"
                  value={formData.sap_server || ''}
                  onChange={(e) => setFormData({ ...formData, sap_server: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Brukernavn</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="system_id">System ID</Label>
                  <Input
                    id="system_id"
                    placeholder="P01"
                    value={formData.system_id || ''}
                    onChange={(e) => setFormData({ ...formData, system_id: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  placeholder="100"
                  value={formData.client_id || ''}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                />
              </div>
            </div>
          );

        case 'outlook':
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="calendar_id">Kalender ID</Label>
                <Input
                  id="calendar_id"
                  placeholder="default (bruker hovedkalender)"
                  value={formData.calendar_id || ''}
                  onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync_routes"
                  checked={formData.sync_routes !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, sync_routes: checked })}
                />
                <Label htmlFor="sync_routes">Synkroniser ruter automatisk</Label>
              </div>
              <div>
                <Label htmlFor="notification_time">Notifikasjon før avgang (minutter)</Label>
                <Input
                  id="notification_time"
                  type="number"
                  placeholder="30"
                  value={formData.notification_time || ''}
                  onChange={(e) => setFormData({ ...formData, notification_time: parseInt(e.target.value) })}
                />
              </div>
            </div>
          );

        default:
          return <div>Konfigurasjon ikke tilgjengelig</div>;
      }
    };

    return (
      <Card className={`transition-all ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-muted'}`}>
                {integration.icon}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {integration.name}
                  {isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={integration.popularity === 'Høy' ? 'default' : 'secondary'}>
                {integration.popularity}
              </Badge>
              <span className="text-xs text-muted-foreground">{integration.setup_time}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Funksjoner:</h4>
              <div className="grid grid-cols-2 gap-2">
                {integration.features.map((feature: string, index: number) => (
                  <div key={index} className="text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {!isActive && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Konfigurering:</h4>
                  {renderSetupForm()}
                </div>
                
                <Button 
                  onClick={() => setupIntegration(integration, formData)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Aktiverer...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Aktiver {integration.name}
                    </>
                  )}
                </Button>
              </>
            )}

            {isActive && (
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Aktiv og konfigurert</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Integrasjonen mottar nå live data fra EV Route API
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              Enterprise Integrasjoner
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Koble EV Route API til dine eksisterende bedriftssystemer for sømløs dataflyt
            </p>
            <div className="flex justify-center gap-6 mt-6">
              {['Communication', 'Enterprise', 'Development', 'Productivity'].map((category) => (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">5+</div>
              <p className="text-sm text-muted-foreground">Tilgjengelige integrasjoner</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{activeIntegrations.length}</div>
              <p className="text-sm text-muted-foreground">Aktive integrasjoner</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <p className="text-sm text-muted-foreground">Oppetid</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">&lt; 5 min</div>
              <p className="text-sm text-muted-foreground">Gjennomsnittlig setup</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="available">Tilgjengelige</TabsTrigger>
            <TabsTrigger value="active">Aktive ({activeIntegrations.length})</TabsTrigger>
            <TabsTrigger value="security">Sikkerhet</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {activeIntegrations.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {integrations
                  .filter(integration => activeIntegrations.includes(integration.id))
                  .map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen aktive integrasjoner</h3>
                  <p className="text-muted-foreground">
                    Aktiver integrasjoner fra "Tilgjengelige" fanen for å komme i gang
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sikkerhet & Samsvar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      'SOC 2 Type II sertifisert',
                      'GDPR og CCPA samsvar',
                      'End-to-end kryptering',
                      'HMAC signaturvalidering',
                      'Rate limiting og DDoS beskyttelse',
                      'Audit logging for alle API-kall'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Kapasitet & Ytelse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { metric: 'API responsetid', value: '< 100ms' },
                      { metric: 'Webhook leveranse', value: '99.95%' },
                      { metric: 'Maksimal payload', value: '10MB' },
                      { metric: 'Rate limit', value: '1000 req/min' },
                      { metric: 'Samtidig forbindelser', value: '10,000+' },
                      { metric: 'Data retention', value: '7 år' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{item.metric}</span>
                        <Badge variant="outline">{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Integrasjonsstatus</CardTitle>
                <CardDescription>
                  Live overvåkning av alle enterprise integrasjoner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-muted">
                          {integration.icon}
                        </div>
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">{integration.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${activeIntegrations.includes(integration.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">
                          {activeIntegrations.includes(integration.id) ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Trenger egendefinerte integrasjoner?</CardTitle>
              <CardDescription>
                Vårt team kan bygge skreddersydde integrasjoner for dine spesifikke behov
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Custom API endpoints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Dedicated security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>2-4 ukers leveranse</span>
                </div>
              </div>
              <Button size="lg" className="w-full">
                Kontakt integrasjonsteam
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseIntegrations;