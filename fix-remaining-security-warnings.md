# 🔒 Verbleibende Security-Warnungen beheben

## 1. Function Search Path Mutable ⚠️
**Scripts:** 
- `fix-function-search-path.sql` (behebt handle_user_update und handle_new_user)
- `fix-update-chapter-function.sql` (behebt update_chapter_with_questions)
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
2. **Dann:** `fix-update-chapter-function.sql` in SQL Editor ausführen
3. **Dann:** Die anderen 3 Warnungen manuell im Dashboard beheben
