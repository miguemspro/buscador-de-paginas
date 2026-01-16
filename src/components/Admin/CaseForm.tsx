import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MetaCase, INDUSTRIES, COMPANY_SIZES, SAP_MODULES, SAP_SOLUTIONS, PROJECT_TYPES } from '@/types/admin.types';
import { Loader2 } from 'lucide-react';

const caseSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  industry: z.string().min(1, 'Setor é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  country: z.string().default('Brasil'),
  company_size: z.string().default('enterprise'),
  product_sold: z.string().optional(),
  project_type: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  key_result: z.string().optional(),
  case_url: z.string().url().optional().or(z.literal('')),
  project_date: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CaseFormValues = z.infer<typeof caseSchema>;

interface CaseFormProps {
  initialData?: MetaCase | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CaseForm({ initialData, onSuccess, onCancel }: CaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(initialData?.sap_modules || []);
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>(initialData?.sap_solutions || []);
  const [results, setResults] = useState<string[]>(initialData?.results || ['']);
  const [keywords, setKeywords] = useState<string[]>(initialData?.industry_keywords || []);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      company_name: initialData?.company_name || '',
      industry: initialData?.industry || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      country: initialData?.country || 'Brasil',
      company_size: initialData?.company_size || 'enterprise',
      product_sold: initialData?.product_sold || '',
      project_type: initialData?.project_type || '',
      challenge: initialData?.challenge || '',
      solution: initialData?.solution || '',
      key_result: initialData?.key_result || '',
      case_url: initialData?.case_url || '',
      project_date: initialData?.project_date || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const toggleModule = (module: string) => {
    setSelectedModules(prev => 
      prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
    );
  };

  const toggleSolution = (solution: string) => {
    setSelectedSolutions(prev => 
      prev.includes(solution) ? prev.filter(s => s !== solution) : [...prev, solution]
    );
  };

  const addResult = () => setResults([...results, '']);
  const removeResult = (index: number) => setResults(results.filter((_, i) => i !== index));
  const updateResult = (index: number, value: string) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  const onSubmit = async (data: CaseFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        sap_modules: selectedModules,
        sap_solutions: selectedSolutions,
        results: results.filter(r => r.trim()),
        industry_keywords: keywords.filter(k => k.trim()),
        metrics: {},
      };

      const action = initialData ? 'update' : 'create';
      const { error } = await supabase.functions.invoke('admin-cases', {
        body: { action, id: initialData?.id, data: payload }
      });

      if (error) throw error;
      
      toast.success(initialData ? 'Case atualizado!' : 'Case criado!');
      onSuccess();
    } catch (err) {
      console.error('Error saving case:', err);
      toast.error('Erro ao salvar case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Empresa *</Label>
          <Input id="company_name" {...register('company_name')} placeholder="Ex: Empresa XYZ" />
          {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Setor *</Label>
          <Select value={watch('industry')} onValueChange={(v) => setValue('industry', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-xs text-destructive">{errors.industry.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_size">Porte</Label>
          <Select value={watch('company_size')} onValueChange={(v) => setValue('company_size', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o porte" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_type">Tipo de Projeto</Label>
          <Select value={watch('project_type') || ''} onValueChange={(v) => setValue('project_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <Label htmlFor="title">Título do Case *</Label>
        <Input id="title" {...register('title')} placeholder="Ex: Migração S/4HANA com redução de 40% no tempo" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea id="description" {...register('description')} rows={3} placeholder="Descreva o case brevemente..." />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* SAP Modules */}
      <div className="space-y-2">
        <Label>Módulos SAP</Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
          {SAP_MODULES.map((module) => (
            <label key={module} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={selectedModules.includes(module)} 
                onCheckedChange={() => toggleModule(module)}
              />
              <span className="text-sm">{module}</span>
            </label>
          ))}
        </div>
      </div>

      {/* SAP Solutions */}
      <div className="space-y-2">
        <Label>Soluções SAP</Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
          {SAP_SOLUTIONS.map((solution) => (
            <label key={solution} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={selectedSolutions.includes(solution)} 
                onCheckedChange={() => toggleSolution(solution)}
              />
              <span className="text-sm">{solution}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Challenge & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="challenge">Desafio do Cliente</Label>
          <Textarea id="challenge" {...register('challenge')} rows={3} placeholder="Qual era o desafio?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="solution">Solução Aplicada</Label>
          <Textarea id="solution" {...register('solution')} rows={3} placeholder="Como a Meta IT resolveu?" />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <Label>Resultados</Label>
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex gap-2">
              <Input 
                value={result} 
                onChange={(e) => updateResult(index, e.target.value)}
                placeholder={`Resultado ${index + 1}`}
              />
              {results.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeResult(index)}>
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addResult}>
            + Adicionar resultado
          </Button>
        </div>
      </div>

      {/* Key Result & URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="key_result">Resultado Chave</Label>
          <Input id="key_result" {...register('key_result')} placeholder="Ex: Redução de 30% no tempo de fechamento" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_url">Link do Case</Label>
          <Input id="case_url" {...register('case_url')} placeholder="https://..." />
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Switch 
          checked={watch('is_active')} 
          onCheckedChange={(checked) => setValue('is_active', checked)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">Case ativo</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? 'Salvar Alterações' : 'Criar Case'}
        </Button>
      </div>
    </form>
  );
}
