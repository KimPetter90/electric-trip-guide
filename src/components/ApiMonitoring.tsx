import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, DollarSign, Activity, RefreshCw, TrendingUp, MapPin, Cloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ApiUsageData {
  endpoint: string;
  calls: number;
  estimatedCost: number;
  date: string;
}

interface CostEstimates {
  [key: string]: {
    costPerCall: number;
    freeQuota: number;
    description: string;
    icon: React.ElementType;
  };
}

// Estimerte kostnader basert på vanlige API-priser
const costEstimates: CostEstimates = {
  'google-maps-proxy': {
    costPerCall: 0.005, // $0.005 per Maps API kall
    freeQuota: 28000, // Google Maps free tier per måned
    description: 'Google Maps API',
    icon: MapPin
  },
  'weather-service': {
    costPerCall: 0.0001, // OpenWeather er mye billigere
    freeQuota: 1000, // 1000 kall per dag gratis
    description: 'Weather API',
    icon: Cloud
  },
  'mapbox-token': {
    costPerCall: 0.0004, // Mapbox pricing
    freeQuota: 50000, // Mapbox free tier
    description: 'Mapbox API',
    icon: MapPin
  },
  'check-subscription': {
    costPerCall: 0, // Stripe API er gratis
    freeQuota: Infinity,
    description: 'Stripe API',
    icon: DollarSign
  },
  'track-analytics': {
    costPerCall: 0, // Intern tracking
    freeQuota: Infinity,
    description: 'Analytics Tracking',
    icon: Activity
  }
};

interface ApiMonitoringProps {
  className?: string;
}

export default function ApiMonitoring({ className }: ApiMonitoringProps) {
  const { user } = useAuth();
  const [apiUsage, setApiUsage] = useState<ApiUsageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sjekk om brukeren har tilgang (kun for din email)
  const hasAccess = user?.email === 'kpkopperstad@gmail.com';

  const fetchApiUsage = async () => {
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_usage_log')
        .select('endpoint, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching API usage:', error);
        return;
      }

      // Grupper data etter endpoint og dato
      const grouped: { [key: string]: { [date: string]: number } } = {};
      
      data?.forEach((log) => {
        const endpoint = log.endpoint;
        const date = new Date(log.created_at).toISOString().split('T')[0];
        
        if (!grouped[endpoint]) grouped[endpoint] = {};
        if (!grouped[endpoint][date]) grouped[endpoint][date] = 0;
        grouped[endpoint][date]++;
      });

      // Konverter til array format
      const usageData: ApiUsageData[] = [];
      Object.keys(grouped).forEach(endpoint => {
        Object.keys(grouped[endpoint]).forEach(date => {
          const calls = grouped[endpoint][date];
          const estimate = costEstimates[endpoint] || { costPerCall: 0.001, freeQuota: 1000, description: endpoint, icon: Activity };
          const estimatedCost = Math.max(0, calls - estimate.freeQuota) * estimate.costPerCall;
          
          usageData.push({
            endpoint,
            calls,
            estimatedCost,
            date
          });
        });
      });

      setApiUsage(usageData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchApiUsage();
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return null;
  }

  // Beregn totale kostnader for siste 7 dager
  const totalCost = apiUsage.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalCalls = apiUsage.reduce((sum, item) => sum + item.calls, 0);

  // Grupper etter endpoint for sammendrag
  const endpointSummary: { [key: string]: { calls: number; cost: number } } = {};
  apiUsage.forEach(item => {
    if (!endpointSummary[item.endpoint]) {
      endpointSummary[item.endpoint] = { calls: 0, cost: 0 };
    }
    endpointSummary[item.endpoint].calls += item.calls;
    endpointSummary[item.endpoint].cost += item.estimatedCost;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Kostnadsovervåking</h2>
          <p className="text-muted-foreground">
            Overvåk API-bruk og estimerte kostnader de siste 7 dagene
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              Oppdatert {lastUpdated.toLocaleTimeString('no-NO')}
            </Badge>
          )}
          <Button 
            onClick={fetchApiUsage} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
      </div>

      {/* Kostnadsoversikt */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total kostnad (7 dager)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCost < 0.01 ? 'Innenfor gratis kvoter' : 'Estimert kostnad'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API-kall totalt</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              Siste 7 dager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko nivå</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${totalCost > 1 ? 'text-red-500' : totalCost > 0.1 ? 'text-yellow-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalCost > 1 ? 'text-red-600' : totalCost > 0.1 ? 'text-yellow-600' : 'text-green-600'}`}>
              {totalCost > 1 ? 'HØY' : totalCost > 0.1 ? 'MEDIUM' : 'LAV'}
            </div>
            <p className="text-xs text-muted-foreground">
              Basert på API-bruk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoint Oversikt */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints - Siste 7 dager</CardTitle>
          <CardDescription>
            Oversikt over API-bruk og estimerte kostnader per tjeneste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(endpointSummary).map((endpoint) => {
              const summary = endpointSummary[endpoint];
              const estimate = costEstimates[endpoint] || { costPerCall: 0.001, freeQuota: 1000, description: endpoint, icon: Activity };
              const Icon = estimate.icon;
              const usagePercent = Math.min(100, (summary.calls / estimate.freeQuota) * 100);
              
              return (
                <div key={endpoint} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{estimate.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {summary.calls} kall • ${summary.cost.toFixed(4)} estimert kostnad
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 mb-1">
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {usagePercent.toFixed(1)}% av kvote
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {apiUsage.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Laster API-data...' : 'Ingen API-data tilgjengelig'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kostnadsvarsel */}
      {totalCost > 0.1 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Kostnadsvarsel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <p>
              Du nærmer deg betalte API-tjenester. Vurder å sette opp kostnadsgrenser i:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Google Cloud Console for Maps API</li>
              <li>OpenWeather API dashboard</li>
              <li>Mapbox dashboard</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}