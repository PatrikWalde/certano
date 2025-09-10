-- 🔒 ALLE verbleibenden Security-Warnungen beheben
-- Behebt alle Function Search Path Probleme
-- Setzt search_path auf sichere Werte für alle Functions

-- 1. ALLE Functions mit search_path reparieren
-- handle_user_update
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
    city = COALESCE(NEW.raw_user_meta_data->>'city', city),
    updated_at = NOW()
  WHERE auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (
    auth_user_id,
    first_name,
    last_name,
    city,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- update_chapter_with_questions - KOMPLETT neu erstellen
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_chapter_with_questions(UUID);

CREATE FUNCTION public.update_chapter_with_questions(
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
SET search_path = public
AS $$
DECLARE
  old_chapter_name TEXT;
BEGIN
  SELECT name INTO old_chapter_name 
  FROM chapters 
  WHERE id = chapter_id;
  
  UPDATE chapters 
  SET 
    name = COALESCE(chapter_name, name),
    description = COALESCE(chapter_description, description),
    color = COALESCE(chapter_color, color),
    icon = COALESCE(chapter_icon, icon),
    is_active = COALESCE(chapter_is_active, is_active),
    updated_at = NOW()
  WHERE id = chapter_id;
  
  IF old_chapter_name IS NOT NULL AND chapter_name IS NOT NULL THEN
    UPDATE questions 
    SET chapter = chapter_name
    WHERE chapter = old_chapter_name;
  END IF;
END;
$$;

-- 2. Überprüfung
SELECT 'ALLE Functions mit search_path repariert' as status;
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname IN ('handle_user_update', 'handle_new_user', 'update_chapter_with_questions')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
