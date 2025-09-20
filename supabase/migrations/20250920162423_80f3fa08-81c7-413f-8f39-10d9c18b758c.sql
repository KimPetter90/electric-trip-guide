-- Opprett bil-modeller tabell med omfattende bildata
CREATE TABLE public.car_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id TEXT UNIQUE NOT NULL, -- unikt ID som 'tesla-model-3'
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT, -- 'Long Range', 'Performance', etc.
  year INTEGER DEFAULT 2024,
  
  -- Tekniske spesifikasjoner  
  battery_capacity_kwh NUMERIC NOT NULL,
  range_km INTEGER NOT NULL,
  consumption_kwh_per_100km NUMERIC NOT NULL,
  max_charging_speed_kw INTEGER DEFAULT 150,
  acceleration_0_100_kmh NUMERIC, -- sekunder
  top_speed_kmh INTEGER,
  
  -- Praktisk informasjon
  seats INTEGER DEFAULT 5,
  trunk_space_liters INTEGER,
  weight_kg INTEGER,
  length_mm INTEGER,
  width_mm INTEGER,
  height_mm INTEGER,
  
  -- Pris og tilgjengelighet
  starting_price_nok INTEGER,
  available_in_norway BOOLEAN DEFAULT true,
  
  -- Visuelle elementer
  image_emoji TEXT DEFAULT '🚗',
  brand_logo_url TEXT,
  car_image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (alle kan se bilmodeller)
CREATE POLICY "Anyone can view active car models" 
ON public.car_models 
FOR SELECT 
USING (is_active = true);

-- Policy for admin updates (bare admin kan oppdatere)
CREATE POLICY "Admin can manage car models" 
ON public.car_models 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Indekser for bedre ytelse
CREATE INDEX idx_car_models_brand ON public.car_models(brand);
CREATE INDEX idx_car_models_car_id ON public.car_models(car_id);
CREATE INDEX idx_car_models_available ON public.car_models(available_in_norway);

-- Trigger for automatisk oppdatering av updated_at
CREATE TRIGGER update_car_models_updated_at
  BEFORE UPDATE ON public.car_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();