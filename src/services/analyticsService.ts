import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type EventType = 
  | 'playbook_generated'
  | 'playbook_viewed'
  | 'evidence_clicked'
  | 'feedback_submitted'
  | 'meeting_booked'
  | 'pdf_exported';

interface AnalyticsEvent {
  event_type: EventType;
  lead_company?: string;
  metadata?: Json;
}

export const analyticsService = {
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase.from('analytics_events').insert([{
        event_type: event.event_type,
        lead_company: event.lead_company,
        metadata: event.metadata || {},
      }]);

      if (error) {
        console.error('Erro ao rastrear evento:', error);
      }
    } catch (err) {
      console.error('Erro no analytics:', err);
    }
  },

  async getMetrics(days: number = 30): Promise<{
    totalPlaybooks: number;
    avgGenerationTime: number;
    cacheHitRate: number;
    feedbackRate: number;
    meetingRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar playbooks do período
    const { data: playbooks } = await supabase
      .from('playbook_history_public')
      .select('id, generation_time_ms, cache_hit')
      .gte('created_at', startDate.toISOString());

    // Buscar feedbacks do período
    const { data: feedbacks } = await supabase
      .from('playbook_feedback')
      .select('id, meeting_agendado')
      .gte('created_at', startDate.toISOString());

    const totalPlaybooks = playbooks?.length || 0;
    const avgGenerationTime = playbooks?.length 
      ? playbooks.reduce((sum, p) => sum + (p.generation_time_ms || 0), 0) / playbooks.length / 1000
      : 0;
    const cacheHits = playbooks?.filter(p => p.cache_hit).length || 0;
    const cacheHitRate = totalPlaybooks > 0 ? (cacheHits / totalPlaybooks) * 100 : 0;
    const feedbackRate = totalPlaybooks > 0 ? ((feedbacks?.length || 0) / totalPlaybooks) * 100 : 0;
    const meetingsBooked = feedbacks?.filter(f => f.meeting_agendado).length || 0;
    const meetingRate = (feedbacks?.length || 0) > 0 ? (meetingsBooked / feedbacks.length) * 100 : 0;

    return {
      totalPlaybooks,
      avgGenerationTime: Math.round(avgGenerationTime * 10) / 10,
      cacheHitRate: Math.round(cacheHitRate),
      feedbackRate: Math.round(feedbackRate),
      meetingRate: Math.round(meetingRate),
    };
  },

  async getRecentPlaybooks(limit: number = 10): Promise<Array<{
    id: string;
    lead_company: string;
    lead_industry: string | null;
    created_at: string;
    generation_time_ms: number | null;
    evidences_count: number | null;
  }>> {
    const { data } = await supabase
      .from('playbook_history_public')
      .select('id, lead_company, lead_industry, created_at, generation_time_ms, evidences_count')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  },
};
