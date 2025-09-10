-- 🔍 Debug: Frage-Erstellung Problem analysieren
-- Problem: 400 Bad Request beim Erstellen von Fragen

-- 1. Überprüfe die aktuelle Tabellenstruktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'questions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Überprüfe die Constraints
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public';

-- 3. Teste eine einfache Frage-Erstellung
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  explanation,
  tags
) VALUES (
  'TEST-001',
  'Test-Frage',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  'Test-Erklärung',
  '["test"]'
) RETURNING *;

-- 4. Lösche die Test-Frage wieder
DELETE FROM questions WHERE question_number = 'TEST-001';
