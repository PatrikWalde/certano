-- 🔧 difficulty Spalte und Constraint entfernen
-- Problem: difficulty Spalte existiert noch, obwohl die Funktion entfernt wurde
-- Lösung: Spalte und Constraint komplett entfernen

-- 1. Überprüfe die aktuelle Tabellenstruktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND table_schema = 'public'
  AND column_name = 'difficulty';

-- 2. Überprüfe den Constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c 
JOIN pg_class t ON t.oid = c.conrelid 
JOIN pg_namespace n ON n.oid = t.relnamespace 
WHERE t.relname = 'questions' 
  AND n.nspname = 'public' 
  AND c.conname = 'questions_difficulty_check';

-- 3. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 4. Lösche die Spalte
ALTER TABLE questions DROP COLUMN IF EXISTS difficulty;

-- 5. Überprüfe die neue Tabellenstruktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Finale Überprüfung
SELECT 'difficulty Spalte und Constraint entfernt' as status;
