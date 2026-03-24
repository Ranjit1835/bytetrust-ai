export interface AnalysisOptions {
  autoGenerateTests: boolean;
  includeExplanation: boolean;
  maxTestCases: number;
}

export interface ExecutionStep {
  step: number;
  type: 'INIT' | 'LOOP' | 'CONDITION' | 'COMPUTE' | 'RETURN';
  description: string;
  detail: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  description: string;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  execution_time_ms?: number;
}

export interface Explanation {
  how_it_works: string;
  why_correct: string;
  where_it_fails: string;
}

export interface ConfidenceBreakdown {
  test_score: number;
  complexity_score: number;
  coverage_score: number;
}

export interface AnalysisResult {
  id?: string;
  prompt: string;
  code: string;
  execution_plan: ExecutionStep[];
  test_cases: TestCase[];
  test_results: TestResult[];
  explanation: Explanation;
  confidence_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence_breakdown: ConfidenceBreakdown;
  created_at?: string;
}

export type PipelineStage =
  | 'idle'
  | 'generating'
  | 'planning'
  | 'test_generation'
  | 'executing'
  | 'verifying'
  | 'scoring'
  | 'complete'
  | 'error';
