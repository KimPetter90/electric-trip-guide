-- Add logging table for API usage monitoring only
CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  client_ip text,
  user_agent text,
  response_status integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on api_usage_log
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;