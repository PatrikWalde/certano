-- Komplettes Datenbank-Setup für Certano Quiz-System
-- Führen Sie dieses Skript im Supabase SQL Editor aus

-- 1. Erstelle user_stats Tabelle
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  weekly_goal INTEGER DEFAULT 50,
  weekly_progress INTEGER DEFAULT 0,
  last_quiz_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Erstelle quiz_sessions Tabelle
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

-- 3. Erstelle quiz_answers Tabelle
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

-- 4. Erstelle chapter_stats Tabelle
CREATE TABLE IF NOT EXISTS chapter_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  chapter VARCHAR(100) NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  average_time INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter)
);

-- 5. Erstelle Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(current_level);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_chapter_stats_user_id ON chapter_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_stats_chapter ON chapter_stats(chapter);

-- 6. Aktiviere Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_stats ENABLE ROW LEVEL SECURITY;

-- 6. Erstelle RLS Policies für user_stats (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view own stats') THEN
        CREATE POLICY "Users can view own stats" ON user_stats
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can insert own stats') THEN
        CREATE POLICY "Users can insert own stats" ON user_stats
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update own stats') THEN
        CREATE POLICY "Users can update own stats" ON user_stats
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Erstelle RLS Policies für quiz_sessions (idempotent)
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

-- 8. Erstelle RLS Policies für quiz_answers (idempotent)
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

-- 9. Erstelle RLS Policies für chapter_stats (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chapter_stats' AND policyname = 'Users can view own chapter stats') THEN
        CREATE POLICY "Users can view own chapter stats" ON chapter_stats
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chapter_stats' AND policyname = 'Users can insert own chapter stats') THEN
        CREATE POLICY "Users can insert own chapter stats" ON chapter_stats
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chapter_stats' AND policyname = 'Users can update own chapter stats') THEN
        CREATE POLICY "Users can update own chapter stats" ON chapter_stats
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 10. Bestätigung
SELECT 'Datenbank-Setup erfolgreich abgeschlossen!' as status;
