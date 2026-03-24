import { callGrok, safeParseJSON } from './grok';

export interface StackSelection {
  language: 'python';
  framework: string;
  database: string;
  needsAuth: boolean;
  port: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a tech stack selector for an AI application builder.
Given a user's app description, select the optimal Python tech stack.

Respond ONLY with JSON:
{
  "language": "python",
  "framework": "flask",
  "database": "sqlite" or "none",
  "needsAuth": true or false,
  "port": 5001,
  "reasoning": "Brief explanation of why this stack was chosen"
}

Rules:
- Always use Python as the language
- Framework must be "flask"
- Database should be "sqlite" if data persistence is needed, "none" otherwise
- Set needsAuth to true if the user mentions users, login, auth, accounts
- Port should be 5001
- Return ONLY the JSON object`;

export async function selectStack(prompt: string): Promise<StackSelection> {
  const raw = await callGrok(SYSTEM_PROMPT, `Select the best stack for: ${prompt}`);
  const parsed = safeParseJSON(raw) as StackSelection;
  
  // Ensure defaults
  return {
    language: 'python',
    framework: parsed.framework || 'flask',
    database: parsed.database || 'none',
    needsAuth: parsed.needsAuth || false,
    port: parsed.port || 5001,
    reasoning: parsed.reasoning || 'Flask with SQLite selected as the optimal stack.',
  };
}
