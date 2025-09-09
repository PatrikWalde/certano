-- Fix the questions foreign key constraint
-- The DEFERRABLE constraint might be causing issues with question creation

-- First, drop the existing constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- Create a simpler constraint without DEFERRABLE
ALTER TABLE questions ADD CONSTRAINT questions_chapter_fkey 
FOREIGN KEY (chapter) REFERENCES chapters(name) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE chapters TO authenticated;
