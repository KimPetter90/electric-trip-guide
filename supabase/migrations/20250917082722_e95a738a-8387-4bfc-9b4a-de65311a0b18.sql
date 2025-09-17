-- Opprett tabell for favoritt-ruter
CREATE TABLE public.favorite_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  distance TEXT,
  duration TEXT,
  estimated_cost TEXT,
  battery_usage TEXT,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own favorite routes"
ON public.favorite_routes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorite routes"
ON public.favorite_routes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite routes"
ON public.favorite_routes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite routes"
ON public.favorite_routes
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_favorite_routes_updated_at
BEFORE UPDATE ON public.favorite_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();