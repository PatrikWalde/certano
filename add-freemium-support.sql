-- Add freemium support to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS daily_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_usage_date DATE DEFAULT CURRENT_DATE;

-- Create usage_tracking table for detailed tracking
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);

-- Function to reset daily usage (called daily)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    -- Reset daily usage for all users where last_usage_date is not today
    UPDATE user_profiles 
    SET daily_usage = 0, last_usage_date = CURRENT_DATE
    WHERE last_usage_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_daily_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_usage INTEGER;
    user_subscription VARCHAR(20);
BEGIN
    -- Get current usage and subscription type
    SELECT daily_usage, subscription_type, last_usage_date
    INTO current_usage, user_subscription, last_usage_date
    FROM user_profiles 
    WHERE auth_user_id = user_uuid;
    
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
    
    -- Increment usage
    current_usage := current_usage + 1;
    UPDATE user_profiles 
    SET daily_usage = current_usage
    WHERE auth_user_id = user_uuid;
    
    -- Update usage_tracking table
    INSERT INTO usage_tracking (user_id, usage_date, questions_answered)
    VALUES (user_uuid, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        questions_answered = usage_tracking.questions_answered + 1,
        updated_at = NOW();
    
    RETURN current_usage;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);
