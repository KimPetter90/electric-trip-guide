-- Fix function search path security warning
-- Update existing functions to have immutable search_path

CREATE OR REPLACE FUNCTION public.setup_new_proof_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default categories
  INSERT INTO public.proof_categories (user_id, name, color, icon, is_default) VALUES
  (NEW.id, 'Arbeid', '#3b82f6', 'briefcase', true),
  (NEW.id, 'Medisin', '#ef4444', 'pill', true),
  (NEW.id, 'Trening', '#10b981', 'dumbbell', true),
  (NEW.id, 'Personlig', '#8b5cf6', 'user', true);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in setup_new_proof_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_route_count(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_settings 
  SET monthly_route_count = monthly_route_count + 1
  WHERE user_id = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upgrade_to_test_user(target_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_route_limit(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the edge function to send registration email
  PERFORM net.http_post(
    url := 'https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/send-registration-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5NDQwOCwiZXhwIjoyMDczMzcwNDA4fQ.3E3kP5Yr-2m8_Dg9oKfwhGP9dEsHZJpOSGgzLQo8-Yg"}'::jsonb,
    body := json_build_object(
      'userEmail', NEW.email,
      'userName', NEW.full_name
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_monthly_limit(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  current_month DATE;
BEGIN
  current_month := DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT * INTO settings_record 
  FROM public.user_settings 
  WHERE user_id = user_uuid;
  
  -- Reset count if new month
  IF settings_record.last_reset_date < current_month THEN
    UPDATE public.user_settings 
    SET monthly_proof_count = 0, last_reset_date = current_month
    WHERE user_id = user_uuid;
    settings_record.monthly_proof_count := 0;
  END IF;
  
  -- Check limits
  IF settings_record.plan_type = 'free' AND settings_record.monthly_proof_count >= 30 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;