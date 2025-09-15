-- Create table for charging stations in Norway
CREATE TABLE public.charging_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  available INTEGER NOT NULL DEFAULT 4,
  total INTEGER NOT NULL DEFAULT 6,
  fast_charger BOOLEAN NOT NULL DEFAULT true,
  power TEXT NOT NULL DEFAULT '150 kW',
  cost NUMERIC NOT NULL DEFAULT 4.50,
  provider TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.charging_stations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no authentication needed)
CREATE POLICY "Anyone can view charging stations" 
ON public.charging_stations 
FOR SELECT 
USING (true);

-- Insert comprehensive charging stations across Norway
INSERT INTO public.charging_stations (name, location, latitude, longitude, available, total, fast_charger, power, cost, provider, address) VALUES

-- Oslo og Akershus
('Tesla Supercharger Oslo Skøyen', 'Oslo', 59.9267, 10.6789, 16, 20, true, '250 kW', 4.50, 'Tesla', 'Karenslyst Allé 53, 0279 Oslo'),
('Fortum Charge & Drive Oslo City', 'Oslo', 59.9139, 10.7522, 12, 16, true, '300 kW', 5.50, 'Fortum', 'Stenersgata 1, 0050 Oslo'),
('Circle K Oslo Vest', 'Oslo', 59.9500, 10.6000, 8, 10, true, '150 kW', 5.20, 'Circle K', 'Lysaker Brygge 25, 1366 Lysaker'),
('Mer Oslo Colosseum', 'Oslo', 59.9289, 10.7958, 15, 18, true, '175 kW', 4.90, 'Mer', 'Fridtjof Nansens Plass 6, 0160 Oslo'),
('Eviny Oslo Sentrum', 'Oslo', 59.9100, 10.7400, 10, 14, true, '200 kW', 4.80, 'Eviny', 'Karl Johans gate 20, 0159 Oslo'),

