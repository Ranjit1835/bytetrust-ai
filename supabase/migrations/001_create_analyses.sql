-- ByteTrust AI — Supabase Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  prompt TEXT NOT NULL,
  code TEXT NOT NULL,
  execution_plan JSONB NOT NULL DEFAULT '[]',
  test_cases JSONB NOT NULL DEFAULT '[]',
  test_results JSONB NOT NULL DEFAULT '[]',
  explanation JSONB,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Medium' CHECK (risk_level IN ('Low', 'Medium', 'High')),
  confidence_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching user history efficiently
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Permissive policy (tighten after adding auth)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations' AND tablename = 'analyses'
  ) THEN
    CREATE POLICY "Allow all operations" ON analyses FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
