-- 🔧 Constraint mit Datenkorrektur beheben
-- Problem: Bestehende Daten verletzen den Constraint
-- Lösung: Zuerst alle Daten korrigieren, dann Constraint hinzufügen

-- 1. Überprüfe alle difficulty Werte in der Tabelle
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 2. Korrigiere alle problematischen difficulty Werte
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'intermediate' OR difficulty IS NULL;

-- 3. Korrigiere alle anderen ungültigen Werte
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty NOT IN ('easy', 'medium', 'hard');

-- 4. Überprüfe die korrigierten Werte
SELECT difficulty, COUNT(*) as count 
FROM questions 
GROUP BY difficulty;

-- 5. Lösche den Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- 6. Erstelle neuen Constraint mit korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 7. Finale Überprüfung
SELECT 'Constraint mit Datenkorrektur abgeschlossen' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
