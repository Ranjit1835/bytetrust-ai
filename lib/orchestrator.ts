import { exec } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { selectStack, type StackSelection } from './stack-selector';
import { generateApp, fixApp, type GeneratedFile, type GeneratedApp } from './app-generator';

export type BlockId = 'stack' | 'generate' | 'test' | 'compile' | 'run';
export type BlockStatus = 'idle' | 'running' | 'passed' | 'failed' | 'retrying';

export interface BlockState {
  id: BlockId;
  label: string;
  status: BlockStatus;
  message: string;
  iteration: number;
  error?: string;
}

export interface PipelineEvent {
  type: 'block_update' | 'complete' | 'error';
  block?: BlockId;
  status?: BlockStatus;
  message?: string;
  data?: Record<string, unknown>;
}

export interface PipelineResult {
  success: boolean;
  projectDir: string;
  stack: StackSelection;
  files: GeneratedFile[];
  testOutput: string;
  iterations: number;
  appUrl?: string;
  bytecodeFiles?: string[];
  error?: string;
}

const MAX_ITERATIONS = 5;

/**
 * Write generated files to a temp project directory.
 */
function writeProjectFiles(projectDir: string, files: GeneratedFile[]) {
  for (const file of files) {
    const filePath = join(projectDir, ...file.path.split('/'));
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, file.content, 'utf-8');
  }
}

/**
 * Run a shell command and return output.
 */
function runCommand(cmd: string, cwd: string, timeoutMs = 30000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = exec(cmd, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: error ? (error as NodeJS.ErrnoException & { code?: number }).code || 1 : 0,
      });
    });

    setTimeout(() => {
      try { proc.kill(); } catch { /* ignore */ }
    }, timeoutMs + 1000);
  });
}

/**
 * Run tests for the generated app.
 */
async function runTests(projectDir: string): Promise<{ passed: boolean; output: string }> {
  // Install dependencies first
  const install = await runCommand('pip install -r requirements.txt --quiet 2>&1', projectDir, 60000);
  if (install.stderr && install.stderr.includes('ERROR')) {
    return { passed: false, output: `Dependency install failed:\n${install.stderr}` };
  }

  // Run pytest
  const result = await runCommand('python -m pytest test_app.py -v --tb=short 2>&1', projectDir, 30000);
  const output = result.stdout + '\n' + result.stderr;

  // Check for collection errors (SyntaxError, ImportError in test files)
  if (output.includes('SyntaxError') || output.includes('collected 0 items / 1 error')) {
    return { passed: false, output };
  }

  // Use pytest's summary line: "X passed" or "X failed"
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const errorMatch = output.match(/(\d+) error/);

  const passCount = passMatch ? parseInt(passMatch[1]) : 0;
  const failCount = failMatch ? parseInt(failMatch[1]) : 0;
  const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;

  const passed = passCount > 0 && failCount === 0 && errorCount === 0;
  return { passed, output };
}

/**
 * Compile Python files to bytecode.
 */
async function compileToBytecode(projectDir: string): Promise<{ success: boolean; files: string[]; output: string }> {
  const result = await runCommand(
    `python -c "import compileall; compileall.compile_dir('${projectDir.replace(/\\/g, '\\\\\\\\')}', force=True)" 2>&1`,
    projectDir
  );

  // Find .pyc files
  const pycacheDir = join(projectDir, '__pycache__');
  let bytecodeFiles: string[] = [];
  if (existsSync(pycacheDir)) {
    bytecodeFiles = readdirSync(pycacheDir)
      .filter(f => f.endsWith('.pyc'))
      .map(f => join('__pycache__', f));
  }

  const success = bytecodeFiles.length > 0;
  return {
    success,
    files: bytecodeFiles,
    output: result.stdout + result.stderr,
  };
}

/**
 * Run the full self-healing pipeline.
 * Calls onEvent for real-time UI updates.
 */
