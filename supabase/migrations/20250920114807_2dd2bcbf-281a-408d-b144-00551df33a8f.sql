-- Fix remaining RLS policies that are missing

-- Update page_views policy to restrict insert to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Only authenticated users can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update page_views admin policy to use profiles table instead of auth.users
DROP POLICY IF EXISTS "Admin can view all page views" ON public.page_views;
CREATE POLICY "Admin can read page views" ON public.page_views
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND email = 'kpkopperstad@gmail.com'
    )
  );