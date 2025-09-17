import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Eye, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  visitors: { date: string; count: number }[];
  pageviews: { date: string; count: number }[];
  totalVisitors: number;
  totalPageviews: number;
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

      // Kall analytics API
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startdate: startDate.toISOString().split('T')[0],
          enddate: endDate.toISOString().split('T')[0],
          granularity: 'daily'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Prosesser dataene
        const processedData: AnalyticsData = {
          visitors: data.visitors || [],
          pageviews: data.pageviews || [],
          totalVisitors: data.visitors?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
          totalPageviews: data.pageviews?.reduce((sum: number, item: any) => sum + item.count, 0) || 0
        };
        
        setAnalytics(processedData);
        setLastUpdated(new Date());
      }
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totale besøkende
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics?.totalVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Siste 30 dager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sidevisninger
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics?.totalPageviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall sider vist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Snitt per besøk
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics && analytics.totalVisitors > 0 
                ? (analytics.totalPageviews / analytics.totalVisitors).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Sider per besøkende
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Aktiv
            </div>
            <p className="text-xs text-muted-foreground">
              Analytics kjører
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nylige aktivitet</CardTitle>
          <CardDescription>
            Besøk og sidevisninger de siste dagene
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laster data...
            </div>
          ) : analytics && analytics.visitors.length > 0 ? (
            <div className="space-y-2">
              {analytics.visitors
                .filter(v => v.count > 0)
                .slice(-7)
                .reverse()
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">
                      {new Date(item.date).toLocaleDateString('no-NO')}
                    </span>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {item.count} besøkende
                      </Badge>
                      <Badge variant="outline">
                        {analytics.pageviews.find(p => p.date === item.date)?.count || 0} sidevisninger
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Ingen data tilgjengelig
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}