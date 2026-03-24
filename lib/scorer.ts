import type { TestResult, ExecutionStep } from './types';

export function calculateConfidenceScore(
  testResults: TestResult[],
  code: string,
  executionPlan: ExecutionStep[]
): { score: number; risk: 'Low' | 'Medium' | 'High'; breakdown: { test_score: number; complexity_score: number; coverage_score: number } } {
  // 60% weight on test pass rate
  const passedTests = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length || 1;
  const testScore = Math.round((passedTests / totalTests) * 60);

  // 15% weight on code complexity (lower is better)
  const complexityScore = calculateComplexityScore(code);

  // 25% weight on execution plan coverage
  const coverageScore = Math.min(25, Math.round((executionPlan.length / 10) * 25));

  let finalScore = testScore + complexityScore + coverageScore;
  finalScore = Math.min(99, Math.max(1, finalScore));

  let risk: 'Low' | 'Medium' | 'High';
  if (finalScore >= 80) risk = 'Low';
  else if (finalScore >= 55) risk = 'Medium';
  else risk = 'High';

  return {
    score: finalScore,
    risk,
    breakdown: {
      test_score: testScore,
      complexity_score: complexityScore,
      coverage_score: coverageScore,
    },
  };
}

function calculateComplexityScore(code: string): number {
  const lines = code.split('\n');
  let complexityCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) complexityCount++;
    if (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else:')) complexityCount++;
    if (trimmed.includes('def ') && trimmed.includes('(')) {
      // Check for recursion
      const fnName = trimmed.split('def ')[1]?.split('(')[0]?.trim();
      if (fnName && code.includes(`${fnName}(`) && code.split(`${fnName}(`).length > 2) {
        complexityCount += 2;
      }
    }
    // Nested blocks (indentation level > 2)
    const indent = line.length - line.trimStart().length;
    if (indent >= 12 && trimmed.length > 0) complexityCount++;
  }

  if (complexityCount < 3) return 15;  // Low complexity: +15
  if (complexityCount <= 6) return 10; // Medium: +10
  return 5;                            // High: +5
}
