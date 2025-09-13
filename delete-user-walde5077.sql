-- Delete user walde5077@gmail.com from all tables
-- Must delete in correct order due to foreign key constraints

-- Get the user ID first
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'walde5077@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Delete from all dependent tables first
        DELETE FROM chapter_stats WHERE user_id = user_uuid;
        DELETE FROM quiz_attempts WHERE user_id = user_uuid;
        DELETE FROM user_stats WHERE user_id = user_uuid;
        DELETE FROM user_profiles WHERE auth_user_id = user_uuid;
        
        -- Finally delete from auth.users
        DELETE FROM auth.users WHERE id = user_uuid;
        
        RAISE NOTICE 'User walde5077@gmail.com deleted successfully';
    ELSE
        RAISE NOTICE 'User walde5077@gmail.com not found';
    END IF;
END $$;
