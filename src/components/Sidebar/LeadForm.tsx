import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, User, Building2, Linkedin, Phone, Mail, BriefcaseIcon, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLeadStore } from '@/store/leadStore';
import { generateLeadAnalysis } from '@/services/analysisService';
import {
  type LeadInfo,
  INDUSTRY_OPTIONS,
  SAP_STATUS_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  CHALLENGE_OPTIONS,
} from '@/types/lead.types';

const leadFormSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  role: z.string().min(2, 'Cargo é obrigatório'),
  company: z.string().min(2, 'Empresa é obrigatória'),
  linkedinUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  sapStatus: z.enum(['sap_services', 'sap_ecc', 's4hana', 'business_one', 'no_sap', 'unknown']),
  sapVersion: z.string().optional(),
  priority: z.string().optional(),
  industry: z.string().min(1, 'Setor é obrigatório'),
  companySize: z.enum(['small', 'medium', 'large', 'enterprise']),
  challenges: z.array(z.string()).optional(),
  publicSignals: z.string().optional(),
  notes: z.string().optional(),
  leadSource: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onAnalysisGenerated: () => void;
}

export default function LeadForm({ onAnalysisGenerated }: LeadFormProps) {
  const { setLeadInfo, setAnalysis, setLoading, setError, isLoading } = useLeadStore();
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      role: '',
      company: '',
      linkedinUrl: '',
      phone: '',
      email: '',
      sapStatus: 'unknown',
      sapVersion: '',
      priority: '',
      industry: '',
      companySize: 'medium',
      challenges: [],
      publicSignals: '',
      notes: '',
      leadSource: '',
    },
  });

  const handleChallengeToggle = (challenge: string) => {
    setSelectedChallenges((prev) =>
      prev.includes(challenge)
        ? prev.filter((c) => c !== challenge)
        : [...prev, challenge]
    );
  };

  const onSubmit = async (data: LeadFormValues) => {
    const leadInfo: LeadInfo = {
      name: data.name,
      role: data.role,
      company: data.company,
      linkedinUrl: data.linkedinUrl || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      sapStatus: data.sapStatus,
      sapVersion: data.sapVersion || undefined,
      priority: data.priority || undefined,
      industry: data.industry,
      companySize: data.companySize,
      challenges: selectedChallenges,
      publicSignals: data.publicSignals || undefined,
      notes: data.notes || undefined,
      leadSource: data.leadSource || undefined,
    };

    setLeadInfo(leadInfo);
    setLoading(true);
    setError(null);

    try {
      const analysis = await generateLeadAnalysis(leadInfo);
      setAnalysis(analysis);
      onAnalysisGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* Seção 1: Dados do Lead */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <User className="h-4 w-4" />
              <span>Dados do Lead</span>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo *</FormLabel>
                  <FormControl>
                    <Input placeholder="CIO, Gerente de TI, Diretor..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Empresa S.A." {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="URL" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="(11) 99999-9999" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="email@empresa.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Seção 2: Contexto SAP */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <BriefcaseIcon className="h-4 w-4" />
              <span>Contexto SAP</span>
            </div>

            <FormField
              control={form.control}
              name="sapStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status SAP *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SAP_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sapVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão SAP</FormLabel>
                    <FormControl>
                      <Input placeholder="ECC 6.0, S/4 2023..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <Input placeholder="Migração, AMS..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Seção 3: Contexto Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <BarChart3 className="h-4 w-4" />
              <span>Contexto da Empresa</span>
            </div>

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor/Indústria *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porte *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Desafios Percebidos</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {CHALLENGE_OPTIONS.map((challenge) => (
                  <label
                    key={challenge}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                  >
                    <Checkbox
                      checked={selectedChallenges.includes(challenge)}
                      onCheckedChange={() => handleChallengeToggle(challenge)}
                    />
                    <span className="leading-tight">{challenge}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção 4: Informações Adicionais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <FileText className="h-4 w-4" />
              <span>Informações Adicionais</span>
            </div>

            <FormField
              control={form.control}
              name="publicSignals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinais Públicos Observados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notícias, posts LinkedIn, mudanças recentes..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações do SDR</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anotações livres, contexto extra..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem do Lead</FormLabel>
                  <FormControl>
                    <Input placeholder="Evento, Indicação, Inbound..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold gradient-header"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando Análise Completa...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Gerar Análise com IA
              </>
            )}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}
