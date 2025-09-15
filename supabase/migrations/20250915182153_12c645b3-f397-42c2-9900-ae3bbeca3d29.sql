-- Legger til mange flere ladestasjoner fra hele Norge

-- Bergen og vest
INSERT INTO public.charging_stations (name, location, latitude, longitude, available, total, fast_charger, power, cost, provider, address) VALUES
('Tesla Supercharger Bergen', 'Bergen', 60.3913, 5.3221, 18, 24, true, '250 kW', 4.50, 'Tesla', 'Sandsliåsen 50, 5254 Sandsli'),
('Fortum Bergen Sentrum', 'Bergen', 60.3951, 5.3250, 14, 18, true, '175 kW', 5.00, 'Fortum', 'Torgallmenningen 2, 5014 Bergen'),
('Circle K Bergen Vest', 'Bergen', 60.3800, 5.3000, 10, 14, true, '150 kW', 5.20, 'Circle K', 'Fjøsangerveien 150, 5059 Bergen'),
('Eviny Bergen Flesland', 'Bergen', 60.2934, 5.2181, 8, 12, true, '200 kW', 4.80, 'Eviny', 'Flyplassveien 555, 5258 Bergen'),

-- Trondheim og midt
('Tesla Supercharger Trondheim', 'Trondheim', 63.4305, 10.3951, 16, 20, true, '250 kW', 4.50, 'Tesla', 'Dronningens gate 5, 7011 Trondheim'),
('Fortum Trondheim City', 'Trondheim', 63.4297, 10.3933, 12, 16, true, '175 kW', 5.00, 'Fortum', 'Nordre gate 9, 7011 Trondheim'),
('Circle K Trondheim Øst', 'Trondheim', 63.4200, 10.4500, 8, 12, true, '150 kW', 5.20, 'Circle K', 'Vikåsen Allé 11, 7020 Trondheim'),
('Mer Trondheim Sør', 'Trondheim', 63.3600, 10.4000, 10, 14, true, '175 kW', 4.90, 'Mer', 'Heimdalsgata 120, 7080 Heimdal'),

