-- Clean creation of users table - removes everything first
-- This will work without any conflicts

-- Drop everything related to users table
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;

-- Create users table with UNIQUE constraint
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  evu TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_role ON public.users(role);

-- Don't enable RLS for now - this will allow all operations
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Insert current user
INSERT INTO public.users (auth_user_id, first_name, last_name, city, evu, role)
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


