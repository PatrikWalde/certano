-- Add question_number column to existing questions table
-- Run this script in your Supabase SQL editor to add the question_number column

-- Add the question_number column
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_number VARCHAR(50);

-- Create a unique index on question_number (but allow NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_question_number 
ON questions (question_number) 
WHERE question_number IS NOT NULL;

-- Add a comment to the column
COMMENT ON COLUMN questions.question_number IS 'Unique question number in format YYYY-MM-DD-HH-MM-SS or custom format';

-- Update existing questions with auto-generated question numbers if they don't have one
UPDATE questions 
SET question_number = TO_CHAR(created_at, 'YYYY-MM-DD-HH24-MI-SS') || '-' || SUBSTRING(id::text, 1, 8)
WHERE question_number IS NULL;

-- Note: After running this script, you may want to update the question_number format
-- to match the new format (YYYY-MM-DD-HH-MM-SS) by running:
-- UPDATE questions 
-- SET question_number = TO_CHAR(created_at, 'YYYY-MM-DD-HH24-MI-SS')
-- WHERE question_number LIKE '%-%-%-%-%-%-%';


