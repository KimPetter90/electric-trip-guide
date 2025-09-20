import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Users, Activity } from 'lucide-react';

interface AnalyticsData {
  totalPageviews: number;
  uniqueVisitors: number;
  todayVisits: number;
}

export default function SimpleAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPageviews: 0,
    uniqueVisitors: 0,
    todayVisits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get analytics from track-analytics function
      const { data, error } = await supabase.functions.invoke('track-analytics', {
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      });

      if (!error && data) {
        setAnalytics({
          totalPageviews: data.totalPageviews || 0,
          uniqueVisitors: data.totalUniqueVisitors || 0,
          todayVisits: data.dailyStats?.[0]?.visitors || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Besøksstatistikk
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Eye className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Totale sidevisninger</p>
            <p className="text-2xl font-bold">{analytics.totalPageviews}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Unike besøkende</p>
            <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">I dag</p>
            <p className="text-2xl font-bold">{analytics.todayVisits}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}