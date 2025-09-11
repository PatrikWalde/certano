-- Manually set Pro status for testing

UPDATE user_profiles 
SET 
    subscription_type = 'pro',
    subscription_status = 'active',
    subscription_start_date = NOW(),
    updated_at = NOW()
WHERE auth_user_id = (
    SELECT id FROM auth.users WHERE email = 'walde5077@gmail.com'
);

-- Check if it worked
SELECT 
    u.email,
    up.subscription_type,
    up.subscription_status,
    up.updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.auth_user_id
WHERE u.email = 'walde5077@gmail.com';

