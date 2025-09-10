-- 🔧 Fix: Foreign Key Constraint Problem
-- Problem: 'Test-Kapitel' existiert nicht in der chapters Tabelle

-- 1. Überprüfe die chapters Tabelle
SELECT id, name FROM chapters ORDER BY name;

-- 2. Überprüfe den Foreign Key Constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public'
  AND c.conname = 'questions_chapter_fkey';

-- 3. Erstelle ein Test-Kapitel
INSERT INTO chapters (name, description, color, icon, is_active)
VALUES ('Test-Kapitel', 'Test-Kapitel für Debugging', '#3b82f6', '🧪', true)
RETURNING *;

-- 4. Teste eine Frage-Erstellung mit dem existierenden Kapitel
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-FK-001',
  'Test-Frage mit existierendem Kapitel',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 5. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-FK-001';

-- 6. Lösche das Test-Kapitel
DELETE FROM chapters WHERE name = 'Test-Kapitel';

-- 7. Teste mit einem existierenden Kapitel
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  tags
) VALUES (
  'TEST-EXISTING-001',
  'Test-Frage mit existierendem Kapitel',
  'multiple_choice',
  (SELECT name FROM chapters LIMIT 1),
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  ARRAY['test']
) RETURNING *;

-- 8. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-EXISTING-001';
