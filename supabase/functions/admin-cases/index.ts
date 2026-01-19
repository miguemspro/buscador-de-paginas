import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validação para Cases
const CaseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  company_name: z.string().min(1, "Nome da empresa é obrigatório").max(200),
  industry: z.string().min(1, "Indústria é obrigatória").max(100),
  industry_keywords: z.array(z.string().max(100)).max(20).default([]),
  description: z.string().min(1, "Descrição é obrigatória").max(5000),
  results: z.array(z.string().max(500)).max(10).default([]),
  sap_solutions: z.array(z.string().max(100)).max(10).default([]),
  case_url: z.string().url().optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  sap_modules: z.array(z.string().max(100)).max(10).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  country: z.string().max(100).optional().nullable(),
  challenge: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  key_result: z.string().max(500).optional().nullable(),
  product_sold: z.string().max(200).optional().nullable(),
  project_type: z.string().max(100).optional().nullable(),
  project_date: z.string().optional().nullable(),
  metrics: z.record(z.unknown()).optional().nullable(),
});

// Schema para update (todos campos opcionais)
const CaseUpdateSchema = CaseSchema.partial();

// deno-lint-ignore no-explicit-any
async function verifyAdmin(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Token de autorização não fornecido', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  
  if (authError || !user) {
    console.error('[admin-cases] Auth error:', authError);
    return { error: 'Token inválido ou expirado', status: 401 };
  }

  // Verificar se o usuário é admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', String(user.email))
    .single();

  if (adminError || !adminUser) {
    console.log('[admin-cases] User not admin:', user.email);
    return { error: 'Acesso negado. Apenas administradores podem acessar este recurso.', status: 403 };
  }

  return { user, adminUser };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação de admin
    const authHeader = req.headers.get('authorization');
    const authResult = await verifyAdmin(supabase, authHeader);
    
    if ('error' in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, id, data } = await req.json();

    console.log(`[admin-cases] Action: ${action}, ID: ${id}, User: ${authResult.user.email}`);

    switch (action) {
      case 'list': {
        const { data: cases, error } = await supabase
          .from('meta_cases')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ cases }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: caseData, error } = await supabase
          .from('meta_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ case: caseData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        // Validar dados de entrada
        const parseResult = CaseSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[admin-cases] Validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Dados inválidos', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newCase, error } = await supabase
          .from('meta_cases')
          .insert([parseResult.data])
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-cases] Created case: ${newCase.id} by ${authResult.user.email}`);

        return new Response(JSON.stringify({ case: newCase }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validar dados de entrada
        const parseResult = CaseUpdateSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[admin-cases] Validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Dados inválidos', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedCase, error } = await supabase
          .from('meta_cases')
          .update(parseResult.data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-cases] Updated case: ${id} by ${authResult.user.email}`);

        return new Response(JSON.stringify({ case: updatedCase }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('meta_cases')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log(`[admin-cases] Deleted case: ${id} by ${authResult.user.email}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[admin-cases] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
