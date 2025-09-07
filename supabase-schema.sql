-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📚',
  color VARCHAR(7) DEFAULT '#3b82f6',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(10) DEFAULT '📚',
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  tags TEXT[],
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_number VARCHAR(50) UNIQUE,
  prompt TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('multiple-choice', 'true-false', 'open-ended', 'matching', 'image', 'fill-blank')),
  chapter VARCHAR(100) NOT NULL REFERENCES chapters(name),
  options JSONB,
  matching_pairs JSONB,
  fill_blank_options JSONB,
  blank_count INTEGER DEFAULT 1,
  explanation TEXT,
  media JSONB,
  is_open_question BOOLEAN DEFAULT false,
  tags TEXT[],
  author_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"totalAttempts": 0, "correctAnswers": 0, "averageTime": 0}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS question_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  chapter VARCHAR(100) NOT NULL,
  error_count INTEGER DEFAULT 0,
  last_error_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_correct_date TIMESTAMP WITH TIME ZONE,
  total_attempts INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

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

CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quest_id VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'achievement')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('questions', 'streak', 'accuracy', 'chapters', 'xp')),
  target INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  reward_xp INTEGER NOT NULL,
  reward_badge VARCHAR(50),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_repeatable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  badge_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('level', 'streak', 'accuracy', 'chapters', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER,
  max_progress INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters("order");
CREATE INDEX IF NOT EXISTS idx_chapters_active ON chapters(is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_topic ON chapters(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_stats_user_chapter ON chapter_stats(user_id, chapter);
CREATE INDEX IF NOT EXISTS idx_question_errors_user_question ON question_errors(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_type ON quests(user_id, type);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Topics policies
CREATE POLICY "Topics are viewable by everyone" ON topics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Topics are insertable by authenticated users with editor role" ON topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Topics are updatable by authenticated users with editor role" ON topics
  FOR UPDATE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Topics are deletable by authenticated users with editor role" ON topics
  FOR DELETE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

-- Chapters policies
CREATE POLICY "Chapters are viewable by everyone" ON chapters
  FOR SELECT USING (is_active = true);

CREATE POLICY "Chapters are insertable by authenticated users with editor role" ON chapters
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Chapters are updatable by authenticated users with editor role" ON chapters
  FOR UPDATE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Chapters are deletable by authenticated users with editor role" ON chapters
  FOR DELETE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

-- Questions policies
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Questions are insertable by authenticated users with editor role" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Questions are updatable by authenticated users with editor role" ON questions
  FOR UPDATE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

CREATE POLICY "Questions are deletable by authenticated users with editor role" ON questions
  FOR DELETE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('editor', 'admin')));

-- User stats policies
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Chapter stats policies
CREATE POLICY "Users can view own chapter stats" ON chapter_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chapter stats" ON chapter_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chapter stats" ON chapter_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Question errors policies
CREATE POLICY "Users can view own question errors" ON question_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question errors" ON question_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question errors" ON question_errors
  FOR UPDATE USING (auth.uid() = user_id);

-- Quiz attempts policies
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quests policies
CREATE POLICY "Users can view own quests" ON quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests" ON quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests" ON quests
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Users can view own badges" ON badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON badges
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_chapter_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update chapter stats when questions are answered
  INSERT INTO chapter_stats (user_id, chapter, total_questions, correct_answers, progress, last_practiced, average_time, attempts)
  VALUES (NEW.user_id, NEW.chapter, 1, 
          CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
          CASE WHEN NEW.is_correct THEN 100 ELSE 0 END,
          NOW(), NEW.time_spent, 1)
  ON CONFLICT (user_id, chapter)
  DO UPDATE SET
    total_questions = chapter_stats.total_questions + 1,
    correct_answers = chapter_stats.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    progress = ROUND((chapter_stats.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL / (chapter_stats.total_questions + 1) * 100),
    last_practiced = NOW(),
    average_time = ROUND((chapter_stats.average_time * chapter_stats.attempts + NEW.time_spent)::DECIMAL / (chapter_stats.attempts + 1)),
    attempts = chapter_stats.attempts + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_chapter_stats
  AFTER INSERT ON question_errors
  FOR EACH ROW
  EXECUTE FUNCTION update_chapter_stats();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create storage policies
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
