-- Create a secure email aliases table for webhook user matching
-- This allows users to link multiple emails to their account securely

CREATE TABLE IF NOT EXISTS user_email_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_email TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_email_aliases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own aliases
CREATE POLICY "Users can view own email aliases" ON user_email_aliases
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can insert their own aliases
CREATE POLICY "Users can insert own email aliases" ON user_email_aliases
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Users can update their own aliases
CREATE POLICY "Users can update own email aliases" ON user_email_aliases
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Users can delete their own aliases
CREATE POLICY "Users can delete own email aliases" ON user_email_aliases
  FOR DELETE USING (auth_user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_alias_email ON user_email_aliases(alias_email);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_auth_user_id ON user_email_aliases(auth_user_id);
