-- 🔧 Constraint überprüfen und korrigieren
-- Problem: questions_difficulty_check verletzt immer noch
-- Lösung: Constraint überprüfen und korrigieren

-- 1. Überprüfe den aktuellen Constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'questions_difficulty_check';

-- 2. Überprüfe alle difficulty Werte in der Tabelle
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 3. Überprüfe die erlaubten Werte im Constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'questions_difficulty_check';

-- 4. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 5. Erstelle neuen Constraint mit korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 6. Überprüfung
SELECT 'Constraint korrigiert' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