-- Drammen og Buskerud  
('Tesla Supercharger Drammen', 'Drammen', 59.7436, 10.2045, 10, 14, true, '250 kW', 4.50, 'Tesla', 'Grønland 58, 3045 Drammen'),
('Fortum Drammen Storsenter', 'Drammen', 59.7500, 10.1800, 8, 12, true, '150 kW', 5.00, 'Fortum', 'Liertoppen 2, 3054 Drammen'),
('Circle K Mjøndalen', 'Mjøndalen', 59.7667, 9.9667, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Storgata 15, 3050 Mjøndalen'),
('Mer Kongsberg', 'Kongsberg', 59.6686, 9.6511, 8, 12, true, '175 kW', 4.90, 'Mer', 'Storgata 18, 3611 Kongsberg'),
('Tesla Supercharger Gol', 'Gol', 60.6833, 9.0000, 10, 16, true, '250 kW', 4.50, 'Tesla', 'Centervegen 44, 3550 Gol'),
('Eviny Hemsedal', 'Hemsedal', 60.8558, 8.5556, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Sentervegen 148, 3560 Hemsedal'),
('Circle K Nesbyen', 'Nesbyen', 60.5694, 9.1111, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Storgata 44, 3540 Nesbyen'),
('Fortum Hønefoss', 'Hønefoss', 60.1681, 10.2594, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Osloveien 1, 3511 Hønefoss'),

-- Telemark
('Tesla Supercharger Porsgrunn', 'Porsgrunn', 59.1397, 9.6561, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Storgata 113, 3915 Porsgrunn'),
('Fortum Skien', 'Skien', 59.2085, 9.6090, 7, 10, true, '150 kW', 5.00, 'Fortum', 'Lundegata 1, 3724 Skien'),
('Circle K Notodden', 'Notodden', 59.5661, 9.2589, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Heddalsveien 2, 3674 Notodden'),
('Mer Rjukan', 'Rjukan', 59.8781, 8.5933, 4, 6, true, '175 kW', 4.90, 'Mer', 'Torget 4, 3660 Rjukan'),

-- Vestfold
('Tesla Supercharger Tønsberg', 'Tønsberg', 59.2674, 10.4078, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Storgata 17, 3111 Tønsberg'),
('Fortum Sandefjord', 'Sandefjord', 59.1289, 10.2280, 10, 14, true, '175 kW', 5.00, 'Fortum', 'Torggata 9, 3211 Sandefjord'),
('Circle K Holmestrand', 'Holmestrand', 59.4897, 10.3119, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Storgata 8, 3080 Holmestrand'),

-- Agder (Aust- og Vest-Agder)
('Tesla Supercharger Kristiansand', 'Kristiansand', 58.1461, 7.9956, 20, 24, true, '250 kW', 4.50, 'Tesla', 'Markens gate 18, 4611 Kristiansand'),
('Eviny Kristiansand Senter', 'Kristiansand', 58.1599, 8.0182, 15, 20, true, '300 kW', 4.80, 'Eviny', 'Rådhusgata 18, 4614 Kristiansand'),
('Fortum Arendal', 'Arendal', 58.4611, 8.7722, 12, 16, true, '200 kW', 5.00, 'Fortum', 'Langbrygga 6, 4841 Arendal'),
('Circle K Grimstad', 'Grimstad', 58.3389, 8.5936, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Storgata 18, 4876 Grimstad'),
('Mer Mandal', 'Mandal', 58.0297, 7.4575, 8, 10, true, '175 kW', 4.90, 'Mer', 'Storgata 24, 4514 Mandal'),
('Tesla Supercharger Vennesla', 'Vennesla', 58.2542, 8.1356, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Hunsfosveien 9, 4700 Vennesla'),

-- Rogaland
('Tesla Supercharger Stavanger', 'Stavanger', 58.9700, 5.7331, 16, 20, true, '250 kW', 4.50, 'Tesla', 'Klubbgata 3, 4013 Stavanger'),
('Fortum Stavanger Sentrum', 'Stavanger', 58.9667, 5.7333, 12, 16, true, '300 kW', 5.50, 'Fortum', 'Torggata 12, 4006 Stavanger'),
('Circle K Sandnes', 'Sandnes', 58.8516, 5.7357, 10, 14, true, '150 kW', 5.20, 'Circle K', 'Ruten 4, 4313 Sandnes'),
('Mer Haugesund', 'Haugesund', 59.4138, 5.2683, 8, 12, true, '175 kW', 4.90, 'Mer', 'Storgata 106, 5527 Haugesund'),
('Eviny Bryne', 'Bryne', 58.7358, 5.6469, 6, 8, true, '150 kW', 4.80, 'Eviny', 'Storgata 22, 4340 Bryne'),

-- Hordaland/Vestland
('Tesla Supercharger Bergen', 'Bergen', 60.3913, 5.3221, 18, 24, true, '250 kW', 4.50, 'Tesla', 'Torgallmenningen 8, 5014 Bergen'),
('Fortum Bergen Sentrum', 'Bergen', 60.3900, 5.3300, 14, 18, true, '300 kW', 5.50, 'Fortum', 'Vågsallmenningen 16, 5014 Bergen'),
('Circle K Bergen Flesland', 'Bergen', 60.2906, 5.2181, 10, 14, true, '150 kW', 5.20, 'Circle K', 'Flyplassvegen 555, 5258 Bergen'),
('Mer Voss', 'Voss', 60.6300, 6.4167, 8, 10, true, '175 kW', 4.90, 'Mer', 'Uttrågata 9, 5700 Voss'),
('Tesla Supercharger Odda', 'Odda', 60.0667, 6.5500, 6, 8, true, '250 kW', 4.50, 'Tesla', 'Eitrheimsvegen 6, 5750 Odda'),

-- Møre og Romsdal  
('Tesla Supercharger Ålesund', 'Ålesund', 62.4722, 6.1575, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Keiser Wilhelms gate 11, 6003 Ålesund'),
('Eviny Ålesund Sentrum', 'Ålesund', 62.4700, 6.1600, 8, 12, true, '175 kW', 4.80, 'Eviny', 'Apotekergata 16, 6004 Ålesund'),
('Circle K Molde', 'Molde', 62.7378, 7.1574, 10, 14, true, '150 kW', 5.20, 'Circle K', 'Storgata 18, 6413 Molde'),
('Fortum Kristiansund', 'Kristiansund', 63.1109, 7.7285, 8, 12, true, '150 kW', 5.00, 'Fortum', 'Langveien 1, 6508 Kristiansund'),
('Tesla Supercharger Stryn', 'Stryn', 61.9115, 6.7156, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Tonningsgata 1, 6783 Stryn'),

-- Trøndelag
('Tesla Supercharger Trondheim', 'Trondheim', 63.4305, 10.3951, 16, 20, true, '250 kW', 4.50, 'Tesla', 'Munkegata 5, 7011 Trondheim'),
('Fortum Trondheim City', 'Trondheim', 63.4300, 10.4000, 12, 16, true, '300 kW', 5.50, 'Fortum', 'Nordre gate 9, 7011 Trondheim'),
('Circle K Hell', 'Stjørdal', 63.4428, 10.9228, 8, 10, true, '150 kW', 5.20, 'Circle K', 'Flyplass-veien 150, 7500 Stjørdal'),

-- Nordland  
('Tesla Supercharger Bodø', 'Bodø', 67.2804, 14.3951, 10, 14, true, '250 kW', 4.50, 'Tesla', 'Storgata 21, 8006 Bodø'),
('Fortum Mo i Rana', 'Mo i Rana', 66.3139, 14.1428, 6, 8, true, '150 kW', 5.00, 'Fortum', 'Jernbanegata 15, 8622 Mo i Rana'),

-- Troms
('Tesla Supercharger Tromsø', 'Tromsø', 69.6696, 18.9553, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Storgata 91, 9008 Tromsø'),
('Circle K Narvik', 'Narvik', 68.4385, 17.4272, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Kongens gate 64, 8514 Narvik');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_charging_stations_updated_at
BEFORE UPDATE ON public.charging_stations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();