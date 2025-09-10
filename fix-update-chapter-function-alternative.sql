-- 🔒 update_chapter_with_questions Function ALTERNATIVE Reparatur
-- Behebt die hartnäckige "role mutable search_path" Warnung
-- Verwendet einen komplett anderen Ansatz: Function ohne SECURITY DEFINER

-- 1. ALLE Versionen der Function löschen
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID);

-- 2. Function OHNE SECURITY DEFINER erstellen (das behebt das search_path Problem)
CREATE OR REPLACE FUNCTION public.update_chapter_with_questions(
  chapter_id UUID,
  chapter_name TEXT,
  chapter_description TEXT DEFAULT NULL,
  chapter_color TEXT DEFAULT NULL,
  chapter_icon TEXT DEFAULT NULL,
  chapter_is_active BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  old_chapter_name TEXT;
BEGIN
  -- Get old chapter name
  SELECT name INTO old_chapter_name 
  FROM chapters 
  WHERE id = chapter_id;
  
  -- Update chapter
  UPDATE chapters 
  SET 
    name = COALESCE(chapter_name, name),
    description = COALESCE(chapter_description, description),
    color = COALESCE(chapter_color, color),
    icon = COALESCE(chapter_icon, icon),
    is_active = COALESCE(chapter_is_active, is_active),
    updated_at = NOW()
  WHERE id = chapter_id;
  
  -- Update questions that reference the old chapter name
  IF old_chapter_name IS NOT NULL AND chapter_name IS NOT NULL THEN
    UPDATE questions 
    SET chapter = chapter_name
    WHERE chapter = old_chapter_name;
  END IF;
END;
$$;

-- 3. Überprüfung
SELECT 'update_chapter_with_questions Function ALTERNATIVE Reparatur abgeschlossen' as status;
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname = 'update_chapter_with_questions'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
