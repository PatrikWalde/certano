-- Prüfe ob user_stats Tabelle existiert und Daten enthält
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position;

-- Prüfe ob es Daten in user_stats gibt
SELECT COUNT(*) as total_records FROM user_stats;

-- Prüfe ob es Daten für den aktuellen Benutzer gibt
SELECT * FROM user_stats WHERE user_id = auth.uid();


