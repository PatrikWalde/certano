-- Fix BOTH type and difficulty constraints to match the actual values being used

-- 1. Fix the type constraint - app uses 'multiple_choice' (with underscore)
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'open_ended', 'matching', 'image', 'fill_blank'));

-- 2. Fix the difficulty constraint - ensure it accepts 'medium'
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 3. Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;

-- 4. Verify the constraints are working
SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'questions'::regclass;
