-- Fix RLS policies for topics table
-- This script ensures proper permissions for topics CRUD operations

-- First, check if RLS is enabled
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON topics;

-- Create new policies
-- Read access for all authenticated users
CREATE POLICY "Enable read access for all users" ON topics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert access for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON topics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update access for authenticated users
CREATE POLICY "Enable update for authenticated users" ON topics
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Delete access for authenticated users
CREATE POLICY "Enable delete for authenticated users" ON topics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to allow all operations for authenticated users
-- You can use this single policy instead of the above four:
/*
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON topics;
CREATE POLICY "Enable all operations for authenticated users" ON topics
    FOR ALL USING (auth.role() = 'authenticated');
*/

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'topics';


