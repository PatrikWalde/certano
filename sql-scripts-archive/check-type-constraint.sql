-- 🔍 Überprüfe den questions_type_check Constraint
-- Problem: 'multiple_choice' verletzt den Constraint

-- 1. Überprüfe den aktuellen Constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public'
  AND c.conname = 'questions_type_check';

-- 2. Teste verschiedene type-Werte
SELECT 'multiple_choice' as test_type, 'multiple_choice'::text = ANY(ARRAY['multiple_choice', 'true_false', 'matching', 'image_question', 'open_ended']) as is_valid;
SELECT 'true_false' as test_type, 'true_false'::text = ANY(ARRAY['multiple_choice', 'true_false', 'matching', 'image_question', 'open_ended']) as is_valid;

-- 3. Überprüfe die aktuellen type-Werte in der Tabelle
SELECT DISTINCT type, COUNT(*) as count
FROM questions
GROUP BY type;

-- 4. Lösche den alten Constraint und erstelle einen neuen
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 5. Erstelle einen neuen Constraint mit den korrekten Werten
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'true_false', 'matching', 'image_question', 'open_ended'));

-- 6. Teste eine Frage-Erstellung
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-TYPE-001',
  'Test-Frage für Type-Constraint',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 7. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-TYPE-001';
