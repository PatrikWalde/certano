-- 🔧 NUR bestehende Daten korrigieren - KEINE Constraints ändern!
-- Problem: Bestehende Daten haben 'intermediate' als difficulty
-- Lösung: Nur die Daten korrigieren, Constraints bleiben unverändert

-- 1. Korrigiere difficulty Werte (intermediate -> medium)
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'intermediate';

-- 2. Überprüfung
SELECT 'Datenkorrektur abgeschlossen' as status;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
