-- Oppdater rutegrensen for gratis-brukere fra 5 til 25 ruter per måned
-- Dette gjøres i check_route_limit funksjonen

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
  
  -- Check route limits based on subscription - økt gratis-grense til 25
  IF settings_record.subscription_status = 'free' AND settings_record.monthly_route_count >= 25 THEN
    RETURN FALSE;
  ELSIF settings_record.subscription_status = 'premium' AND settings_record.monthly_route_count >= 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Pro has unlimited routes
  RETURN TRUE;
END;
$function$;