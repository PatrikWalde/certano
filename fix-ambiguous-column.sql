-- Fix ambiguous column reference in increment_daily_usage function

CREATE OR REPLACE FUNCTION increment_daily_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_usage INTEGER;
    user_subscription VARCHAR(20);
    user_last_usage_date DATE; -- Renamed to avoid ambiguity
BEGIN
    -- Get current usage and subscription type
    SELECT daily_usage, subscription_type, last_usage_date
    INTO current_usage, user_subscription, user_last_usage_date
    FROM user_profiles 
    WHERE auth_user_id = user_uuid;
    
    -- If no user found, return -1
    IF current_usage IS NULL THEN
        RETURN -1;
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
$$ LANGUAGE plpgsql;
