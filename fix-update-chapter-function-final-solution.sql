-- 🔒 update_chapter_with_questions Function FINALE LÖSUNG
-- Behebt die "role mutable search_path" Warnung
-- Verwendet den korrekten Ansatz: SET search_path = '' (leer) für Security

-- 1. ALLE Versionen der Function löschen
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID);

-- 2. Function mit korrektem search_path erstellen
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_chapter_name TEXT;
BEGIN
  -- Get old chapter name
  SELECT public.chapters.name INTO old_chapter_name 
  FROM public.chapters 
  WHERE public.chapters.id = chapter_id;
  
  -- Update chapter
  UPDATE public.chapters 
  SET 
    name = COALESCE(chapter_name, public.chapters.name),
    description = COALESCE(chapter_description, public.chapters.description),
    color = COALESCE(chapter_color, public.chapters.color),
    icon = COALESCE(chapter_icon, public.chapters.icon),
    is_active = COALESCE(chapter_is_active, public.chapters.is_active),
    updated_at = NOW()
  WHERE public.chapters.id = chapter_id;
  
  -- Update questions that reference the old chapter name
  IF old_chapter_name IS NOT NULL AND chapter_name IS NOT NULL THEN
    UPDATE public.questions 
    SET chapter = chapter_name
    WHERE public.questions.chapter = old_chapter_name;
  END IF;
END;
$$;

-- 3. Überprüfung
SELECT 'update_chapter_with_questions Function FINALE LÖSUNG abgeschlossen' as status;
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname = 'update_chapter_with_questions'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
