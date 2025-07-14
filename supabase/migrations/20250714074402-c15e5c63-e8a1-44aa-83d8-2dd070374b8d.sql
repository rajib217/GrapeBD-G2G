-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.member_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE public.gift_status AS ENUM ('pending', 'approved', 'sent', 'received', 'cancelled');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  courier_address TEXT,
  profile_image TEXT,
  role app_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'active',
  status_icon TEXT, -- For admin assigned status icons
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grape varieties table
CREATE TABLE public.varieties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user stocks table
CREATE TABLE public.user_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variety_id UUID NOT NULL REFERENCES public.varieties(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, variety_id)
);

-- Create gift rounds table
CREATE TABLE public.gift_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gifts table
CREATE TABLE public.gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_round_id UUID NOT NULL REFERENCES public.gift_rounds(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  variety_id UUID NOT NULL REFERENCES public.varieties(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  status gift_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Everyone can view active profiles" ON public.profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for varieties
CREATE POLICY "Everyone can view active varieties" ON public.varieties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage varieties" ON public.varieties
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for user_stocks
CREATE POLICY "Users can view all stocks" ON public.user_stocks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own stocks" ON public.user_stocks
  FOR ALL USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all stocks" ON public.user_stocks
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for gift_rounds
CREATE POLICY "Everyone can view active gift rounds" ON public.gift_rounds
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage gift rounds" ON public.gift_rounds
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for gifts
CREATE POLICY "Users can view gifts they are involved in" ON public.gifts
  FOR SELECT USING (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    receiver_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create gifts" ON public.gifts
  FOR INSERT WITH CHECK (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all gifts" ON public.gifts
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for notices
CREATE POLICY "Everyone can view active notices" ON public.notices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notices" ON public.notices
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    receiver_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (
    receiver_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_varieties_updated_at
  BEFORE UPDATE ON public.varieties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stocks_updated_at
  BEFORE UPDATE ON public.user_stocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_rounds_updated_at
  BEFORE UPDATE ON public.gift_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();