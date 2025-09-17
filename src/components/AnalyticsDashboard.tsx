import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Eye, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  visitors: { date: string; count: number }[];
  pageviews: { date: string; count: number }[];
  uniqueVisitors: { date: string; count: number }[];
  loggedInUsers: { date: string; count: number }[];
  totalVisitors: number;
  totalPageviews: number;
  totalUniqueVisitors: number;
  totalLoggedInUsers: number;
  returningVisitors: number;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sjekk om brukeren har tilgang (kun for din email)
  const hasAccess = user?.email === 'kpkopperstad@gmail.com';

  const fetchAnalytics = async (days: number = 30) => {
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Simuler API-kall med mer detaljerte data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data basert på reelle analytics mønstre
      const mockData: AnalyticsData = {
        visitors: [
          { date: '2025-09-16', count: 8 },
          { date: '2025-09-15', count: 6 },
          { date: '2025-09-14', count: 12 },
          { date: '2025-09-13', count: 4 },
          { date: '2025-09-12', count: 7 },
          { date: '2025-09-11', count: 9 },
          { date: '2025-09-10', count: 5 }
        ],
        pageviews: [
          { date: '2025-09-16', count: 15 },
          { date: '2025-09-15', count: 11 },
          { date: '2025-09-14', count: 24 },
          { date: '2025-09-13', count: 8 },
          { date: '2025-09-12', count: 14 },
          { date: '2025-09-11', count: 18 },
          { date: '2025-09-10', count: 10 }
        ],
        uniqueVisitors: [
          { date: '2025-09-16', count: 7 },
          { date: '2025-09-15', count: 5 },
          { date: '2025-09-14', count: 10 },
          { date: '2025-09-13', count: 4 },
          { date: '2025-09-12', count: 6 },
          { date: '2025-09-11', count: 8 },
          { date: '2025-09-10', count: 4 }
        ],
        loggedInUsers: [
          { date: '2025-09-16', count: 3 },
          { date: '2025-09-15', count: 2 },
          { date: '2025-09-14', count: 4 },
          { date: '2025-09-13', count: 1 },
          { date: '2025-09-12', count: 2 },
          { date: '2025-09-11', count: 3 },
          { date: '2025-09-10', count: 1 }
        ],
        totalVisitors: 51,
        totalPageviews: 100,
        totalUniqueVisitors: 44,
        totalLoggedInUsers: 16,
        returningVisitors: 7
      };
      
      setAnalytics(mockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Feil ved lasting av analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchAnalytics();
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return null; // Ikke vis noe hvis brukeren ikke har tilgang
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Oversikt over nettstedets besøksstatistikk
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Oppdatert {lastUpdated.toLocaleTimeString('no-NO')}
            </Badge>
          )}
          <Button 
            onClick={() => fetchAnalytics()} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unike besøkende
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics?.totalUniqueVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Forskjellige IP-adresser
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Innloggede brukere
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : analytics?.totalLoggedInUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Autentiserte sesjoner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totale visninger
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics?.totalPageviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Alle sidevisninger
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tilbakevendende
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : analytics?.returningVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Kommer tilbake
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Konverteringsrate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : analytics && analytics.totalUniqueVisitors > 0 
                ? Math.round((analytics.totalLoggedInUsers / analytics.totalUniqueVisitors) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Besøkende → Registrering
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daglige statistikker</CardTitle>
            <CardDescription>
              Besøkende og sidevisninger de siste 7 dagene
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laster data...
              </div>
            ) : analytics && analytics.visitors.length > 0 ? (
              <div className="space-y-3">
                {analytics.visitors
                  .slice(-7)
                  .reverse()
                  .map((item, index) => {
                    const pageviewData = analytics.pageviews.find(p => p.date === item.date);
                    const uniqueData = analytics.uniqueVisitors.find(u => u.date === item.date);
                    const loggedInData = analytics.loggedInUsers.find(l => l.date === item.date);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {new Date(item.date).toLocaleDateString('no-NO', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {uniqueData?.count || 0} unike av {item.count} totalt
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            👥 {item.count}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            👁️ {pageviewData?.count || 0}
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            🔐 {loggedInData?.count || 0}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen data tilgjengelig
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Brukerengasjement</CardTitle>
            <CardDescription>
              Detaljer om brukeraktivitet og registreringer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Unike besøkende</div>
                  <div className="text-xs text-muted-foreground">Forskjellige IP-adresser</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.totalUniqueVisitors || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Registrerte brukere</div>
                  <div className="text-xs text-muted-foreground">Innloggede sesjoner</div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {analytics?.totalLoggedInUsers || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Konverteringsrate</div>
                  <div className="text-xs text-muted-foreground">Besøkende som registrerer seg</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics && analytics.totalUniqueVisitors > 0 
                    ? Math.round((analytics.totalLoggedInUsers / analytics.totalUniqueVisitors) * 100)
                    : 0
                  }%
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Sider per sesjon</div>
                  <div className="text-xs text-muted-foreground">Gjennomsnittlig engasjement</div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics && analytics.totalUniqueVisitors > 0 
                    ? (analytics.totalPageviews / analytics.totalUniqueVisitors).toFixed(1)
                    : '0'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}