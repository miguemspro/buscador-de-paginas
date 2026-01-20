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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-28 sm:h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard de Métricas</h1>
        <Badge variant="outline">Últimos 30 dias</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Playbooks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{metrics?.totalPlaybooks || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{metrics?.avgGenerationTime || 0}s</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Meta: &lt;30s
              {(metrics?.avgGenerationTime || 0) <= 30 
                ? <Badge variant="default" className="ml-1 text-[10px] px-1">✓</Badge>
                : <Badge variant="destructive" className="ml-1 text-[10px] px-1">!</Badge>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Cache Hit</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{metrics?.cacheHitRate || 0}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Meta: &gt;50%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{metrics?.feedbackRate || 0}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Meta: &gt;50%</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{metrics?.meetingRate || 0}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Meta: crescente
              <TrendingUp className="inline-block h-3 w-3 ml-1 text-green-500" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Recente */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Playbooks Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {recentPlaybooks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum playbook gerado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentPlaybooks.map((playbook) => (
                <div 
                  key={playbook.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playbook.lead_company}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {playbook.lead_industry || 'Setor não informado'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-sm">
                    <p className="text-muted-foreground">{format(new Date(playbook.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                    <div className="flex items-center gap-1">
                      {playbook.generation_time_ms && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(playbook.generation_time_ms / 1000)}s
                        </Badge>
                      )}
                      {playbook.evidences_count && (
                        <Badge variant="secondary" className="text-xs">
                          {playbook.evidences_count}
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
