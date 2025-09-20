-- Enable RLS on all user data tables that are missing it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_car ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_expenses table
CREATE POLICY "Users can view their own expenses" ON public.user_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.user_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.user_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.user_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for savings_progress table
CREATE POLICY "Users can view their own savings progress" ON public.savings_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings progress" ON public.savings_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings progress" ON public.savings_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings progress" ON public.savings_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings table
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for integration_settings table
CREATE POLICY "Users can view their own integration settings" ON public.integration_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration settings" ON public.integration_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings" ON public.integration_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration settings" ON public.integration_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for proof_cards table
CREATE POLICY "Users can view their own proof cards" ON public.proof_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proof cards" ON public.proof_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proof cards" ON public.proof_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proof cards" ON public.proof_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for favorite_routes table
CREATE POLICY "Users can view their own favorite routes" ON public.favorite_routes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite routes" ON public.favorite_routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite routes" ON public.favorite_routes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite routes" ON public.favorite_routes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for favorite_car table
CREATE POLICY "Users can view their own favorite car" ON public.favorite_car
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite car" ON public.favorite_car
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite car" ON public.favorite_car
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite car" ON public.favorite_car
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for proof_categories table
CREATE POLICY "Users can view their own proof categories" ON public.proof_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proof categories" ON public.proof_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proof categories" ON public.proof_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proof categories" ON public.proof_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Restrict page_views table - allow only authenticated users to insert
CREATE POLICY "Only authenticated users can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admin users to read analytics
CREATE POLICY "Admin can read page views" ON public.page_views
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND email = 'kpkopperstad@gmail.com'
    )
  );