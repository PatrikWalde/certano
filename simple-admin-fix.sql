-- Simple fix to ensure admin users are not limited by freemium

-- First, let's check what role your admin user has
SELECT 
    up.auth_user_id,
    up.role,
    up.subscription_type,
    up.daily_usage,
    au.email
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.auth_user_id
WHERE au.email = 'pw@patrikwalde.com' OR up.role = 'admin';

-- Update your admin user to have admin role and pro subscription
UPDATE user_profiles 
SET 
    role = 'admin',
    subscription_type = 'admin'
WHERE auth_user_id IN (
    SELECT id FROM auth.users WHERE email = 'pw@patrikwalde.com'
);

-- Also update any user with admin role
UPDATE user_profiles 
SET subscription_type = 'admin'
WHERE role = 'admin';

-- Verify the update
SELECT 
    up.auth_user_id,
    up.role,
    up.subscription_type,
    up.daily_usage,
    au.email
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.auth_user_id
WHERE au.email = 'pw@patrikwalde.com' OR up.role = 'admin';
