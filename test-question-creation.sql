-- 🧪 Test: Frage-Erstellung mit minimalen Daten
-- Ziel: Herausfinden, was genau den 400 Bad Request verursacht

-- 1. Überprüfe die Tabellenstruktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'questions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Teste mit minimalen Daten
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter
) VALUES (
  'TEST-MINIMAL-001',
  'Minimale Test-Frage',
  'multiple_choice',
  'Test-Kapitel'
) RETURNING *;

-- 3. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-MINIMAL-001';

-- 4. Teste mit vollständigen Daten
INSERT INTO questions (
  question_number,
  prompt,
  type,
  chapter,
  options,
  explanation,
  tags,
  is_open_question
) VALUES (
  'TEST-FULL-001',
  'Vollständige Test-Frage',
  'multiple_choice',
  'Test-Kapitel',
  '[{"id": "1", "text": "Option 1", "isCorrect": true}]',
  'Test-Erklärung',
  '["test"]',
  false
) RETURNING *;

-- 5. Lösche die Test-Frage
DELETE FROM questions WHERE question_number = 'TEST-FULL-001';
