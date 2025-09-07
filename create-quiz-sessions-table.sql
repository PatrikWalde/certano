-- Create quiz_sessions table to store quiz attempts
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('quick_quiz', 'chapter_quiz', 'error_review')),
  chapter_name VARCHAR(100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  accuracy_rate DECIMAL(5,2) NOT NULL,
  total_time_seconds INTEGER NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_answers table to store individual question answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  selected_options JSONB,
  fill_blank_answers JSONB,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- Enable Row Level Security
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_sessions (with IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_sessions' AND policyname = 'Users can view own quiz sessions') THEN
        CREATE POLICY "Users can view own quiz sessions" ON quiz_sessions
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_sessions' AND policyname = 'Users can insert own quiz sessions') THEN
        CREATE POLICY "Users can insert own quiz sessions" ON quiz_sessions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_sessions' AND policyname = 'Users can update own quiz sessions') THEN
        CREATE POLICY "Users can update own quiz sessions" ON quiz_sessions
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for quiz_answers (with IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_answers' AND policyname = 'Users can view own quiz answers') THEN
        CREATE POLICY "Users can view own quiz answers" ON quiz_answers
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM quiz_sessions 
              WHERE quiz_sessions.id = quiz_answers.session_id 
              AND quiz_sessions.user_id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_answers' AND policyname = 'Users can insert own quiz answers') THEN
        CREATE POLICY "Users can insert own quiz answers" ON quiz_answers
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM quiz_sessions 
              WHERE quiz_sessions.id = quiz_answers.session_id 
              AND quiz_sessions.user_id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_answers' AND policyname = 'Users can update own quiz answers') THEN
        CREATE POLICY "Users can update own quiz answers" ON quiz_answers
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM quiz_sessions 
              WHERE quiz_sessions.id = quiz_answers.session_id 
              AND quiz_sessions.user_id = auth.uid()
            )
          );
    END IF;
END $$;
