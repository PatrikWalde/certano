-- Simplified SQL Function to update chapter and questions
-- This function handles the foreign key constraint issue by updating everything atomically

CREATE OR REPLACE FUNCTION update_chapter_with_questions(
  chapter_id UUID,
  old_chapter_name TEXT,
  new_chapter_name TEXT,
  new_description TEXT DEFAULT NULL,
  new_color TEXT DEFAULT NULL,
  new_icon TEXT DEFAULT NULL,
  new_is_active BOOLEAN DEFAULT NULL,
  new_topic_id UUID DEFAULT NULL,
  new_order INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Update the chapter itself first
  UPDATE chapters 
  SET 
    name = COALESCE(new_chapter_name, name),
    description = COALESCE(new_description, description),
    color = COALESCE(new_color, color),
    icon = COALESCE(new_icon, icon),
    is_active = COALESCE(new_is_active, is_active),
    topic_id = COALESCE(new_topic_id, topic_id),
    "order" = COALESCE(new_order, "order"),
    updated_at = NOW()
  WHERE id = chapter_id;
  
  -- Step 2: Update all questions that reference the old chapter name
  UPDATE questions 
  SET chapter = new_chapter_name
  WHERE chapter = old_chapter_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_chapter_with_questions TO authenticated;
