-- Add a test_user flag to user_settings for giving test users premium access
ALTER TABLE public.user_settings 
ADD COLUMN is_test_user boolean DEFAULT false;

-- Create an admin function to upgrade users to test status
CREATE OR REPLACE FUNCTION public.upgrade_to_test_user(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email from profiles table
  SELECT user_id INTO target_user_id 
  FROM public.profiles 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update their settings to be a test user with premium access
  UPDATE public.user_settings 
  SET 
    is_test_user = true,
    subscription_status = 'premium',
    monthly_route_count = 0
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- Update the check_route_limit function to account for test users
CREATE OR REPLACE FUNCTION public.check_route_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  settings_record RECORD;
  current_month DATE;
BEGIN
  current_month := DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT * INTO settings_record 
  FROM public.user_settings 
  WHERE user_id = user_uuid;
  
  -- Reset count if new month
  IF settings_record.last_route_reset_date < current_month THEN
    UPDATE public.user_settings 
    SET monthly_route_count = 0, last_route_reset_date = current_month
    WHERE user_id = user_uuid;
    settings_record.monthly_route_count := 0;
  END IF;
  
  -- Test users have premium access
  IF settings_record.is_test_user = true THEN
    RETURN TRUE;
  END IF;
  
  -- Check route limits based on subscription
  IF settings_record.subscription_status = 'free' AND settings_record.monthly_route_count >= 5 THEN
    RETURN FALSE;
  ELSIF settings_record.subscription_status = 'premium' AND settings_record.monthly_route_count >= 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Pro has unlimited routes
  RETURN TRUE;
END;
$$;