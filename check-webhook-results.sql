-- Check if webhook successfully updated subscription data
SELECT 
  auth_user_id,
  subscription_type,
  subscription_status,
  subscription_start_date,
  updated_at
FROM user_profiles 
WHERE subscription_type = 'pro'
ORDER BY updated_at DESC;

-- Check recent updates
SELECT 
  auth_user_id,
  subscription_type,
  subscription_status,
  updated_at
FROM user_profiles 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
