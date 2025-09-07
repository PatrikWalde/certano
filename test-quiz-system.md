# Quiz-System Test

## Problem: Dashboard zeigt keine Statistiken

### Mögliche Ursachen:
1. **user_stats Tabelle existiert nicht** in der Supabase-Datenbank
2. **Keine Quiz-Sessions** wurden bisher gemacht
3. **Fehler in der Datenbankverbindung**

### Lösungsschritte:

#### 1. SQL-Tabellen erstellen
Führen Sie diese SQL-Skripte in Supabase aus:

```sql
-- Erstelle user_stats Tabelle
\i create-user-stats-table.sql

-- Erstelle quiz_sessions Tabelle (falls noch nicht gemacht)
\i create-quiz-sessions-table.sql
```

#### 2. Quiz testen
1. Gehen Sie zu http://localhost:3006/
2. Melden Sie sich an
3. Klicken Sie auf "Schnell-Quiz"
4. Beantworten Sie 2-3 Fragen
5. Schauen Sie in die Browser-Konsole für Debug-Ausgaben

#### 3. Dashboard prüfen
1. Gehen Sie zurück zum Dashboard
2. Die Statistiken sollten jetzt angezeigt werden
3. Prüfen Sie die Browser-Konsole für Fehler

### Debug-Ausgaben in der Konsole:
- "Lade Statistiken für Benutzer: [user-id]"
- "Statistiken erfolgreich geladen: [data]"
- "Aktualisiere Statistiken für Benutzer: [user-id]"
- "Statistiken erfolgreich aktualisiert"

### Falls immer noch Probleme:
1. Prüfen Sie die Supabase-Konsole auf Fehler
2. Stellen Sie sicher, dass RLS-Policies korrekt sind
3. Prüfen Sie die Browser-Netzwerk-Tab für fehlgeschlagene API-Aufrufe


