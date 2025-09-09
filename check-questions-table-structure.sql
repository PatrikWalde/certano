-- Check the current structure of the questions table
-- This will help us understand what columns exist and what constraints are active

-- Check if difficulty column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;

-- Check all constraints on the questions table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'questions'::regclass;

-- Check if there are any check constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'questions'::regclass 
AND contype = 'c';
