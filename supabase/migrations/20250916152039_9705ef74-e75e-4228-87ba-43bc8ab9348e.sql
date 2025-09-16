-- Fix remaining overly permissive RLS policies

-- Update proof_cards to only allow users to view their own cards or anonymous demo cards
DROP POLICY IF EXISTS "Allow public viewing of proof cards" ON public.proof_cards;
CREATE POLICY "Users can view their own proof cards and demo cards" 
ON public.proof_cards 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Add logging table for API usage monitoring
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

-- Only service role can access api logs
CREATE POLICY "Service role can access api logs" 
ON public.api_usage_log 
FOR ALL 
USING (false);