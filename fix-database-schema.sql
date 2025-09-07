-- Fix database schema - Add missing columns and tables
-- Run this script in your Supabase SQL editor to fix the database schema

-- 1. Add topic_id column to chapters table if it doesn't exist
ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

-- 2. Add question_number column to questions table if it doesn't exist
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_number VARCHAR(50);

-- 3. Create unique index on question_number (but allow NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_question_number 
ON questions (question_number) 
WHERE question_number IS NOT NULL;

-- 4. Update existing questions with auto-generated question numbers if they don't have one
UPDATE questions 
SET question_number = TO_CHAR(created_at, 'YYYY-MM-DD-HH24-MI-SS') || '-' || SUBSTRING(id::text, 1, 8)
WHERE question_number IS NULL;

-- 5. Add comments to the new columns
COMMENT ON COLUMN chapters.topic_id IS 'Reference to the topic this chapter belongs to';
COMMENT ON COLUMN questions.question_number IS 'Unique question number in format YYYY-MM-DD-HH-MM-SS or custom format';

-- 6. Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('chapters', 'questions', 'topics')
    AND column_name IN ('topic_id', 'question_number', 'id', 'name')
ORDER BY table_name, column_name;


