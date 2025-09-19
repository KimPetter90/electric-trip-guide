import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, Zap, TrendingUp, DollarSign, Search, Filter, Download, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientMetrics {
  id: string;
  name: string;
  apiCalls: number;
  revenue: number;
  lastActive: string;
  plan: string;
  status: 'active' | 'inactive' | 'trial';
}

interface UsageData {
  date: string;
  requests: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [clients, setClients] = useState<ClientMetrics[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data for demo - in production this would come from your analytics API
      const mockClients: ClientMetrics[] = [
        {
          id: 'posten-norge',
          name: 'Posten Norge',
          apiCalls: 12540,
          revenue: 37620,
          lastActive: '2024-01-15T10:30:00Z',
          plan: 'Enterprise',
          status: 'active'
        },
        {
          id: 'enova',
          name: 'Enova',
          apiCalls: 8920,
          revenue: 26760,
          lastActive: '2024-01-15T09:15:00Z',
          plan: 'Professional',
          status: 'active'
        },
        {
          id: 'equinor',
          name: 'Equinor',
          apiCalls: 15680,
          revenue: 47040,
          lastActive: '2024-01-15T11:45:00Z',
          plan: 'Enterprise',
          status: 'active'
        },
        {
          id: 'oslo-kommune',
          name: 'Oslo Kommune',
          apiCalls: 4320,
          revenue: 12960,
          lastActive: '2024-01-14T16:20:00Z',
          plan: 'Professional',
          status: 'active'
        },
        {
          id: 'norsk-elbilforening',
          name: 'Norsk Elbilforening',
          apiCalls: 2100,
          revenue: 0,
          lastActive: '2024-01-13T14:10:00Z',
          plan: 'Trial',
          status: 'trial'
        }
      ];

      const mockUsageData: UsageData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          requests: Math.floor(Math.random() * 5000) + 2000,
          revenue: Math.floor(Math.random() * 15000) + 5000
        };
      });

      setClients(mockClients);
      setUsageData(mockUsageData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste dashboard-data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = clients.reduce((sum, client) => sum + client.revenue, 0);
  const totalApiCalls = clients.reduce((sum, client) => sum + client.apiCalls, 0);
  const activeClients = clients.filter(client => client.status === 'active').length;

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const planDistribution = [
    { name: 'Enterprise', value: clients.filter(c => c.plan === 'Enterprise').length, color: '#8884d8' },
    { name: 'Professional', value: clients.filter(c => c.plan === 'Professional').length, color: '#82ca9d' },
    { name: 'Trial', value: clients.filter(c => c.plan === 'Trial').length, color: '#ffc658' }
  ];

  const exportData = () => {
    const csvData = clients.map(client => ({
      'Klient ID': client.id,
      'Navn': client.name,
      'API Kall': client.apiCalls,
      'Inntekt (NOK)': client.revenue,
      'Sist Aktiv': client.lastActive,
      'Plan': client.plan,
      'Status': client.status
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0]).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin-dashboard-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Eksportert",
      description: "Data er eksportert til CSV-fil",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Komplett oversikt over API-bruk og klienter
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Eksporter data
              </Button>
              <Button onClick={loadDashboardData}>
                Oppdater data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total inntekt</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString('no-NO')} NOK</div>
              <p className="text-xs text-muted-foreground">+24% fra forrige måned</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API-kall totalt</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApiCalls.toLocaleString('no-NO')}</div>
              <p className="text-xs text-muted-foreground">+18% fra forrige måned</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive klienter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients}</div>
              <p className="text-xs text-muted-foreground">+3 nye denne måneden</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gjennomsnitt per kall</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalRevenue / totalApiCalls).toFixed(2)} NOK</div>
              <p className="text-xs text-muted-foreground">+5% fra forrige måned</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="clients">Klienter</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Varsler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API-bruk siste 30 dager</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('no-NO', { month: 'short', day: 'numeric' })} />
                      <YAxis />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('no-NO')} />
                      <Line type="monotone" dataKey="requests" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inntekt utvikling</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('no-NO', { weekday: 'short' })} />
                      <YAxis />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('no-NO')} />
                      <Bar dataKey="revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Plan-fordeling</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Klient-oversikt</CardTitle>
                <CardDescription>
                  Detaljert oversikt over alle API-klienter
                </CardDescription>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk klienter..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div key={client.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{client.name}</h3>
                            <Badge variant={client.status === 'active' ? 'default' : client.status === 'trial' ? 'secondary' : 'destructive'}>
                              {client.status === 'active' ? 'Aktiv' : client.status === 'trial' ? 'Prøveperiode' : 'Inaktiv'}
                            </Badge>
                            <Badge variant="outline">{client.plan}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {client.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Sist aktiv: {new Date(client.lastActive).toLocaleDateString('no-NO')}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-2xl font-bold">{client.apiCalls.toLocaleString('no-NO')}</div>
                          <div className="text-sm text-muted-foreground">API-kall</div>
                          <div className="text-lg font-semibold text-green-600">
                            {client.revenue.toLocaleString('no-NO')} NOK
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top endepunkter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { endpoint: '/calculate-route', calls: 28540, percentage: 65 },
                      { endpoint: '/analytics', calls: 8920, percentage: 20 },
                      { endpoint: '/charging-stations', calls: 4460, percentage: 10 },
                      { endpoint: '/client-usage', calls: 2230, percentage: 5 }
                    ].map((item) => (
                      <div key={item.endpoint} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{item.endpoint}</code>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <span className="font-medium">{item.calls.toLocaleString('no-NO')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feilrate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { code: '200 OK', count: 42180, percentage: 95.2 },
                      { code: '400 Bad Request', count: 1580, percentage: 3.6 },
                      { code: '429 Rate Limited', count: 445, percentage: 1.0 },
                      { code: '500 Server Error', count: 89, percentage: 0.2 }
                    ].map((item) => (
                      <div key={item.code} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={item.code.startsWith('2') ? 'secondary' : 'destructive'}>
                            {item.code}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <span className="font-medium">{item.count.toLocaleString('no-NO')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Systemvarsler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: 'warning',
                      title: 'Høy trafikk detektert',
                      message: 'API-trafikk er 40% høyere enn normalt de siste 2 timene',
                      time: '10 min siden'
                    },
                    {
                      type: 'info',
                      title: 'Ny klient registrert',
                      message: 'Bergen Kommune har registrert seg for Professional-plan',
                      time: '2 timer siden'
                    },
                    {
                      type: 'success',
                      title: 'Oppgrading fullført',
                      message: 'Database-oppgraderingen er fullført uten feil',
                      time: '1 dag siden'
                    }
                  ].map((alert, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <span className="text-sm text-muted-foreground">{alert.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;