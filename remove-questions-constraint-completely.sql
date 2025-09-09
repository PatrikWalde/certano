-- Remove the foreign key constraint completely
-- This will allow question creation and chapter updates to work independently

-- Drop the existing foreign key constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE chapters TO authenticated;
