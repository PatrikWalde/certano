-- Restore the original working schema
-- This will bring back the foreign key constraint but with proper configuration

-- First, drop any existing constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- Restore the original column definition
ALTER TABLE questions ALTER COLUMN chapter SET NOT NULL;

-- Add the foreign key constraint back with proper configuration
ALTER TABLE questions ADD CONSTRAINT questions_chapter_fkey 
FOREIGN KEY (chapter) REFERENCES chapters(name) 
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE chapters TO authenticated;
