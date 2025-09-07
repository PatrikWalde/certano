-- Comprehensive RLS policy fix for all tables
-- This script ensures proper permissions for all CRUD operations

-- Enable RLS on existing tables
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- Note: users and stats tables may not exist, so we skip them

-- ==============================================
-- TOPICS TABLE POLICIES
-- ==============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON topics;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON topics;

-- Create comprehensive policy for topics
CREATE POLICY "Enable all operations for authenticated users" ON topics
    FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- CHAPTERS TABLE POLICIES
-- ==============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON chapters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON chapters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON chapters;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON chapters;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON chapters;

-- Create comprehensive policy for chapters
CREATE POLICY "Enable all operations for authenticated users" ON chapters
    FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- QUESTIONS TABLE POLICIES
-- ==============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON questions;

-- Create comprehensive policy for questions
CREATE POLICY "Enable all operations for authenticated users" ON questions
    FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- USERS TABLE POLICIES (SKIPPED - TABLE DOESN'T EXIST)
-- ==============================================
-- Note: users table doesn't exist in this database, so we skip it

-- ==============================================
-- STATS TABLE POLICIES (SKIPPED - TABLE DOESN'T EXIST)
-- ==============================================
-- Note: stats table doesn't exist in this database, so we skip it

-- ==============================================
-- VERIFICATION
-- ==============================================
-- Show all policies for verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('topics', 'chapters', 'questions')
ORDER BY tablename, policyname;
