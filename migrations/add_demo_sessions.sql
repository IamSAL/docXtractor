-- Migration: add demo_sessions table and is_demo column to runs
-- Run before the first production deploy of the demo trial platform feature.

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint VARCHAR NOT NULL,
  email VARCHAR,
  runs_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT demo_sessions_fingerprint_unique UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_fingerprint ON demo_sessions (fingerprint);

ALTER TABLE runs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_runs_is_demo ON runs (is_demo) WHERE is_demo = TRUE;
