-- Fix existing data before adding constraints
-- This will update all existing questions to have valid difficulty values

-- First, add the difficulty column if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10);

-- Update all existing questions to have a valid difficulty value
UPDATE questions SET difficulty = 'medium' WHERE difficulty IS NULL OR difficulty NOT IN ('easy', 'medium', 'hard');

-- Now drop any existing constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add the constraints back
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple-choice', 'true-false', 'open-ended', 'matching', 'image', 'fill-blank'));

-- Set default value for the column
ALTER TABLE questions ALTER COLUMN difficulty SET DEFAULT 'medium';

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
