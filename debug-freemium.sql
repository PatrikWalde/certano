-- Debug script to check freemium setup
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if user_profiles table exists and has the right columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if increment_daily_usage function exists
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'increment_daily_usage' 
AND routine_schema = 'public';

-- 3. Check current user profiles (replace with your user ID)
SELECT 
    auth_user_id,
    subscription_type,
    daily_usage,
    last_usage_date,
    created_at
FROM user_profiles 
LIMIT 5;

-- 4. Test the increment function (replace with your user ID)
-- SELECT increment_daily_usage('YOUR_USER_ID_HERE');

-- 5. Check if usage_tracking table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usage_tracking' 
AND table_schema = 'public'
ORDER BY ordinal_position;
