-- Check if user profile data is saved correctly for walde5077@gmail.com

SELECT 
    u.email,
    up.first_name,
    up.last_name,
    up.city,
    up.evu,
    up.role,
    up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.auth_user_id
WHERE u.email = 'walde5077@gmail.com';
