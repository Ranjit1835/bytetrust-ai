import { NextResponse } from 'next/server';
import { callGrok, safeParseJSON } from '@/lib/grok';

const SYSTEM_PROMPT = `You are ByteTrust AI, an execution-aware code generator.
When given a natural language description, you MUST respond with a JSON object only.
No markdown, no explanation outside the JSON.
JSON structure:
{
  "code": "string (clean Python code, no markdown fences)",
  "execution_plan": [
    {
      "step": 1,
      "type": "INIT | LOOP | CONDITION | COMPUTE | RETURN",
      "description": "short description",
      "detail": "detailed explanation"
    }
  ],
  "test_cases": [
    {
      "input": "Python code snippet to test (e.g. print(function_name(args)))",
      "expected_output": "expected stdout output as string",
      "description": "what this test covers"
    }
  ]
}

Rules:
- Generate exactly 3-5 test cases
- test_cases.input should be executable Python that calls the generated function and prints the result
- expected_output should be the exact string that would appear in stdout
- execution_plan should have 3-8 steps covering the algorithm flow
- type must be one of: INIT, LOOP, CONDITION, COMPUTE, RETURN
- Code must be clean, correct Python without markdown fences
- Respond with ONLY the JSON object, no other text`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'A "prompt" string is required' },
        { status: 400 }
      );
    }

    const rawResponse = await callGrok(
      SYSTEM_PROMPT,
      `Generate code for: ${prompt}`
    );

    // Robust JSON parsing (handles control chars, markdown fences, etc.)
    const parsed = safeParseJSON(rawResponse) as { code: string; execution_plan: unknown[]; test_cases: unknown[] };

    return NextResponse.json({
      code: parsed.code,
      execution_plan: parsed.execution_plan,
      test_cases: parsed.test_cases,
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate code' },
      { status: 500 }
    );
  }
}
