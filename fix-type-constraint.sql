-- Fix the type constraint to match the actual values being used
-- The constraint expects 'multiple_choice' but the app uses 'multiple-choice'

-- Drop the existing type constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- Add the correct type constraint with the right values
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple-choice', 'true-false', 'open-ended', 'matching', 'image', 'fill-blank'));

-- Grant necessary permissions
GRANT ALL ON TABLE questions TO authenticated;
