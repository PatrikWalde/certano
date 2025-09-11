-- Reset usage stats for walde5077@gmail.com

UPDATE user_profiles 
SET 
    daily_usage = 0,
    last_usage_date = NULL
WHERE auth_user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'walde5077@gmail.com'
);

-- Show updated stats
SELECT 
    u.email,
    up.daily_usage,
    up.subscription_type,
    up.last_usage_date,
    up.role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.auth_user_id
WHERE u.email = 'walde5077@gmail.com';
