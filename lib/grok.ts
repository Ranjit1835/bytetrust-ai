import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Only currently active Groq production + preview models
const MODELS = [
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

export async function callGrok(systemPrompt: string, userMessage: string): Promise<string> {
  let lastError: unknown = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      const response = await groq.chat.completions.create({
        model,
        max_tokens: 8192,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');

      if (i > 0) {
        console.log(`[Groq] Using model: ${model} (fallback #${i})`);
      }

      // Log first 200 chars to debug JSON issues
      console.log(`[Groq] Response start (${model}): ${content.substring(0, 200)}...`);
      return content;
    } catch (err: unknown) {
      lastError = err;
      const error = err as { status?: number; message?: string };

      if (error.status === 429 || error.status === 413 || error.status === 400) {
        console.warn(`[Groq] ${error.status} on ${model}: ${error.message?.substring(0, 100)}`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Groq models unavailable. Please wait a few minutes and try again.');
}

/**
 * Extract JSON from any LLM response format.
 * Handles: <think> tags, markdown fences, mixed text, truncation.
 */
export function extractJSON(raw: string): string {
  let str = raw.trim();

  // 1. Strip ALL <think>...</think> blocks (Qwen3 reasoning)
  //    Use greedy match to handle nested or malformed tags
  while (str.includes('<think>')) {
    const thinkStart = str.indexOf('<think>');
    const thinkEnd = str.indexOf('</think>');
    if (thinkEnd > thinkStart) {
      str = (str.substring(0, thinkStart) + str.substring(thinkEnd + 8)).trim();
    } else {
      // No closing tag — strip everything from <think> onward to next {
      const nextBrace = str.indexOf('{', thinkStart);
      if (nextBrace !== -1) {
        str = str.substring(nextBrace);
      } else {
        str = str.substring(thinkStart + 7); // skip "<think>"
      }
      break;
    }
  }

  str = str.trim();

  // 2. Strip markdown fences line by line
  const lines = str.split('\n');
  if (lines[0] && lines[0].match(/^```/)) {
    let lastFenceIdx = -1;
    for (let i = lines.length - 1; i > 0; i--) {
      if (lines[i].trim() === '```') {
        lastFenceIdx = i;
        break;
      }
    }
    str = (lastFenceIdx > 0
      ? lines.slice(1, lastFenceIdx)
      : lines.slice(1)
    ).join('\n').trim();
  }

  // 3. Find the first { and extract balanced JSON
  if (!str.startsWith('{') && !str.startsWith('[')) {
    const braceIdx = str.indexOf('{');
    const bracketIdx = str.indexOf('[');
    let startIdx = -1;

    if (braceIdx !== -1 && bracketIdx !== -1) {
      startIdx = Math.min(braceIdx, bracketIdx);
    } else {
      startIdx = braceIdx !== -1 ? braceIdx : bracketIdx;
    }

    if (startIdx !== -1) {
      str = str.substring(startIdx);
    }
  }

  // 4. Extract balanced JSON from start
  if (str.startsWith('{') || str.startsWith('[')) {
    str = extractBalancedJSON(str, 0);
  }

  return str;
}

/**
 * Extract balanced JSON, aware of strings.
 */
function extractBalancedJSON(str: string, start: number): string {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const ch = str[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }

    if (!inString) {
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') depth--;
      if (depth === 0) {
        return str.substring(start, i + 1);
      }
    }
  }

  // Truncated — close remaining braces/brackets
  const remaining = str.substring(start);
  if (depth > 0) {
    // Try to end any open string first
    let fixed = remaining;
    if (inString) fixed += '"';
    fixed += '}'.repeat(depth);
    return fixed;
  }
  return remaining;
}

/**
 * Safely parse JSON from LLM output.
 */
export function safeParseJSON(raw: string): unknown {
  const jsonStr = extractJSON(raw);

  // Log extracted JSON start for debugging
  console.log(`[Parse] Extracted JSON start: ${jsonStr.substring(0, 150)}...`);
  console.log(`[Parse] Extracted JSON length: ${jsonStr.length}`);

  // Attempt 1: Direct parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`[Parse] Direct parse failed: ${(e as Error).message.substring(0, 100)}`);
  }

  // Attempt 2: Sanitize control characters in strings
  const sanitized = jsonStr.replace(
    /("(?:[^"\\]|\\.)*")/g,
    (match) => {
      return match
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
    }
  );

  try {
    return JSON.parse(sanitized);
  } catch {
    // Fall through
  }

  // Attempt 3: Fix trailing commas
  const fixed = sanitized
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']');
  try {
    return JSON.parse(fixed);
  } catch {
    // Fall through
  }

  // Attempt 4: Try to find ANY valid JSON object in the string
  const braceRegex = /\{/g;
  let braceMatch: RegExpExecArray | null;
  while ((braceMatch = braceRegex.exec(jsonStr)) !== null) {
    try {
      const candidate = extractBalancedJSON(jsonStr, braceMatch.index);
      const result = JSON.parse(candidate);
      if (result && typeof result === 'object') {
        console.log(`[Parse] Found valid JSON at offset ${braceMatch.index}`);
        return result;
      }
    } catch {
      continue;
    }
  }

  // Log what we got for debugging
  console.error(`[Parse] ALL ATTEMPTS FAILED. Raw response first 500 chars:\n${raw.substring(0, 500)}`);
  throw new Error(
    `Failed to parse AI response as JSON. The AI model returned text instead of JSON. Please try again.`
  );
}
