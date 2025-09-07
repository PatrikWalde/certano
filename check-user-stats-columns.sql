-- Prüfe welche Spalten in der user_stats Tabelle existieren
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position;


