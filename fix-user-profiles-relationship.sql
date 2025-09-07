-- Fix the foreign key relationship for user_profiles table
-- This will make the relationship work properly with Supabase

-- First, let's check if the table exists and drop it if needed
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table with proper foreign key
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  evu TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the foreign key constraint explicitly
ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_auth_user_id 
FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- Don't enable RLS for now - this will allow all operations
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Insert current user
INSERT INTO public.user_profiles (auth_user_id, first_name, last_name, city, evu, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'first_name', 'Patrik'),
  COALESCE(raw_user_meta_data->>'last_name', 'Walde'),
  COALESCE(raw_user_meta_data->>'city', 'München'),
  COALESCE(raw_user_meta_data->>'evu', ''),
  'admin'
FROM auth.users 
WHERE email = 'pw@patrikwalde.com'
ON CONFLICT (auth_user_id) DO NOTHING;


