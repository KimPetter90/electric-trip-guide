-- Create function to get daily analytics
CREATE OR REPLACE FUNCTION public.get_daily_analytics(days_back integer)
RETURNS TABLE (
  date text,
  total_pageviews bigint,
  unique_sessions bigint,
  logged_in_users bigint,
  total_sessions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pv.created_at)::text as date,
    COUNT(*)::bigint as total_pageviews,
    COUNT(DISTINCT pv.session_id)::bigint as unique_sessions,
    COUNT(DISTINCT pv.user_id) FILTER (WHERE pv.user_id IS NOT NULL)::bigint as logged_in_users,
    COUNT(DISTINCT pv.session_id)::bigint as total_sessions
  FROM page_views pv
  WHERE pv.created_at >= (CURRENT_DATE - days_back)
  GROUP BY DATE(pv.created_at)
  ORDER BY DATE(pv.created_at) DESC;
END;
$$;