-- 🔧 Constraint KOMPLETT beheben
-- Problem: questions_difficulty_check verletzt immer noch
-- Lösung: Constraint komplett entfernen und neu erstellen

-- 1. Überprüfe alle difficulty Werte in der Tabelle
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 2. Lösche ALLE Constraints die mit difficulty zu tun haben
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 3. Korrigiere alle problematischen Werte
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'intermediate' OR difficulty IS NULL OR difficulty = '';

UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

-- 4. Überprüfe die korrigierten Werte
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

-- 5. Erstelle neue Constraints mit korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

-- 6. Finale Überprüfung
SELECT 'Constraint KOMPLETT beheben abgeschlossen' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
SELECT type, COUNT(*) as count FROM questions GROUP BY type;
