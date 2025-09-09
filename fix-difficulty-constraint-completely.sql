-- Completely fix the difficulty constraint issue
-- Remove all existing constraints and recreate properly

-- First, drop ALL existing difficulty constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add the difficulty column if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) DEFAULT 'medium';

-- Recreate the constraints properly
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple-choice', 'true-false', 'open-ended', 'matching', 'image', 'fill-blank'));

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
