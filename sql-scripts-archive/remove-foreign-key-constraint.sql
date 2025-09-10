-- Remove the foreign key constraint that's causing problems
-- This will allow us to update chapters and questions independently

-- First, drop the existing foreign key constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- Create a new constraint that's DEFERRABLE (allows updates within transactions)
ALTER TABLE questions ADD CONSTRAINT questions_chapter_fkey 
FOREIGN KEY (chapter) REFERENCES chapters(name) 
DEFERRABLE INITIALLY DEFERRED;

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE chapters TO authenticated;
