-- 🔧 Constraint FINDEN und beheben
-- Problem: Es gibt noch Daten die den Constraint verletzen
-- Lösung: Zuerst alle problematischen Daten finden und korrigieren

-- 1. Finde alle problematischen difficulty Werte
SELECT id, difficulty, prompt 
FROM questions 
WHERE difficulty NOT IN ('easy', 'medium', 'hard') 
   OR difficulty IS NULL 
   OR difficulty = '';

-- 2. Finde alle problematischen type Werte
SELECT id, type, prompt 
FROM questions 
WHERE type NOT IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank');

-- 3. Korrigiere alle problematischen difficulty Werte
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty NOT IN ('easy', 'medium', 'hard') 
   OR difficulty IS NULL 
   OR difficulty = '';

-- 4. Korrigiere alle problematischen type Werte
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type NOT IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank');

-- 5. Überprüfe die korrigierten Werte
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

-- 6. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 7. Erstelle neuen Constraint
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 8. Finale Überprüfung
SELECT 'Constraint FINDEN und beheben abgeschlossen' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
