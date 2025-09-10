-- 🔧 Fix: Frage-Erstellung FUNKTIONIERENDES Script
-- Problem: Test-Kapitel existiert nicht, Constraint-Probleme

-- 1. Überprüfe die existierenden Kapitel
SELECT id, name FROM chapters ORDER BY name;

-- 2. Überprüfe die aktuellen type-Werte
SELECT DISTINCT type, COUNT(*) as count FROM questions GROUP BY type;

-- 3. Lösche den alten type-constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 4. Korrigiere alle problematischen type-Werte
UPDATE questions SET type = 'multiple_choice' WHERE type = 'multiple-choice';
UPDATE questions SET type = 'true_false' WHERE type = 'true-false';
UPDATE questions SET type = 'open_ended' WHERE type = 'open-ended';
UPDATE questions SET type = 'image_question' WHERE type = 'image-question';

-- 5. Erstelle einen neuen type-constraint
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'matching', 'image_question', 'open_ended'));

-- 6. Teste mit dem ERSTEN existierenden Kapitel
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-WORKING-001',
  'Test-Frage mit existierendem Kapitel',
  'multiple_choice',
  (SELECT name FROM chapters ORDER BY name LIMIT 1),
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 7. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-WORKING-001';

-- 8. Teste mit einem spezifischen Kapitel (falls vorhanden)
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-SPECIFIC-001',
  'Test-Frage mit spezifischem Kapitel',
  'multiple_choice',
  'Vorfahrtsregeln',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 9. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-SPECIFIC-001';

-- 10. Finale Überprüfung
SELECT 'Frage-Erstellung sollte jetzt funktionieren!' as status;
