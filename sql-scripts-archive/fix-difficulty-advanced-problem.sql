-- 🔧 difficulty 'advanced' Problem beheben
-- Problem: difficulty 'advanced' verletzt den Constraint
-- Lösung: Alle 'advanced' zu 'medium' korrigieren

-- 1. Finde alle 'advanced' Werte
SELECT id, difficulty, prompt 
FROM questions 
WHERE difficulty = 'advanced';

-- 2. Korrigiere alle 'advanced' zu 'medium'
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'advanced';

-- 3. Überprüfe alle difficulty Werte
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 4. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 5. Erstelle neuen Constraint
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 6. Finale Überprüfung
SELECT 'difficulty advanced Problem beheben abgeschlossen' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
