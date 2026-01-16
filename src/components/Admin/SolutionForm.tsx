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
import { MetaSolution, SAP_MODULES, SOLUTION_CATEGORIES, TARGET_ROLES } from '@/types/admin.types';
import { Loader2 } from 'lucide-react';

const solutionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  expected_result: z.string().optional(),
  is_active: z.boolean().default(true),
});

type SolutionFormValues = z.infer<typeof solutionSchema>;

interface SolutionFormProps {
  initialData?: MetaSolution | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SolutionForm({ initialData, onSuccess, onCancel }: SolutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(initialData?.sap_modules || []);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialData?.target_roles || ['C-level', 'Diretor', 'Gerente']);
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || ['']);
  const [relatedPains, setRelatedPains] = useState<string[]>(initialData?.related_pains || ['']);
  const [useCases, setUseCases] = useState<string[]>(initialData?.use_cases || ['']);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SolutionFormValues>({
    resolver: zodResolver(solutionSchema),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      expected_result: initialData?.expected_result || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const toggleModule = (module: string) => {
    setSelectedModules(prev => 
      prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const updateList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
      const newList = [...prev];
      newList[index] = value;
      return newList;
    });
  };

  const addToList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const removeFromList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SolutionFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        sap_modules: selectedModules,
        target_roles: selectedRoles,
        benefits: benefits.filter(b => b.trim()),
        related_pains: relatedPains.filter(p => p.trim()),
        use_cases: useCases.filter(u => u.trim()),
      };

      const action = initialData ? 'update' : 'create';
      const { error } = await supabase.functions.invoke('admin-solutions', {
        body: { action, id: initialData?.id, data: payload }
      });

      if (error) throw error;
      
      toast.success(initialData ? 'Solução atualizada!' : 'Solução criada!');
      onSuccess();
    } catch (err) {
      console.error('Error saving solution:', err);
      toast.error('Erro ao salvar solução');
    } finally {
      setLoading(false);
    }
  };

  const renderListInputs = (
    label: string,
    placeholder: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {list.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input 
              value={item} 
              onChange={(e) => updateList(setter, index, e.target.value)}
              placeholder={placeholder}
            />
            {list.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFromList(setter, index)}>
                ×
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addToList(setter)}>
          + Adicionar
        </Button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Solução *</Label>
          <Input id="name" {...register('name')} placeholder="Ex: S/4HANA" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {SOLUTION_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea id="description" {...register('description')} rows={3} placeholder="Descreva a solução..." />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Benefits */}
      {renderListInputs('Benefícios', 'Ex: Redução de custos operacionais', benefits, setBenefits)}

      {/* Related Pains */}
      {renderListInputs('Dores que esta solução resolve', 'Ex: Sistemas legados desatualizados', relatedPains, setRelatedPains)}

      {/* Use Cases */}
      {renderListInputs('Casos de uso', 'Ex: Migração de ECC para S/4HANA', useCases, setUseCases)}

      {/* SAP Modules */}
      <div className="space-y-2">
        <Label>Módulos SAP Relacionados</Label>
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

      {/* Target Roles */}
      <div className="space-y-2">
        <Label>Público-alvo (cargos)</Label>
        <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-muted/30">
          {TARGET_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={selectedRoles.includes(role)} 
                onCheckedChange={() => toggleRole(role)}
              />
              <span className="text-sm">{role}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Expected Result */}
      <div className="space-y-2">
        <Label htmlFor="expected_result">Resultado Esperado (tom consultivo)</Label>
        <Input 
          id="expected_result" 
          {...register('expected_result')} 
          placeholder='Ex: "Potencial para reduzir tempo de fechamento em até 30%"' 
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Switch 
          checked={watch('is_active')} 
          onCheckedChange={(checked) => setValue('is_active', checked)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">Solução ativa</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? 'Salvar Alterações' : 'Criar Solução'}
        </Button>
      </div>
    </form>
  );
}
