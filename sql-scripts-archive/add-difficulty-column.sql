-- Add difficulty column to questions table
-- This column was missing from the original schema

ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) DEFAULT 'medium' 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
