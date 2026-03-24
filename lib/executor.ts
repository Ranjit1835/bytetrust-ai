import { exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import type { TestCase, TestResult } from './types';

const DANGEROUS_IMPORTS = ['os', 'sys', 'subprocess', 'socket', 'shutil', 'pathlib'];
const TIMEOUT_MS = 5000;

function stripDangerousImports(code: string): string {
  const lines = code.split('\n');
  return lines
    .filter((line) => {
      const trimmed = line.trim();
      for (const mod of DANGEROUS_IMPORTS) {
        if (
          trimmed.startsWith(`import ${mod}`) ||
          trimmed.startsWith(`from ${mod}`) ||
          trimmed.includes(`__import__('${mod}')`) ||
          trimmed.includes(`__import__("${mod}")`)
        ) {
          return false;
        }
      }
      return true;
    })
    .join('\n');
}

function buildTestScript(code: string, testInput: string): string {
  return `${code}\n\n${testInput}`;
}

function executeCode(filePath: string): Promise<{ stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const proc = exec(`python "${filePath}"`, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error && error.killed) {
        resolve({ stdout: '', stderr: 'Execution timed out (>5s)', timedOut: true });
      } else {
        resolve({ stdout: stdout || '', stderr: stderr || '', timedOut: false });
      }
    });

    // Ensure cleanup on timeout
    setTimeout(() => {
      try { proc.kill(); } catch { /* ignore */ }
    }, TIMEOUT_MS + 500);
  });
}

export async function runTests(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  const sanitizedCode = stripDangerousImports(code);
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const id = randomUUID();
    const filePath = join(tmpdir(), `bytetrust_${id}.py`);
    const start = Date.now();

    try {
      const fullScript = buildTestScript(sanitizedCode, tc.input);
      writeFileSync(filePath, fullScript, 'utf-8');

      const { stdout, stderr, timedOut } = await executeCode(filePath);
      const elapsed = Date.now() - start;
      const actual = stdout.trim();

      if (timedOut) {
        results.push({
          input: tc.input,
          expected: tc.expected_output,
          actual: '',
          passed: false,
          error: 'Execution timed out (>5s)',
          execution_time_ms: elapsed,
        });
      } else if (stderr && !stdout) {
        results.push({
          input: tc.input,
          expected: tc.expected_output,
          actual: '',
          passed: false,
          error: stderr.trim(),
          execution_time_ms: elapsed,
        });
      } else {
        results.push({
          input: tc.input,
          expected: tc.expected_output,
          actual,
          passed: actual === tc.expected_output.trim(),
          execution_time_ms: elapsed,
        });
      }
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expected_output,
        actual: '',
        passed: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        execution_time_ms: Date.now() - start,
      });
    } finally {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
  }

  return results;
}