export async function runPipeline(
  prompt: string,
  onEvent: (event: PipelineEvent) => void
): Promise<PipelineResult> {
  const projectId = randomUUID().substring(0, 8);
  const projectDir = join(tmpdir(), `bytetrust_${projectId}`);
  mkdirSync(projectDir, { recursive: true });

  let stack: StackSelection | null = null;
  let app: GeneratedApp | null = null;
  let iterations = 0;
  let lastTestOutput = '';

  try {
    // ── Block 1: STACK SELECTION ──
    onEvent({ type: 'block_update', block: 'stack', status: 'running', message: 'Analyzing requirements...' });
    stack = await selectStack(prompt);
    onEvent({
      type: 'block_update', block: 'stack', status: 'passed',
      message: `${stack.framework} + ${stack.database}`,
      data: { stack },
    });

    // ── Block 2: CODE GENERATION ──
    onEvent({ type: 'block_update', block: 'generate', status: 'running', message: 'Generating application...' });
    app = await generateApp(prompt, stack);
    writeProjectFiles(projectDir, app.files);
    onEvent({
      type: 'block_update', block: 'generate', status: 'passed',
      message: `${app.files.length} files generated`,
      data: { files: app.files.map(f => ({ path: f.path, size: f.content.length })) },
    });

    // ── Block 3: TEST + SELF-HEAL LOOP ──
    let testsPassed = false;
    while (!testsPassed && iterations < MAX_ITERATIONS) {
      iterations++;
      onEvent({
        type: 'block_update', block: 'test', status: iterations > 1 ? 'retrying' : 'running',
        message: iterations > 1 ? `Self-healing attempt ${iterations}/${MAX_ITERATIONS}...` : 'Running tests...',
      });

      const testResult = await runTests(projectDir);
      lastTestOutput = testResult.output;

      if (testResult.passed) {
        testsPassed = true;
        onEvent({
          type: 'block_update', block: 'test', status: 'passed',
          message: iterations > 1 ? `Passed after ${iterations} iterations` : 'All tests passed',
          data: { output: testResult.output, iterations },
        });
      } else if (iterations < MAX_ITERATIONS) {
        // Self-heal: ask AI to fix
        onEvent({
          type: 'block_update', block: 'generate', status: 'retrying',
          message: `Fixing code (attempt ${iterations + 1})...`,
        });

        app = await fixApp(prompt, app!.files, testResult.output);
        writeProjectFiles(projectDir, app.files);

        onEvent({
          type: 'block_update', block: 'generate', status: 'passed',
          message: `Fixed — ${app.files.length} files updated`,
        });
      } else {
        // Max retries hit
        onEvent({
          type: 'block_update', block: 'test', status: 'failed',
          message: `Tests still failing after ${MAX_ITERATIONS} attempts`,
          data: { output: testResult.output },
        });
      }
    }

    // ── Block 4: COMPILE TO BYTECODE ──
    onEvent({ type: 'block_update', block: 'compile', status: 'running', message: 'Compiling to bytecode...' });
    const compileResult = await compileToBytecode(projectDir);

    if (compileResult.success) {
      onEvent({
        type: 'block_update', block: 'compile', status: 'passed',
        message: `${compileResult.files.length} .pyc files generated`,
        data: { files: compileResult.files },
      });
    } else {
      onEvent({
        type: 'block_update', block: 'compile', status: 'failed',
        message: 'Bytecode compilation had warnings',
        data: { output: compileResult.output },
      });
    }

    // ── Block 5: RUN APP ──
    onEvent({ type: 'block_update', block: 'run', status: 'running', message: 'Starting application...' });

    // We'll start the app in the /api/run route, just signal readiness here
    onEvent({
      type: 'block_update', block: 'run', status: 'passed',
      message: `Ready to launch on port ${stack.port}`,
      data: { port: stack.port, entryPoint: app!.entryPoint, projectDir },
    });

    // ── COMPLETE ──
    onEvent({
      type: 'complete',
      data: {
        projectDir,
        stack,
        files: app!.files,
        iterations,
        bytecodeFiles: compileResult.files,
      },
    });

    return {
      success: true,
      projectDir,
      stack,
      files: app!.files,
      testOutput: lastTestOutput,
      iterations,
      bytecodeFiles: compileResult.files,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown pipeline error';
    onEvent({ type: 'error', message: errorMsg });
    return {
      success: false,
      projectDir,
      stack: stack!,
      files: app?.files || [],
      testOutput: lastTestOutput,
      iterations,
      error: errorMsg,
    };
  }
}
