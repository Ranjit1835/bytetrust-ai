import { NextResponse } from 'next/server';
import { callGrok, safeParseJSON } from '@/lib/grok';
import type { TestResult } from '@/lib/types';

const SYSTEM_PROMPT = `You are a code verification engine. Analyze the code and test results.
Respond ONLY with JSON:
{
  "explanation": {
    "how_it_works": "Clear explanation of the code's approach and algorithm",
    "why_correct": "Why this implementation is correct based on test results",
    "where_it_fails": "Potential edge cases or scenarios where the code might fail"
  },
  "additional_risks": ["risk1", "risk2"],
  "suggested_improvements": ["improvement1", "improvement2"]
}

Do not include markdown fences. Return pure JSON only.`;

export async function POST(request: Request) {
  try {
    const {
      code,
      test_results,
      prompt,
    }: { code: string; test_results: TestResult[]; prompt: string } = await request.json();

    if (!code || !test_results || !prompt) {
      return NextResponse.json(
        { error: '"code", "test_results", and "prompt" are required' },
        { status: 400 }
      );
    }

    const passedCount = test_results.filter((t) => t.passed).length;
    const totalCount = test_results.length;

    const userMessage = `Original prompt: ${prompt}

Code:
${code}

Test Results: ${passedCount}/${totalCount} passed
${test_results
  .map(
    (t, i) =>
      `  Test ${i + 1}: input="${t.input}" expected="${t.expected}" got="${t.actual}" ${t.passed ? 'PASSED' : 'FAILED'}${t.error ? ` error="${t.error}"` : ''}`
  )
  .join('\n')}

Analyze and verify this code.`;

    const rawResponse = await callGrok(SYSTEM_PROMPT, userMessage);

    const parsed = safeParseJSON(rawResponse) as Record<string, unknown>;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
