import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Server-side admin client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function saveAnalysis(result: {
  prompt: string;
  code: string;
  execution_plan: unknown;
  test_cases: unknown;
  test_results: unknown;
  explanation: unknown;
  confidence_score: number;
  risk_level: string;
  confidence_breakdown: unknown;
}) {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .insert({
      user_id: 'anonymous',
      prompt: result.prompt,
      code: result.code,
      execution_plan: result.execution_plan,
      test_cases: result.test_cases,
      test_results: result.test_results,
      explanation: result.explanation,
      confidence_score: result.confidence_score,
      risk_level: result.risk_level,
      confidence_breakdown: result.confidence_breakdown,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAnalyses(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
