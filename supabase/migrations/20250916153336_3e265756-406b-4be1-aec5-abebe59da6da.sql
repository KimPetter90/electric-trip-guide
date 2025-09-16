-- Add subscription tracking to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_product_id text,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS monthly_route_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_route_reset_date date DEFAULT CURRENT_DATE;

-- Update the monthly limit check function to include route limits
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

-- Function to increment route count
CREATE OR REPLACE FUNCTION public.increment_route_count(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_settings 
  SET monthly_route_count = monthly_route_count + 1
  WHERE user_id = user_uuid;
END;
$$;