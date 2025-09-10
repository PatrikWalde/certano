-- 🔧 ALLE problematischen Werte beheben
-- Problem: Es gibt noch alte Daten mit 'multiple-choice' und anderen problematischen Werten
-- Lösung: Alle problematischen Werte korrigieren

-- 1. Finde alle problematischen Werte
SELECT id, type, difficulty, prompt 
FROM questions 
WHERE type = 'multiple-choice' 
   OR difficulty = 'advanced' 
   OR difficulty NOT IN ('easy', 'medium', 'hard')
   OR type NOT IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank');

-- 2. Korrigiere alle problematischen Werte
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'advanced' 
   OR difficulty NOT IN ('easy', 'medium', 'hard')
   OR difficulty IS NULL 
   OR difficulty = '';

-- 3. Überprüfe alle Werte
SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 4. Lösche alle Constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 5. Erstelle neue Constraints
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

-- 6. Finale Überprüfung
SELECT 'ALLE problematischen Werte beheben abgeschlossen' as status;
SELECT type, COUNT(*) as count FROM questions GROUP BY type;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
