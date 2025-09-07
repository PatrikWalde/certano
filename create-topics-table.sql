-- Create topics table
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

-- Add RLS policies for topics table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read topics
CREATE POLICY "Allow authenticated users to read topics" ON topics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow admin users to insert topics
CREATE POLICY "Allow admin users to insert topics" ON topics
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Allow admin users to update topics
CREATE POLICY "Allow admin users to update topics" ON topics
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Allow admin users to delete topics
CREATE POLICY "Allow admin users to delete topics" ON topics
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);

-- Insert some default topics
INSERT INTO topics (name, description, icon, color, order_index) VALUES
  ('Allgemein', 'Allgemeine Themen und Grundlagen', '📚', '#3b82f6', 0),
  ('Fortgeschritten', 'Fortgeschrittene Themen und Spezialisierungen', '🚀', '#10b981', 1),
  ('Praktisch', 'Praktische Anwendungen und Übungen', '💡', '#f59e0b', 2)
ON CONFLICT (name) DO NOTHING;


