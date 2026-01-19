import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validação para Solutions
const SolutionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  category: z.string().min(1, "Categoria é obrigatória").max(100),
  description: z.string().min(1, "Descrição é obrigatória").max(5000),
  benefits: z.array(z.string().max(500)).max(20).optional().nullable(),
  sap_modules: z.array(z.string().max(100)).max(10).optional().nullable(),
  target_roles: z.array(z.string().max(100)).max(10).optional().nullable(),
  use_cases: z.array(z.string().max(500)).max(20).optional().nullable(),
  related_pains: z.array(z.string().max(500)).max(20).optional().nullable(),
  expected_result: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// Schema para update (todos campos opcionais)
const SolutionUpdateSchema = SolutionSchema.partial();

// deno-lint-ignore no-explicit-any
async function verifyAdmin(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Token de autorização não fornecido', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error('[admin-solutions] Auth error:', authError);
    return { error: 'Token inválido ou expirado', status: 401 };
  }

  // Verificar se o usuário é admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email as string)
    .single();

  if (adminError || !adminUser) {
    console.log('[admin-solutions] User not admin:', user.email);
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

    console.log(`[admin-solutions] Action: ${action}, ID: ${id}, User: ${authResult.user.email}`);

    switch (action) {
      case 'list': {
        const { data: solutions, error } = await supabase
          .from('meta_solutions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ solutions }), {
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

        const { data: solutionData, error } = await supabase
          .from('meta_solutions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ solution: solutionData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        // Validar dados de entrada
        const parseResult = SolutionSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[admin-solutions] Validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Dados inválidos', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newSolution, error } = await supabase
          .from('meta_solutions')
          .insert([parseResult.data])
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-solutions] Created solution: ${newSolution.id} by ${authResult.user.email}`);

        return new Response(JSON.stringify({ solution: newSolution }), {
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
        const parseResult = SolutionUpdateSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[admin-solutions] Validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Dados inválidos', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedSolution, error } = await supabase
          .from('meta_solutions')
          .update(parseResult.data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-solutions] Updated solution: ${id} by ${authResult.user.email}`);

        return new Response(JSON.stringify({ solution: updatedSolution }), {
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
          .from('meta_solutions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log(`[admin-solutions] Deleted solution: ${id} by ${authResult.user.email}`);

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
    console.error('[admin-solutions] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
