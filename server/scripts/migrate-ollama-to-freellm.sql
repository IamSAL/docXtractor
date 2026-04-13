-- Migration: Rename extraction_provider enum value 'ollama' → 'freellm'
-- Run this BEFORE deploying the new code if your database has existing rows with 'ollama'.
-- TypeORM synchronize:true will add the new 'freellm' value but won't remove 'ollama'.
--
-- Usage: psql -d docxtractor -f server/scripts/migrate-ollama-to-freellm.sql

-- Step 1: Update existing rows that reference 'ollama'
UPDATE run SET "extractionProvider" = 'freellm' WHERE "extractionProvider" = 'ollama';
UPDATE extractor SET "extractionProvider" = 'freellm' WHERE "extractionProvider" = 'ollama';

-- Step 2: Rename the enum value in the PostgreSQL type
-- (Only needed if TypeORM hasn't already added 'freellm' and you want to clean up 'ollama')
-- This uses ALTER TYPE ... RENAME VALUE which requires PostgreSQL 10+
DO $$
BEGIN
  -- Check if 'ollama' still exists in the enum
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ollama'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'run_extractionprovider_enum')
  ) THEN
    -- If 'freellm' doesn't exist yet, rename 'ollama' to 'freellm'
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'freellm'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'run_extractionprovider_enum')
    ) THEN
      ALTER TYPE run_extractionprovider_enum RENAME VALUE 'ollama' TO 'freellm';
    END IF;
  END IF;
END $$;

-- Repeat for extractor table's enum if it's a separate type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ollama'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'extractor_extractionprovider_enum')
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'freellm'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'extractor_extractionprovider_enum')
    ) THEN
      ALTER TYPE extractor_extractionprovider_enum RENAME VALUE 'ollama' TO 'freellm';
    END IF;
  END IF;
END $$;
