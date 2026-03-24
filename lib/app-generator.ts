import { callGrok, safeParseJSON } from './grok';
import type { StackSelection } from './stack-selector';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedApp {
  files: GeneratedFile[];
  entryPoint: string;
  testFile: string;
}

const SYSTEM_PROMPT = `You are a Python/Flask full-stack app builder. Generate a COMPLETE, WORKING app with beautiful UI.

Respond ONLY with JSON:
{"files":[{"path":"app.py","content":"..."},{"path":"templates/index.html","content":"..."},{"path":"requirements.txt","content":"..."},{"path":"test_app.py","content":"..."}],"entryPoint":"app.py","testFile":"test_app.py"}

RULES:
1. app.py: complete Flask app, if __name__=='__main__': app.run(host='0.0.0.0', port=PORT)
2. requirements.txt: list all deps (flask required)
3. test_app.py: pytest with test_client(), 3-5 tests
4. If sqlite needed: flask-sqlalchemy, create tables on startup
5. BANNED PACKAGES (DO NOT USE): flask_login, flask-login, flask_restful. They are broken with modern Flask.
6. For auth: use flask session (session['user']) or simple token check. NO flask_login.
5. GET / MUST render_template (NOT return JSON)
6. templates/ folder with Jinja2 HTML
7. Every HTML file MUST include:
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
   <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
8. Use <html data-bs-theme="dark"> for dark mode
9. Add <style>: body{background:#0d1117} .card{background:#161b22;border:1px solid #30363d;border-radius:12px} .btn-primary{background:linear-gradient(135deg,#00b4d8,#0077b6);border:none}
10. Use Bootstrap: navbar, cards, tables, badges, alerts, container py-4
11. Font Awesome icons in buttons
12. JavaScript fetch() for AJAX operations
13. App must be fully functional from browser
14. IMPORTANT: Make sure ALL code is complete — no truncated functions, no unclosed parentheses
15. No markdown fences in content. Return ONLY JSON.`;

export async function generateApp(
  prompt: string,
  stack: StackSelection
): Promise<GeneratedApp> {
  const userMessage = `Build: ${prompt}
Stack: ${stack.framework}, db=${stack.database}, auth=${stack.needsAuth}, port=${stack.port}
Generate ALL files for a complete working app.`;

  const raw = await callGrok(SYSTEM_PROMPT, userMessage);
  const parsed = safeParseJSON(raw) as GeneratedApp;

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    throw new Error('AI generated no files');
  }

  const entryPoint = parsed.entryPoint || 'app.py';
  const testFile = parsed.testFile || 'test_app.py';

  // Ensure requirements.txt exists
  const hasRequirements = parsed.files.some(f => f.path === 'requirements.txt');
  if (!hasRequirements) {
    parsed.files.push({
      path: 'requirements.txt',
      content: stack.database === 'sqlite'
        ? 'flask\nflask-sqlalchemy\npytest\n'
        : 'flask\npytest\n',
    });
  }

  // Validate Python syntax in generated files
  for (const file of parsed.files) {
    if (file.path.endsWith('.py')) {
      const openParens = (file.content.match(/\(/g) || []).length;
      const closeParens = (file.content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        // Truncated code detected — try to close unclosed parens
        const diff = openParens - closeParens;
        if (diff > 0) {
          file.content += ')'.repeat(diff) + '\n';
        }
      }
    }
  }

  return { files: parsed.files, entryPoint, testFile };
}

/**
 * Ask the AI to fix code based on test failures.
 * Uses a COMPACT prompt to stay within token limits.
 */
export async function fixApp(
  prompt: string,
  currentFiles: GeneratedFile[],
  errors: string,
  userInstruction?: string
): Promise<GeneratedApp> {
  const FIX_PROMPT = `Fix the Flask app code. Return ALL files as complete JSON.
Response format: {"files":[{"path":"...","content":"..."}],"entryPoint":"app.py","testFile":"test_app.py"}
Rules: fix the bug, keep ALL code complete (no truncation), return ONLY JSON.`;

  // Extract just the key error line (not the full verbose output)
  const errorLines = errors.split('\n');
  const keyErrors: string[] = [];
  for (const line of errorLines) {
    if (line.includes('Error') || line.includes('FAILED') || line.includes('assert') || 
        line.includes('SyntaxError') || line.includes('ImportError') || line.includes('NameError')) {
      keyErrors.push(line.trim());
    }
  }
  const compactError = keyErrors.slice(0, 5).join('\n') || errors.slice(0, 300);

  // Only send the broken file, not ALL files (saves tokens)
  const brokenFile = currentFiles.find(f => {
    return keyErrors.some(e => e.includes(f.path));
  });

  const filesToSend = brokenFile 
    ? [brokenFile, ...currentFiles.filter(f => f.path !== brokenFile.path).map(f => ({ path: f.path, content: `# unchanged — ${f.content.length} chars` }))]
    : currentFiles;

  const filesStr = filesToSend
    .map(f => `--- ${f.path} ---\n${f.content}`)
    .join('\n\n');

  const userMessage = `App: ${prompt}
Error: ${compactError}
${userInstruction ? `Fix instruction: ${userInstruction}` : ''}
Files:
${filesStr}`;

  const raw = await callGrok(FIX_PROMPT, userMessage);
  const parsed = safeParseJSON(raw) as GeneratedApp;

  if (!parsed.files || parsed.files.length === 0) {
    throw new Error('AI fix generated no files');
  }

  // Merge: if AI only returned fixed files, keep unchanged ones from original
  const fixedPaths = new Set(parsed.files.map(f => f.path));
  const mergedFiles = [
    ...parsed.files,
    ...currentFiles.filter(f => !fixedPaths.has(f.path)),
  ];

  return {
    files: mergedFiles,
    entryPoint: parsed.entryPoint || 'app.py',
    testFile: parsed.testFile || 'test_app.py',
  };
}
