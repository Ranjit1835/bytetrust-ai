import { NextResponse } from 'next/server';
import { runTests } from '@/lib/executor';
import type { TestCase } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { code, test_cases }: { code: string; test_cases: TestCase[] } = await request.json();

    if (!code || !test_cases || !Array.isArray(test_cases)) {
      return NextResponse.json(
        { error: '"code" and "test_cases" array are required' },
        { status: 400 }
      );
    }

    const results = await runTests(code, test_cases);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Execute API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}
