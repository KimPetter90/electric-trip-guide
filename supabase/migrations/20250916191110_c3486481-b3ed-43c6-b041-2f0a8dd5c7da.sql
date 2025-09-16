-- Create favorite_car table to store user's preferred car
CREATE TABLE public.favorite_car (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  car_id text NOT NULL,
  car_brand text NOT NULL,
  car_model text NOT NULL,
  battery_capacity numeric NOT NULL,
  range_km integer NOT NULL,
  consumption numeric NOT NULL,
  car_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.favorite_car ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite car" 
ON public.favorite_car 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite car" 
ON public.favorite_car 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite car" 
ON public.favorite_car 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite car" 
ON public.favorite_car 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_favorite_car_updated_at
BEFORE UPDATE ON public.favorite_car
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();