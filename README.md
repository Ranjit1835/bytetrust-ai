# ByteTrust AI

> Execution-Aware AI Coding Agent

## What It Does

ByteTrust generates Python code from natural language, simulates execution, runs test cases in an isolated sandbox, and delivers a confidence score before you ship.

## The 7-Step Pipeline

1. **Prompt Input** — Describe what you need in natural language
2. **AI Generation** — Claude generates Python code
3. **Execution Plan** — Step-by-step logic breakdown
4. **Test Generation** — Automatic test case creation
5. **Sandbox Run** — Safe isolated Python execution
6. **Verification** — AI analyzes correctness
7. **Confidence Score** — Quantified reliability rating

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.local` and fill in your API keys
4. Create Supabase tables (schema below)
5. `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Source |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings |

## Supabase Schema

```sql
CREATE TABLE analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  prompt text NOT NULL,
  generated_code text,
  execution_plan jsonb,
  test_cases jsonb,
  test_results jsonb,
  confidence_score integer,
  risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own analyses" ON analyses FOR ALL USING (auth.uid() = user_id);
```

## Requirements

- Node.js 18+
- Python 3.9+ (for sandbox execution)
- npm 9+

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **AI Engine:** Anthropic Claude API
- **Code Execution:** Python sandbox via child_process
- **Database:** Supabase
- **Styling:** Tailwind CSS + Custom design system
- **Animations:** Framer Motion
