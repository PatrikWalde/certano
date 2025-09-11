-- Überprüfe alle Benutzer in der user_profiles Tabelle
SELECT 
    auth_user_id,
    first_name,
    last_name,
    city,
    evu,
    role,
    subscription_type,
    daily_usage,
    last_usage_date,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY created_at DESC;

-- Überprüfe auch die auth.users Tabelle (falls verfügbar)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;
