-- Fix freemium system - run this if the debug shows issues

-- 1. Ensure user_profiles table has the required columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS daily_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_usage_date DATE DEFAULT CURRENT_DATE;

-- 2. Create usage_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(auth_user_id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    questions_answered INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, usage_date)
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);

-- 4. Recreate the increment_daily_usage function
CREATE OR REPLACE FUNCTION increment_daily_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_usage INTEGER;
    user_subscription VARCHAR(20);
    last_usage_date DATE;
BEGIN
    -- Get current usage and subscription type
    SELECT daily_usage, subscription_type, last_usage_date
    INTO current_usage, user_subscription, last_usage_date
    FROM user_profiles 
    WHERE auth_user_id = user_uuid;
    
    -- If no user found, return -1
    IF current_usage IS NULL THEN
        RETURN -1;
    END IF;
    
    -- If last usage was not today, reset counter
    IF last_usage_date < CURRENT_DATE THEN
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

-- 5. Create function to get daily usage
CREATE OR REPLACE FUNCTION get_daily_usage(user_uuid UUID)
RETURNS TABLE(usage INTEGER, subscription_type VARCHAR(20), last_usage DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT up.daily_usage, up.subscription_type, up.last_usage_date
    FROM user_profiles up
    WHERE up.auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. Set all existing users to 'free' subscription if not set
UPDATE user_profiles 
SET subscription_type = 'free' 
WHERE subscription_type IS NULL;

-- 7. Set all existing users to 0 daily usage if not set
UPDATE user_profiles 
SET daily_usage = 0 
WHERE daily_usage IS NULL;

-- 8. Set all existing users to today's date if last_usage_date is not set
UPDATE user_profiles 
SET last_usage_date = CURRENT_DATE 
WHERE last_usage_date IS NULL;
