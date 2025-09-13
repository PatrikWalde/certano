-- Debug subscription status for your user

SELECT 
    u.email,
    up.first_name,
    up.last_name,
    up.subscription_type,
    up.subscription_status,
    up.subscription_start_date,
    up.stripe_subscription_id,
    up.created_at,
    up.updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.auth_user_id
WHERE u.email = 'walde5077@gmail.com';

