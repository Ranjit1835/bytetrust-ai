import { NextResponse } from 'next/server';
import { calculateConfidenceScore } from '@/lib/scorer';
import type { TestResult, ExecutionStep } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const {
      test_results,
      code,
      execution_plan,
    }: { test_results: TestResult[]; code: string; execution_plan: ExecutionStep[] } =
      await request.json();

    if (!test_results || !code || !execution_plan) {
      return NextResponse.json(
        { error: '"test_results", "code", and "execution_plan" are required' },
        { status: 400 }
      );
    }

    const { score, risk, breakdown } = calculateConfidenceScore(
      test_results,
      code,
      execution_plan
    );

    return NextResponse.json({ score, risk, breakdown });
  } catch (error) {
    console.error('Score API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scoring failed' },
      { status: 500 }
    );
  }
}
