-- Add trial-related columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN trial_start_date timestamp with time zone DEFAULT now(),
ADD COLUMN trial_end_date timestamp with time zone DEFAULT (now() + interval '30 days'),
ADD COLUMN is_trial_active boolean DEFAULT true;

-- Update existing users to have trial active for 30 days from now
UPDATE public.user_settings 
SET 
  trial_start_date = now(),
  trial_end_date = now() + interval '30 days',
  is_trial_active = true
WHERE trial_start_date IS NULL;

-- Create function to check if user's trial is still active
CREATE OR REPLACE FUNCTION public.is_trial_active(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record 
  FROM public.user_settings 
  WHERE user_id = user_uuid;
  
  -- If no settings record, return false
  IF settings_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Test users always have premium access
  IF settings_record.is_test_user = true THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active subscription
  IF settings_record.subscription_status = 'premium' OR settings_record.subscription_status = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if trial is still active
  IF settings_record.is_trial_active = true AND settings_record.trial_end_date > now() THEN
    RETURN TRUE;
  END IF;
  
  -- If trial has expired, mark it as inactive
  IF settings_record.trial_end_date <= now() AND settings_record.is_trial_active = true THEN
    UPDATE public.user_settings 
    SET is_trial_active = false 
    WHERE user_id = user_uuid;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update the existing check_route_limit function to include trial logic
CREATE OR REPLACE FUNCTION public.check_route_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Users with active subscriptions have unlimited routes
  IF settings_record.subscription_status = 'premium' OR settings_record.subscription_status = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Users with active trial have unlimited routes
  IF settings_record.is_trial_active = true AND settings_record.trial_end_date > now() THEN
    RETURN TRUE;
  END IF;
  
  -- Free users (including expired trial) are limited to 25 routes
  IF settings_record.monthly_route_count >= 25 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to check if user has premium features access
CREATE OR REPLACE FUNCTION public.has_premium_access(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record 
  FROM public.user_settings 
  WHERE user_id = user_uuid;
  
  -- Test users have premium access
  IF settings_record.is_test_user = true THEN
    RETURN TRUE;
  END IF;
  
  -- Users with active subscriptions have premium access
  IF settings_record.subscription_status = 'premium' OR settings_record.subscription_status = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Users with active trial have premium access
  IF settings_record.is_trial_active = true AND settings_record.trial_end_date > now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;