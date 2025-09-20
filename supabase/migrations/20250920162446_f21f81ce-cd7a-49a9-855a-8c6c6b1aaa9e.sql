-- Oppdater favorite_car tabellen til å referere til car_models
ALTER TABLE public.favorite_car 
ADD COLUMN car_model_id UUID REFERENCES public.car_models(id);

-- Legg til indeks for bedre ytelse
CREATE INDEX idx_favorite_car_model_id ON public.favorite_car(car_model_id);