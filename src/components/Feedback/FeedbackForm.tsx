import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analyticsService';
import type { ProbablePain } from '@/types/playbook.types';

interface FeedbackFormProps {
  playbookId: string;
  leadCompany: string;
  pains: ProbablePain[];
  onClose: () => void;
  onSubmit?: () => void;
}

export function FeedbackForm({ playbookId, leadCompany, pains, onClose, onSubmit }: FeedbackFormProps) {
  const [confirmedPains, setConfirmedPains] = useState<string[]>([]);
  const [caseUsed, setCaseUsed] = useState<string>('nao_apresentei');
  const [leadResponse, setLeadResponse] = useState<string>('sem_resposta');
  const [meetingBooked, setMeetingBooked] = useState<boolean>(false);
  const [meetingDate, setMeetingDate] = useState<Date | undefined>();
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePain = (pain: string) => {
    setConfirmedPains(prev => 
      prev.includes(pain) 
        ? prev.filter(p => p !== pain)
        : [...prev, pain]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('playbook_feedback').insert({
        playbook_id: playbookId,
        dores_confirmadas: confirmedPains,
        case_utilizado: caseUsed,
        resposta_lead: leadResponse,
        meeting_agendado: meetingBooked,
        meeting_data: meetingDate?.toISOString().split('T')[0],
        comentarios: comments,
      });

      if (error) throw error;

      await analyticsService.trackEvent({
        event_type: 'feedback_submitted',
        lead_company: leadCompany,
        metadata: {
          pains_confirmed: confirmedPains.length,
          case_used: caseUsed,
          lead_response: leadResponse,
          meeting_booked: meetingBooked,
        },
      });

      if (meetingBooked) {
        await analyticsService.trackEvent({
          event_type: 'meeting_booked',
          lead_company: leadCompany,
        });
      }

      toast.success('Feedback enviado com sucesso!');
      onSubmit?.();
      onClose();
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
      toast.error('Erro ao enviar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Feedback do Contato</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dores Confirmadas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Dores Confirmadas pelo Lead</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pains.map((pain, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Checkbox
                  id={`pain-${idx}`}
                  checked={confirmedPains.includes(pain.pain)}
                  onCheckedChange={() => togglePain(pain.pain)}
                />
                <label htmlFor={`pain-${idx}`} className="text-sm cursor-pointer">
                  {pain.pain}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Case Utilizado */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">O Case Apresentado Foi Útil?</Label>
          <RadioGroup value={caseUsed} onValueChange={setCaseUsed}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="util" id="case-util" />
              <Label htmlFor="case-util" className="text-sm cursor-pointer">Útil e relevante</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="parcial" id="case-parcial" />
              <Label htmlFor="case-parcial" className="text-sm cursor-pointer">Parcialmente útil</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="nao_util" id="case-nao" />
              <Label htmlFor="case-nao" className="text-sm cursor-pointer">Não foi útil</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="nao_apresentei" id="case-na" />
              <Label htmlFor="case-na" className="text-sm cursor-pointer">Não apresentei</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Resposta do Lead */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Resposta do Lead</Label>
          <RadioGroup value={leadResponse} onValueChange={setLeadResponse}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="positiva" id="resp-pos" />
              <Label htmlFor="resp-pos" className="text-sm cursor-pointer">Positiva - interesse</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="neutra" id="resp-neu" />
              <Label htmlFor="resp-neu" className="text-sm cursor-pointer">Neutra - talvez futuro</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="negativa" id="resp-neg" />
              <Label htmlFor="resp-neg" className="text-sm cursor-pointer">Negativa - sem interesse</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="sem_resposta" id="resp-sr" />
              <Label htmlFor="resp-sr" className="text-sm cursor-pointer">Sem resposta</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Meeting Agendado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="meeting"
              checked={meetingBooked}
              onCheckedChange={(checked) => setMeetingBooked(checked === true)}
            />
            <Label htmlFor="meeting" className="text-sm font-medium cursor-pointer">
              Meeting Agendado?
            </Label>
          </div>
          
          {meetingBooked && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {meetingDate ? format(meetingDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={meetingDate}
                  onSelect={setMeetingDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Comentários */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Comentários (opcional)</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Observações sobre o contato..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
