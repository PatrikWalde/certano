-- 🔍 Constraint-Definition überprüfen und Problem beheben
-- Basierend auf Supabase Support Anleitung

-- 1. Überprüfe die Constraint-Definition
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c 
JOIN pg_class t ON t.oid = c.conrelid 
JOIN pg_namespace n ON n.oid = t.relnamespace 
WHERE t.relname = 'questions' 
  AND n.nspname = 'public' 
  AND c.contype = 'c';

-- 2. Überprüfe alle aktuellen Werte in der Tabelle
SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 3. Finde alle problematischen Werte
SELECT id, type, difficulty, prompt 
FROM questions 
WHERE type = 'multiple-choice' 
   OR difficulty = 'advanced' 
   OR difficulty NOT IN ('easy', 'medium', 'hard')
   OR type NOT IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank');

-- 4. Korrigiere alle problematischen Werte
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'advanced' 
   OR difficulty NOT IN ('easy', 'medium', 'hard')
   OR difficulty IS NULL 
   OR difficulty = '';

-- 5. Überprüfe die korrigierten Werte
SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 6. Lösche alle Constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 7. Erstelle neue Constraints mit korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

-- 8. Finale Überprüfung
SELECT 'Constraint-Überprüfung und Problem beheben abgeschlossen' as status;
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c 
JOIN pg_class t ON t.oid = c.conrelid 
JOIN pg_namespace n ON n.oid = t.relnamespace 
WHERE t.relname = 'questions' 
  AND n.nspname = 'public' 
  AND c.contype = 'c';
