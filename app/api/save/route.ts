import { NextResponse } from 'next/server';
import { saveAnalysis } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      prompt,
      code,
      execution_plan,
      test_cases,
      test_results,
      explanation,
      confidence_score,
      risk_level,
      confidence_breakdown,
    } = body;

    if (!prompt || !code) {
      return NextResponse.json(
        { error: '"prompt" and "code" are required' },
        { status: 400 }
      );
    }

    const saved = await saveAnalysis({
      prompt,
      code,
      execution_plan: execution_plan || [],
      test_cases: test_cases || [],
      test_results: test_results || [],
      explanation: explanation || null,
      confidence_score: confidence_score || 0,
      risk_level: risk_level || 'Medium',
      confidence_breakdown: confidence_breakdown || null,
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save analysis' },
      { status: 500 }
    );
  }
}
