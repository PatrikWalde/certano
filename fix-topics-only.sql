-- Fix RLS policies for topics table only
-- This script fixes the 406 error when updating topics

-- Enable RLS on topics table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for topics
DROP POLICY IF EXISTS "Enable read access for all users" ON topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON topics;

-- Create a comprehensive policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON topics
    FOR ALL USING (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'topics';


