-- 🔒 RLS (Row Level Security) für alle Tabellen aktivieren
-- Behebt Security-Warnungen von Supabase
-- Alle Tabellen müssen RLS haben, wenn sie öffentlich zugänglich sind

-- 1. RLS für question_errors aktivieren
ALTER TABLE question_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies für question_errors
DROP POLICY IF EXISTS "Users can view question_errors" ON question_errors;
DROP POLICY IF EXISTS "Users can insert question_errors" ON question_errors;
DROP POLICY IF EXISTS "Users can update question_errors" ON question_errors;
DROP POLICY IF EXISTS "Users can delete question_errors" ON question_errors;

CREATE POLICY "Users can view question_errors" ON question_errors FOR SELECT USING (true);
CREATE POLICY "Users can insert question_errors" ON question_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update question_errors" ON question_errors FOR UPDATE USING (true);
CREATE POLICY "Users can delete question_errors" ON question_errors FOR DELETE USING (true);

-- 2. RLS für quests aktivieren
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- RLS Policies für quests
DROP POLICY IF EXISTS "Users can view quests" ON quests;
DROP POLICY IF EXISTS "Users can insert quests" ON quests;
DROP POLICY IF EXISTS "Users can update quests" ON quests;
DROP POLICY IF EXISTS "Users can delete quests" ON quests;

CREATE POLICY "Users can view quests" ON quests FOR SELECT USING (true);
CREATE POLICY "Users can insert quests" ON quests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update quests" ON quests FOR UPDATE USING (true);
CREATE POLICY "Users can delete quests" ON quests FOR DELETE USING (true);

-- 3. RLS für badges aktivieren
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies für badges
DROP POLICY IF EXISTS "Users can view badges" ON badges;
DROP POLICY IF EXISTS "Users can insert badges" ON badges;
DROP POLICY IF EXISTS "Users can update badges" ON badges;
DROP POLICY IF EXISTS "Users can delete badges" ON badges;

CREATE POLICY "Users can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can insert badges" ON badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update badges" ON badges FOR UPDATE USING (true);
CREATE POLICY "Users can delete badges" ON badges FOR DELETE USING (true);

-- 4. RLS für user_profiles aktivieren
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies für user_profiles
DROP POLICY IF EXISTS "Users can view user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete user_profiles" ON user_profiles;

CREATE POLICY "Users can view user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update user_profiles" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Users can delete user_profiles" ON user_profiles FOR DELETE USING (true);

-- 5. Überprüfung
SELECT 'RLS Security aktiviert' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('question_errors', 'quests', 'badges', 'user_profiles');
