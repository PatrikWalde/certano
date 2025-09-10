-- 🔒 Function Search Path Security beheben
-- Behebt Security-Warnungen für Functions mit mutable search_path
-- Setzt search_path auf sichere Werte

-- 1. handle_user_update Function reparieren
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user profile when auth user is updated
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

-- 2. update_chapter_with_questions Function reparieren
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
SET search_path = public
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

-- 3. handle_new_user Function reparieren
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

-- 4. Überprüfung
SELECT 'Function Search Path Security aktiviert' as status;
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname IN ('handle_user_update', 'update_chapter_with_questions', 'handle_new_user')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
