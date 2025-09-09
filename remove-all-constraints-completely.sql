-- Remove ALL constraints completely and add new ones

-- 1. Remove ALL existing constraints (including any that might exist)
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- 2. Check what constraints still exist
SELECT 'Remaining constraints:' as info;
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'questions'::regclass;

-- 3. Add the correct constraints that match the actual data
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'open_ended', 'matching', 'image', 'fill_blank'));

ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard', 'intermediate'));

-- 4. Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;

-- 5. Verify the new constraints
SELECT 'New constraints:' as info;
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'questions'::regclass;
