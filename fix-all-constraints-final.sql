-- Fix ALL constraints to match the actual data being used

-- 1. First, ensure all existing data is valid
-- Update type values to use underscores (if needed)
UPDATE questions SET type = 'multiple_choice' WHERE type = 'multiple-choice';
UPDATE questions SET type = 'true_false' WHERE type = 'true-false';
UPDATE questions SET type = 'open_ended' WHERE type = 'open-ended';
UPDATE questions SET type = 'fill_blank' WHERE type = 'fill-blank';

-- Ensure all difficulty values are valid
UPDATE questions SET difficulty = 'medium' WHERE difficulty IS NULL OR difficulty NOT IN ('easy', 'medium', 'hard', 'intermediate');

-- 2. Drop ALL existing constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 3. Add the correct constraints that match the actual data
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'open_ended', 'matching', 'image', 'fill_blank'));

ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard', 'intermediate'));

-- 4. Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;

-- 5. Verify the data and constraints
SELECT 'Data verification:' as info;
SELECT DISTINCT type FROM questions;
SELECT DISTINCT difficulty FROM questions;

SELECT 'Constraint verification:' as info;
SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'questions'::regclass;
