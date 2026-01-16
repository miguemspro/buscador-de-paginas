// ============================================
// FASE 1.1: Tela de Confirmação de Dados do Lead
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Building2, 
  User, 
  Briefcase,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedLeadData } from '@/types/playbook.types';
import { validateLeadCard, SAP_STATUS_LABELS, COMPANY_SIZE_LABELS } from '@/types/lead.types';

interface LeadConfirmationProps {
  extractedData: ExtractedLeadData;
  imagePreview: string;
  onConfirm: (data: ExtractedLeadData) => void;
  onRestart: () => void;
  isLoading?: boolean;
}

export default function LeadConfirmation({
  extractedData,
  imagePreview,
  onConfirm,
  onRestart,
  isLoading = false
}: LeadConfirmationProps) {
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<ExtractedLeadData>(extractedData);

  // Validar dados
  const validation = validateLeadCard({
    empresa: data.company || '',
    lead_nome: data.name || '',
    lead_cargo: data.role,
    segmento: data.industry,
    sap_status: data.sapStatus as any
  });

  const handleChange = (field: keyof ExtractedLeadData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (validation.isValid) {
      onConfirm(data);
    }
  };

  return (
    <div className="flex items-start justify-center min-h-[60vh] p-8 gap-8">
      {/* Preview da Imagem */}
      <div className="w-80 shrink-0">
        <Card className="overflow-hidden">
          <CardHeader className="p-3 bg-muted/50">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Print Analisado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Print Salesforce" 
                className="w-full h-auto"
              />
            )}
          </CardContent>
        </Card>

        {/* Botão de Restart */}
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-muted-foreground"
          onClick={onRestart}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Enviar outro print
        </Button>
      </div>

      {/* Formulário de Confirmação */}
      <Card className="flex-1 max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Confirme os dados do lead</CardTitle>
              <CardDescription>
                Revise e corrija os dados extraídos antes de gerar o playbook
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {editMode ? 'Visualizar' : 'Editar'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Validação */}
          {!validation.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Campos obrigatórios faltando: {validation.missingFields.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside text-sm">
                  {validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Dados da Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                {editMode ? (
                  <Input
                    id="company"
                    value={data.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className={cn(!data.company && 'border-destructive')}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md font-medium">
                    {data.company || <span className="text-destructive">Não identificado</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Segmento</Label>
                {editMode ? (
                  <Input
                    id="industry"
                    value={data.industry || ''}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    placeholder="Ex: Manufatura, Varejo, Agro..."
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md">
                    {data.industry || <span className="text-muted-foreground">Não identificado</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sapStatus">Status SAP</Label>
                {editMode ? (
                  <Select 
                    value={data.sapStatus || 'unknown'}
                    onValueChange={(v) => handleChange('sapStatus', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SAP_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted rounded-md">
                    <Badge variant={data.sapStatus === 'sap_ecc' ? 'default' : 'secondary'}>
                      {data.sapStatus && SAP_STATUS_LABELS[data.sapStatus as keyof typeof SAP_STATUS_LABELS] 
                        ? SAP_STATUS_LABELS[data.sapStatus as keyof typeof SAP_STATUS_LABELS] 
                        : 'Não identificado'}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Porte</Label>
                {editMode ? (
                  <Select 
                    value={data.companySize || ''}
                    onValueChange={(v) => handleChange('companySize', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted rounded-md">
                    {data.companySize && COMPANY_SIZE_LABELS[data.companySize as keyof typeof COMPANY_SIZE_LABELS]
                      ? COMPANY_SIZE_LABELS[data.companySize as keyof typeof COMPANY_SIZE_LABELS]
                      : <span className="text-muted-foreground">Não identificado</span>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Lead */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Dados do Lead
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                {editMode ? (
                  <Input
                    id="name"
                    value={data.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={cn(!data.name && 'border-destructive')}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md font-medium">
                    {data.name || <span className="text-destructive">Não identificado</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                {editMode ? (
                  <Input
                    id="role"
                    value={data.role || ''}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="Ex: IT Manager, CIO..."
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {data.role || <span className="text-muted-foreground">Não identificado</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {editMode ? (
                  <Input
                    id="email"
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@empresa.com"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {data.email || <span className="text-muted-foreground">—</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                {editMode ? (
                  <Input
                    id="phone"
                    value={data.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {data.phone || <span className="text-muted-foreground">—</span>}
                  </div>
                )}
              </div>
            </div>

            {editMode && (
              <div className="space-y-2">
                <Label htmlFor="publicSignals">Anotações/Sinais Públicos</Label>
                <Textarea
                  id="publicSignals"
                  value={data.publicSignals || ''}
                  onChange={(e) => handleChange('publicSignals', e.target.value)}
                  placeholder="Informações adicionais sobre o lead..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Botão de Confirmação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={handleConfirm}
              disabled={!validation.isValid || isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? (
                'Gerando playbook...'
              ) : (
                <>
                  Confirmar e Gerar Playbook
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
