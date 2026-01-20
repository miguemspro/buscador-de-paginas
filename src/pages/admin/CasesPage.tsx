import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, ExternalLink, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MetaCase, INDUSTRIES } from '@/types/admin.types';
import CaseForm from '@/components/Admin/CaseForm';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { FloatingActionButton } from '@/components/ui/floating-action-button';

export default function CasesPage() {
  const [cases, setCases] = useState<MetaCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<MetaCase | null>(null);
  const [deletingCase, setDeletingCase] = useState<MetaCase | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-cases', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setCases(data?.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
      toast.error('Erro ao carregar cases');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCase) return;

    try {
      const { error } = await supabase.functions.invoke('admin-cases', {
        body: { action: 'delete', id: deletingCase.id }
      });

      if (error) throw error;
      toast.success('Case excluído com sucesso');
      fetchCases();
    } catch (err) {
      console.error('Error deleting case:', err);
      toast.error('Erro ao excluir case');
    } finally {
      setDeletingCase(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCase(null);
    fetchCases();
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Cases Meta IT</h2>
          <p className="text-sm text-muted-foreground">{cases.length} cases cadastrados</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 hidden sm:flex">
          <Plus className="h-4 w-4" />
          Novo Case
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2 p-4 sm:p-6">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground">
            {search || industryFilter !== 'all' 
              ? 'Nenhum case encontrado com esses filtros'
              : 'Nenhum case cadastrado ainda'}
          </p>
          {!search && industryFilter === 'all' && (
            <Button onClick={() => setIsFormOpen(true)} className="mt-4">
              Cadastrar primeiro case
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{caseItem.company_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{caseItem.industry}</p>
                  </div>
                  <Badge variant={caseItem.is_active ? 'default' : 'secondary'}>
                    {caseItem.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                <p className="text-sm font-medium line-clamp-2">{caseItem.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {caseItem.description}
                </p>
                
                {caseItem.sap_solutions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {caseItem.sap_solutions.slice(0, 3).map((solution) => (
                      <Badge key={solution} variant="outline" className="text-xs">
                        {solution}
                      </Badge>
                    ))}
                    {caseItem.sap_solutions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{caseItem.sap_solutions.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {caseItem.results.length > 0 && (
                  <p className="text-xs text-primary font-medium truncate">
                    ✓ {caseItem.results[0]}
                  </p>
                )}

                {/* Actions - Always visible on mobile, hover on desktop */}
                <div className="flex items-center justify-between pt-2 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => {
                        setEditingCase(caseItem);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setDeletingCase(caseItem)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {caseItem.case_url && (
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" asChild>
                      <a href={caseItem.case_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB for mobile */}
      <FloatingActionButton onClick={() => setIsFormOpen(true)}>
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Form Dialog/Sheet */}
      <ResponsiveDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCase(null);
        }}
        title={editingCase ? 'Editar Case' : 'Novo Case'}
        className="max-w-3xl"
      >
        <CaseForm
          initialData={editingCase}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCase(null);
          }}
        />
      </ResponsiveDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCase} onOpenChange={(open) => !open && setDeletingCase(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Case?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o case "{deletingCase?.company_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
