-- Check usage stats for walde5077@gmail.com

SELECT 
    u.email,
    up.daily_usage,
    up.subscription_type,
    up.last_usage_date,
    up.role,
    up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.auth_user_id
WHERE u.email = 'walde5077@gmail.com';
