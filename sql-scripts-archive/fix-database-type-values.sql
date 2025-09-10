-- 🔧 Datenbank type Werte korrigieren
-- Problem: Es gibt noch alte Daten mit 'multiple-choice' (Bindestrich)
-- Lösung: Alle 'multiple-choice' zu 'multiple_choice' korrigieren

-- 1. Finde alle 'multiple-choice' Werte
SELECT id, type, prompt 
FROM questions 
WHERE type = 'multiple-choice';

-- 2. Korrigiere alle 'multiple-choice' zu 'multiple_choice'
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

-- 3. Überprüfe alle type Werte
SELECT type, COUNT(*) as count 
FROM questions 
GROUP BY type;

-- 4. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 5. Erstelle neuen Constraint
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

-- 6. Finale Überprüfung
SELECT 'Datenbank type Werte korrigiert' as status;
SELECT type, COUNT(*) as count FROM questions GROUP BY type;
