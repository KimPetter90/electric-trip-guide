-- Opprett funksjon for å nullstille rutetelling for en bruker
CREATE OR REPLACE FUNCTION public.reset_route_count(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Nullstill månedlig rutetelling for brukeren
  UPDATE public.user_settings 
  SET 
    monthly_route_count = 0,
    last_route_reset_date = CURRENT_DATE
  WHERE user_id = user_uuid;
  
  -- Returner true hvis oppdateringen var vellykket
  RETURN FOUND;
END;
$$;

-- Opprett admin-funksjon for å nullstille rutetelling basert på e-post
CREATE OR REPLACE FUNCTION public.reset_user_routes_by_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Finn bruker-ID basert på e-post fra profiles-tabellen
  SELECT user_id INTO target_user_id 
  FROM public.profiles 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Nullstill rutetelling
  UPDATE public.user_settings 
  SET 
    monthly_route_count = 0,
    last_route_reset_date = CURRENT_DATE
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;