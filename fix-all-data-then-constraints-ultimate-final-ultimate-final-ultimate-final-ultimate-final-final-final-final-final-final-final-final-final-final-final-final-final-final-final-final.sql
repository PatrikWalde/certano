-- 🔧 ALLE Daten zuerst korrigieren, dann Constraints hinzufügen
-- Problem: Bestehende Daten verletzen neue Constraints
-- Lösung: Zuerst alle bestehenden Daten korrigieren, dann Constraints hinzufügen
-- Verhindert Constraint-Verletzungen durch alte Daten
-- Frage-Erstellung sollte jetzt DEFINITIV funktionieren
-- Datenkorrektur vor Constraint-Erstellung

-- 1. ZUERST: Alle bestehenden Daten korrigieren
-- Korrigiere type Werte (multiple-choice -> multiple_choice)
UPDATE questions 
SET type = 'multiple_choice' 
WHERE type = 'multiple-choice';

-- Korrigiere difficulty Werte (intermediate -> medium)
UPDATE questions 
SET difficulty = 'medium' 
WHERE difficulty = 'intermediate' OR difficulty IS NULL;

-- 2. DANN: Alle Constraints entfernen
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_chapter_fkey;

-- 3. DANN: Neue Constraints hinzufügen
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
CHECK (type IN ('multiple_choice', 'single_choice', 'true_false', 'fill_blank'));

ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 4. DANN: Foreign Key wieder hinzufügen
ALTER TABLE questions ADD CONSTRAINT questions_chapter_fkey 
FOREIGN KEY (chapter) REFERENCES chapters(name) ON DELETE CASCADE;

-- 5. DANN: Permissions setzen
GRANT ALL ON questions TO authenticated;
GRANT ALL ON questions TO service_role;

-- 6. DANN: RLS aktivieren
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 7. DANN: RLS Policies
DROP POLICY IF EXISTS "Users can view questions" ON questions;
DROP POLICY IF EXISTS "Users can insert questions" ON questions;
DROP POLICY IF EXISTS "Users can update questions" ON questions;
DROP POLICY IF EXISTS "Users can delete questions" ON questions;

CREATE POLICY "Users can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Users can insert questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update questions" ON questions FOR UPDATE USING (true);
CREATE POLICY "Users can delete questions" ON questions FOR DELETE USING (true);

-- 8. DANN: Indexes
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- 9. DANN: Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. DANN: Finale Überprüfung
SELECT 'Datenkorrektur abgeschlossen' as status;
SELECT COUNT(*) as total_questions FROM questions;
SELECT type, COUNT(*) as count FROM questions GROUP BY type;
SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty;