-- Tromsø og nord
('Tesla Supercharger Tromsø', 'Tromsø', 69.6496, 18.9560, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Storgata 4, 9008 Tromsø'),
('Fortum Tromsø', 'Tromsø', 69.6500, 18.9600, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Fredrik Langes gate 38, 9008 Tromsø'),
('Circle K Bodø', 'Bodø', 67.2804, 14.4049, 6, 10, true, '150 kW', 5.20, 'Circle K', 'Sjøgata 21, 8006 Bodø'),
('Eviny Narvik', 'Narvik', 68.4384, 17.4272, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Kongens gate 64, 8514 Narvik'),
('Fortum Alta', 'Alta', 69.9689, 23.2717, 4, 8, true, '150 kW', 5.00, 'Fortum', 'Bossekopveien 33, 9510 Alta'),

-- Flere vestlandet
('Tesla Supercharger Ålesund', 'Ålesund', 62.4722, 6.1495, 10, 14, true, '250 kW', 4.50, 'Tesla', 'Keiser Wilhelms gate 11, 6003 Ålesund'),
('Fortum Molde', 'Molde', 62.7378, 7.1618, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Storgata 18, 6413 Molde'),
('Circle K Haugesund', 'Haugesund', 59.4138, 5.2681, 8, 10, true, '150 kW', 5.20, 'Circle K', 'Storgata 143, 5527 Haugesund'),
('Eviny Florø', 'Florø', 61.6014, 5.0348, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Markegata 37, 6900 Florø'),

-- Flere østlandet
('Tesla Supercharger Lillehammer', 'Lillehammer', 61.1153, 10.4662, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Storgata 108, 2609 Lillehammer'),
('Fortum Hamar', 'Hamar', 60.7945, 11.0680, 10, 14, true, '175 kW', 5.00, 'Fortum', 'Torggata 69, 2317 Hamar'),
('Circle K Gjøvik', 'Gjøvik', 60.7957, 10.6915, 6, 10, true, '150 kW', 5.20, 'Circle K', 'Storgata 32, 2815 Gjøvik'),
('Eviny Elverum', 'Elverum', 60.8811, 11.5634, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Storgata 31, 2408 Elverum'),
('Mer Moss', 'Moss', 59.4369, 10.6596, 8, 12, true, '175 kW', 4.90, 'Mer', 'Fleischer gate 4, 1532 Moss'),
('Tesla Supercharger Sarpsborg', 'Sarpsborg', 59.2839, 11.1098, 10, 14, true, '250 kW', 4.50, 'Tesla', 'Borgengata 5, 1721 Sarpsborg'),
('Fortum Fredrikstad', 'Fredrikstad', 59.2181, 10.9298, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Nygaardsgata 50, 1606 Fredrikstad'),

-- Flere sør
('Tesla Supercharger Stavanger Sola', 'Stavanger', 58.8760, 5.6369, 20, 24, true, '250 kW', 4.50, 'Tesla', 'Flyplassveien 230, 4055 Sola'),
('Fortum Sandnes', 'Sandnes', 58.8518, 5.7364, 12, 16, true, '175 kW', 5.00, 'Fortum', 'Langgata 58, 4306 Sandnes'),
('Circle K Egersund', 'Egersund', 58.4513, 5.9938, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Storgata 40, 4370 Egersund'),
('Eviny Flekkefjord', 'Flekkefjord', 58.2973, 6.6605, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Elvegata 47, 4400 Flekkefjord'),

-- Viktige ruter langs E6, E18, E39
('Tesla Supercharger Dombås', 'Dombås', 62.0757, 9.1218, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Stasjonsgata 11, 2660 Dombås'),
('Fortum Otta', 'Otta', 61.7729, 9.5295, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Ola Dahls gate 1, 2670 Otta'),
('Circle K Vinstra', 'Vinstra', 61.6356, 9.8364, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Losna industriområde, 2640 Vinstra'),
('Eviny Fagernes', 'Fagernes', 61.0157, 9.2906, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Jernbanegata 2, 2900 Fagernes'),
('Mer Lærdal', 'Lærdal', 61.0981, 7.4815, 4, 6, true, '175 kW', 4.90, 'Mer', 'Øyrlandsvegen 40, 6887 Lærdal'),
('Tesla Supercharger Voss', 'Voss', 60.6298, 6.4186, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Skulegata 14, 5700 Voss'),
('Fortum Geilo', 'Geilo', 60.5342, 8.2067, 6, 10, true, '175 kW', 5.00, 'Fortum', 'Geiloveien 38, 3580 Geilo'),

-- E39 vestkysten
('Circle K Førde', 'Førde', 61.4564, 5.8581, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Hafstadvegen 72, 6800 Førde'),
('Eviny Sogndal', 'Sogndal', 61.2281, 7.0981, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Gravensteinsgata 9, 6856 Sogndal'),
('Fortum Måløy', 'Måløy', 61.9350, 5.1133, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Bryggegata 13, 6700 Måløy'),

-- E18 vestfold/telemark
('Tesla Supercharger Larvik', 'Larvik', 59.0549, 10.0357, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Storgata 48, 3256 Larvik'),
('Circle K Bamble', 'Bamble', 59.0178, 9.6030, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Industriveien 1, 3960 Stathelle'),

-- Innlandet
('Eviny Kongsvinger', 'Kongsvinger', 60.1951, 12.0016, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Storgata 23, 2212 Kongsvinger'),
('Fortum Rena', 'Rena', 61.1333, 11.3667, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Renaveien 2, 2450 Rena'),

-- E6 nordover
('Circle K Steinkjer', 'Steinkjer', 64.0158, 11.4955, 8, 10, true, '150 kW', 5.20, 'Circle K', 'Kongens gate 40, 7713 Steinkjer'),
('Fortum Mosjøen', 'Mosjøen', 65.8372, 13.2044, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Strandgata 39, 8656 Mosjøen'),
('Eviny Mo i Rana', 'Mo i Rana', 66.3128, 14.1424, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Ole Tobias Olsens gate 1, 8622 Mo i Rana'),
('Tesla Supercharger Fauske', 'Fauske', 67.2598, 15.3897, 6, 8, true, '250 kW', 4.50, 'Tesla', 'Storgata 82, 8200 Fauske'),

-- Finnmark
('Circle K Hammerfest', 'Hammerfest', 70.6634, 23.6898, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Strandgata 15, 9600 Hammerfest'),
('Fortum Kirkenes', 'Kirkenes', 69.7267, 30.0512, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Willy Brands gate 1, 9915 Kirkenes'),
('Eviny Lakselv', 'Lakselv', 70.0608, 24.9739, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Sentrumsveien 4, 9710 Lakselv'),

-- Lofoten/Vesterålen
('Fortum Leknes', 'Leknes', 68.1528, 13.6158, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Tangaveien 1, 8370 Leknes'),
('Circle K Svolvær', 'Svolvær', 68.2342, 14.5664, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Lamholmen 1, 8300 Svolvær'),
('Eviny Sortland', 'Sortland', 68.6983, 15.4097, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Storgata 9, 8400 Sortland'),

-- Flere langs hovedruter
('Mer Alvdal', 'Alvdal', 62.1044, 10.6400, 4, 6, true, '175 kW', 4.90, 'Mer', 'Storgata 31, 2560 Alvdal'),
('Tesla Supercharger Røros', 'Røros', 62.5742, 11.3886, 6, 8, true, '250 kW', 4.50, 'Tesla', 'Bergmannsgata 13, 7374 Røros'),
('Fortum Oppdal', 'Oppdal', 62.5950, 9.6919, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Ola Setroms veg 1, 7340 Oppdal'),
('Circle K Berkåk', 'Berkåk', 62.8236, 10.0008, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Stasjonsvegen 2, 7391 Berkåk'),

-- Østfold grensehandel
('Tesla Supercharger Halden', 'Halden', 59.1342, 11.3875, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Storgata 21, 1776 Halden'),
('Fortum Ørje', 'Ørje', 59.6833, 11.6833, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Storgata 14, 1878 Ørje'),

-- Buskerud fjell
('Eviny Uvdal', 'Uvdal', 60.7500, 8.4667, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Uvdalsvegen 1, 3632 Uvdal'),
('Circle K Rjukan', 'Rjukan', 59.8781, 8.5933, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Torget 2, 3660 Rjukan'),

-- Agder kyst
('Fortum Lillesand', 'Lillesand', 58.2525, 8.3700, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Strandgata 15, 4790 Lillesand'),
('Circle K Risør', 'Risør', 58.7206, 9.2347, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Torvet 2, 4950 Risør'),
('Eviny Lyngdal', 'Lyngdal', 58.1261, 7.0831, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Audnagata 1, 4580 Lyngdal'),

-- Sogn og Fjordane
('Mer Stryn', 'Stryn', 61.9111, 6.7186, 4, 6, true, '175 kW', 4.90, 'Mer', 'Tonningsgata 1, 6783 Stryn'),
('Tesla Supercharger Nordfjordeid', 'Nordfjordeid', 61.9067, 6.0833, 4, 6, true, '250 kW', 4.50, 'Tesla', 'Markegata 28, 6770 Nordfjordeid'),

-- Hedmark grense
('Fortum Tynset', 'Tynset', 62.2783, 10.7817, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Storgata 36, 2500 Tynset'),
('Circle K Røst', 'Røst', 61.1667, 11.9500, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Hovedveien 1, 2447 Røst');