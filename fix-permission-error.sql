-- Fix permission error in increment_daily_usage function
-- The function tries to access auth.users which requires special permissions

CREATE OR REPLACE FUNCTION increment_daily_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_usage INTEGER;
    user_subscription VARCHAR(20);
    user_last_usage_date DATE;
    user_role VARCHAR(20);
BEGIN
    -- Get current usage, subscription type, and role from user_profiles only
    SELECT up.daily_usage, up.subscription_type, up.last_usage_date, up.role
    INTO current_usage, user_subscription, user_last_usage_date, user_role
    FROM user_profiles up
    WHERE up.auth_user_id = user_uuid;
    
    -- If no user found, return -1
    IF current_usage IS NULL THEN
        RETURN -1;
    END IF;
    
    -- Check if user is admin (by role only, no email check to avoid permission issues)
    IF user_role = 'admin' THEN
        -- Admin users have unlimited access, return current usage without incrementing
        RETURN COALESCE(current_usage, 0);
    END IF;
    
    -- If last usage was not today, reset counter
    IF user_last_usage_date < CURRENT_DATE THEN
        current_usage := 0;
        UPDATE user_profiles 
        SET daily_usage = 0, last_usage_date = CURRENT_DATE
        WHERE auth_user_id = user_uuid;
    END IF;
    
    -- Check if user can answer more questions
    IF user_subscription = 'free' AND current_usage >= 5 THEN
        RETURN -1; -- Limit reached
    END IF;
    
    -- Increment usage only for free users
    IF user_subscription = 'free' THEN
        current_usage := current_usage + 1;
        UPDATE user_profiles
        SET daily_usage = current_usage, last_usage_date = CURRENT_DATE
        WHERE auth_user_id = user_uuid;
    END IF;
    
    RETURN current_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the get_daily_usage function to avoid permission issues
CREATE OR REPLACE FUNCTION get_daily_usage(user_uuid UUID)
RETURNS TABLE(usage INTEGER, subscription_type VARCHAR(20), last_usage DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN up.role = 'admin' THEN 0 -- Admin users show 0 usage
            ELSE up.daily_usage 
        END as usage,
        CASE 
            WHEN up.role = 'admin' THEN 'admin'::VARCHAR(20)
            ELSE up.subscription_type 
        END as subscription_type,
        up.last_usage_date
    FROM user_profiles up
    WHERE up.auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
