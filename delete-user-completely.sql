-- Completely delete user walde5077@gmail.com from ALL tables
-- This will handle the case where user_profiles still exists

-- Delete from user_profiles first (this might be the only remaining record)
DELETE FROM user_profiles 
WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email = 'walde5077@gmail.com'
);

-- Also delete any orphaned records in user_profiles (in case auth.users was already deleted)
DELETE FROM user_profiles 
WHERE auth_user_id = 'e48bb111-60b9-4233-bb89-c185f73dc742';

-- Delete from all other tables
DELETE FROM chapter_stats WHERE user_id = 'e48bb111-60b9-4233-bb89-c185f73dc742';
DELETE FROM quiz_attempts WHERE user_id = 'e48bb111-60b9-4233-bb89-c185f73dc742';
DELETE FROM user_stats WHERE user_id = 'e48bb111-60b9-4233-bb89-c185f73dc742';

-- Finally delete from auth.users
DELETE FROM auth.users WHERE email = 'walde5077@gmail.com';

-- Show result
SELECT 'User walde5077@gmail.com completely deleted' as result;
