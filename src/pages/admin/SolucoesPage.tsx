import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MetaSolution, SOLUTION_CATEGORIES } from '@/types/admin.types';
import SolutionForm from '@/components/Admin/SolutionForm';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { FloatingActionButton } from '@/components/ui/floating-action-button';

export default function SolucoesPage() {
  const [solutions, setSolutions] = useState<MetaSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<MetaSolution | null>(null);
  const [deletingSolution, setDeletingSolution] = useState<MetaSolution | null>(null);

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-solutions', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setSolutions(data?.solutions || []);
    } catch (err) {
      console.error('Error fetching solutions:', err);
      toast.error('Erro ao carregar soluções');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSolution) return;

    try {
      const { error } = await supabase.functions.invoke('admin-solutions', {
        body: { action: 'delete', id: deletingSolution.id }
      });

      if (error) throw error;
      toast.success('Solução excluída com sucesso');
      fetchSolutions();
    } catch (err) {
      console.error('Error deleting solution:', err);
      toast.error('Erro ao excluir solução');
    } finally {
      setDeletingSolution(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSolution(null);
    fetchSolutions();
  };

  const filteredSolutions = solutions.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Soluções Meta IT</h2>
          <p className="text-sm text-muted-foreground">{solutions.length} soluções cadastradas</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 hidden sm:flex">
          <Plus className="h-4 w-4" />
          Nova Solução
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar solução..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {SOLUTION_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Solutions Grid */}
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
      ) : filteredSolutions.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search || categoryFilter !== 'all' 
              ? 'Nenhuma solução encontrada com esses filtros'
              : 'Nenhuma solução cadastrada ainda'}
          </p>
          {!search && categoryFilter === 'all' && (
            <Button onClick={() => setIsFormOpen(true)} className="mt-4">
              Cadastrar primeira solução
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSolutions.map((solution) => (
            <Card key={solution.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{solution.name}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{solution.category}</p>
                  </div>
                  <Badge variant={solution.is_active ? 'default' : 'secondary'}>
                    {solution.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {solution.description}
                </p>
                
                {solution.benefits.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Benefícios:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {solution.benefits.slice(0, 2).map((benefit, i) => (
                        <li key={i} className="truncate">• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {solution.target_roles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {solution.target_roles.slice(0, 3).map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions - Always visible on mobile, hover on desktop */}
                <div className="flex items-center justify-between pt-2 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => {
                        setEditingSolution(solution);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setDeletingSolution(solution)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
          if (!open) setEditingSolution(null);
        }}
        title={editingSolution ? 'Editar Solução' : 'Nova Solução'}
        className="max-w-3xl"
      >
        <SolutionForm
          initialData={editingSolution}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingSolution(null);
          }}
        />
      </ResponsiveDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSolution} onOpenChange={(open) => !open && setDeletingSolution(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Solução?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a solução "{deletingSolution?.name}"? 
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
