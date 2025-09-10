# 🔒 Verbleibende Security-Warnungen beheben

## 1. Function Search Path Mutable ✅
**Script:** `fix-function-search-path.sql`
- Behebt die 3 Function Search Path Warnungen
- Setzt `search_path = public` für alle Functions

## 2. Leaked Password Protection ⚠️
**Problem:** Leaked password protection ist deaktiviert
**Lösung:** In Supabase Dashboard → Authentication → Settings
- Gehe zu "Password Protection"
- Aktiviere "Check passwords against HaveIBeenPwned"

## 3. Insufficient MFA Options ⚠️
**Problem:** Zu wenige MFA-Optionen aktiviert
**Lösung:** In Supabase Dashboard → Authentication → Settings
- Gehe zu "Multi-Factor Authentication"
- Aktiviere zusätzliche MFA-Methoden (SMS, TOTP, etc.)

## 4. Vulnerable Postgres Version ⚠️
**Problem:** Postgres Version hat Security-Patches
**Lösung:** In Supabase Dashboard → Settings → Database
- Klicke auf "Upgrade Database"
- Führe das Upgrade durch

## Ausführung:
1. **Zuerst:** `fix-function-search-path.sql` in SQL Editor ausführen
2. **Dann:** Die anderen 3 Warnungen manuell im Dashboard beheben
