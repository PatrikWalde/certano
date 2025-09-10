-- 🔍 Debug: Genauere Fehleranalyse
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

-- 3. Teste mit minimalen Daten (nur erforderliche Felder)
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter
) VALUES (
  'TEST-MIN-001',
  'Minimale Test-Frage',
  'multiple_choice',
  'Test-Kapitel'
) RETURNING *;

-- 4. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-MIN-001';

-- 5. Teste mit options (JSON)
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options
) VALUES (
  'TEST-OPTIONS-001',
  'Test-Frage mit Options',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]'::jsonb
) RETURNING *;

-- 6. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-OPTIONS-001';

-- 7. Teste mit tags (Array)
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  tags
) VALUES (
  'TEST-TAGS-001',
  'Test-Frage mit Tags',
  'multiple_choice',
  'Test-Kapitel',
  ARRAY['test', 'debug']
) RETURNING *;

-- 8. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-TAGS-001';
