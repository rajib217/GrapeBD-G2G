-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view active profiles"
ON public.profiles FOR SELECT
USING (
    status = 'active' OR 
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access"
ON public.profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Reset RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;