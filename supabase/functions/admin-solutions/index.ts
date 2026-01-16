import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, id, data } = await req.json();

    console.log(`[admin-solutions] Action: ${action}, ID: ${id}`);

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
        const { data: newSolution, error } = await supabase
          .from('meta_solutions')
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-solutions] Created solution: ${newSolution.id}`);

        return new Response(JSON.stringify({ solution: newSolution }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { data: updatedSolution, error } = await supabase
          .from('meta_solutions')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log(`[admin-solutions] Updated solution: ${id}`);

        return new Response(JSON.stringify({ solution: updatedSolution }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { error } = await supabase
          .from('meta_solutions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log(`[admin-solutions] Deleted solution: ${id}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[admin-solutions] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
