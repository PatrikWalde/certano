-- 🔧 Fix: questions_type_check Constraint FINALE LÖSUNG
-- Problem: 'multiple_choice' verletzt immer noch den Constraint

-- 1. Überprüfe die aktuellen type-Werte in der Tabelle
SELECT DISTINCT type, COUNT(*) as count
FROM questions
GROUP BY type;

-- 2. Überprüfe den aktuellen Constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public'
  AND c.conname = 'questions_type_check';

-- 3. Lösche den alten Constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 4. Korrigiere alle problematischen type-Werte
UPDATE questions SET type = 'multiple_choice' WHERE type = 'multiple-choice';
UPDATE questions SET type = 'true_false' WHERE type = 'true-false';
UPDATE questions SET type = 'open_ended' WHERE type = 'open-ended';
UPDATE questions SET type = 'image_question' WHERE type = 'image-question';

-- 5. Überprüfe die korrigierten type-Werte
SELECT DISTINCT type, COUNT(*) as count
FROM questions
GROUP BY type;

-- 6. Erstelle einen neuen Constraint mit den korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'matching', 'image_question', 'open_ended'));

-- 7. Überprüfe den neuen Constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public'
  AND c.conname = 'questions_type_check';

-- 8. Teste eine Frage-Erstellung
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-FINAL-001',
  'Test-Frage nach Constraint-Fix',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 9. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-FINAL-001';
