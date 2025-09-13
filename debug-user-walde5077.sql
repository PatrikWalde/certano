-- Debug user walde5077@gmail.com
-- Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'walde5077@gmail.com';

-- Check user profile
SELECT 
  auth_user_id,
  first_name,
  last_name,
  subscription_type,
  subscription_status,
  stripe_customer_id
FROM user_profiles 
WHERE auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'walde5077@gmail.com'
);

-- Check if there are any users with similar email
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email LIKE '%walde5077%' OR email LIKE '%patrik%';
