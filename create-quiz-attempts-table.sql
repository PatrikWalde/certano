-- Create quiz_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  questions_answered INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  accuracy_rate INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  chapters TEXT[],
  time_spent INTEGER NOT NULL,
  questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own quiz attempts
CREATE POLICY IF NOT EXISTS "Users can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own quiz attempts
CREATE POLICY IF NOT EXISTS "Users can insert their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own quiz attempts
CREATE POLICY IF NOT EXISTS "Users can update their own quiz attempts" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own quiz attempts
CREATE POLICY IF NOT EXISTS "Users can delete their own quiz attempts" ON quiz_attempts
  FOR DELETE USING (auth.uid() = user_id);
