-- 🔧 TYPE Constraint Problem beheben
-- Problem: type 'multiple-choice' verletzt den Constraint
-- Lösung: Korrigiere type Werte von 'multiple-choice' zu 'multiple_choice'

-- 1. Finde alle problematischen type Werte
SELECT id, type, prompt 
FROM questions 
WHERE type = 'multiple-choice';

-- 2. Korrigiere alle 'multiple-choice' zu 'multiple_choice'
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

-- 3. Überprüfe die korrigierten Werte
SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

-- 4. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 5. Erstelle neuen Constraint mit korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

-- 6. Finale Überprüfung
SELECT 'TYPE Constraint Problem beheben abgeschlossen' as status;
SELECT type, COUNT(*) as count FROM questions GROUP BY type;
