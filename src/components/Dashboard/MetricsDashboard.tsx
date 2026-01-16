import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Clock, 
  Database, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Building2
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Metrics {
  totalPlaybooks: number;
  avgGenerationTime: number;
  cacheHitRate: number;
  feedbackRate: number;
  meetingRate: number;
}

interface RecentPlaybook {
  id: string;
  lead_company: string;
  lead_industry: string | null;
  created_at: string;
  generation_time_ms: number | null;
  evidences_count: number | null;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentPlaybooks, setRecentPlaybooks] = useState<RecentPlaybook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, playbooks] = await Promise.all([
          analyticsService.getMetrics(30),
          analyticsService.getRecentPlaybooks(10),
        ]);
        setMetrics(metricsData);
        setRecentPlaybooks(playbooks);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Métricas</h1>
        <Badge variant="outline">Últimos 30 dias</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Playbooks Gerados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPlaybooks || 0}</div>
            <p className="text-xs text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgGenerationTime || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Meta: &lt; 30s
              {(metrics?.avgGenerationTime || 0) <= 30 
                ? <Badge variant="default" className="ml-2">✓</Badge>
                : <Badge variant="destructive" className="ml-2">!</Badge>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cacheHitRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: &gt; 50%
              {(metrics?.cacheHitRate || 0) >= 50
                ? <Badge variant="default" className="ml-2">✓</Badge>
                : <Badge variant="secondary" className="ml-2">-</Badge>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.feedbackRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: &gt; 50%
              {(metrics?.feedbackRate || 0) >= 50
                ? <Badge variant="default" className="ml-2">✓</Badge>
                : <Badge variant="secondary" className="ml-2">-</Badge>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.meetingRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: crescente
              <TrendingUp className="inline-block h-3 w-3 ml-2 text-green-500" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Playbooks Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPlaybooks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum playbook gerado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentPlaybooks.map((playbook) => (
                <div 
                  key={playbook.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{playbook.lead_company}</p>
                    <p className="text-sm text-muted-foreground">
                      {playbook.lead_industry || 'Setor não informado'}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{format(new Date(playbook.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                    <div className="flex items-center gap-2 justify-end">
                      {playbook.generation_time_ms && (
                        <Badge variant="outline">
                          {Math.round(playbook.generation_time_ms / 1000)}s
                        </Badge>
                      )}
                      {playbook.evidences_count && (
                        <Badge variant="secondary">
                          {playbook.evidences_count} evidências
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
