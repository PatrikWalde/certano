-- 🔍 Überprüfe die aktuelle Struktur der questions Tabelle
-- Problem: 400 Bad Request beim Erstellen von Fragen

-- 1. Überprüfe die Spalten der questions Tabelle
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'questions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Überprüfe die Constraints der questions Tabelle
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = 'questions'
  AND n.nspname = 'public';

-- 3. Überprüfe die Indizes der questions Tabelle
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'questions'
  AND schemaname = 'public';

-- 4. Überprüfe die RLS-Policies der questions Tabelle
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'questions'
  AND schemaname = 'public';