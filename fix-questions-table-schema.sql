-- Fix the questions table schema to remove the foreign key constraint
-- The constraint is still defined in the table schema

-- First, drop the existing constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- Modify the chapter column to remove the foreign key reference
ALTER TABLE questions ALTER COLUMN chapter DROP NOT NULL;

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE chapters TO authenticated;
