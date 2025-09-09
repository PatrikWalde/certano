-- Fix the difficulty constraint to include 'intermediate' value

-- 1. First, update existing 'intermediate' values to 'medium'
UPDATE questions SET difficulty = 'medium' WHERE difficulty = 'intermediate';

-- 2. Drop existing difficulty constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 3. Add the correct difficulty constraint that includes 'intermediate'
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard', 'intermediate'));

-- 4. Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;

-- 5. Verify the data and constraints
SELECT 'Data verification:' as info;
SELECT DISTINCT difficulty FROM questions;

SELECT 'Constraint verification:' as info;
SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'questions'::regclass;
