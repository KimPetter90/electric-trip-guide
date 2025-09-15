-- Legger til enda flere ladestasjoner fra hele Norge for total dekning

-- Flere Oslo og omegn
INSERT INTO public.charging_stations (name, location, latitude, longitude, available, total, fast_charger, power, cost, provider, address) VALUES
('Tesla Supercharger Oslo Grünerløkka', 'Oslo', 59.9239, 10.7527, 12, 16, true, '250 kW', 4.50, 'Tesla', 'Thorvald Meyers gate 59, 0552 Oslo'),
('Fortum Oslo Aker Brygge', 'Oslo', 59.9106, 10.7308, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Stranden 3, 0250 Oslo'),
('Circle K Oslo Majorstuen', 'Oslo', 59.9294, 10.7140, 6, 10, true, '150 kW', 5.20, 'Circle K', 'Bogstadveien 27, 0355 Oslo'),
('Eviny Oslo Nydalen', 'Oslo', 59.9496, 10.7677, 10, 14, true, '200 kW', 4.80, 'Eviny', 'Sandakerveien 24, 0473 Oslo'),
('Mer Oslo Helsfyr', 'Oslo', 59.9158, 10.7936, 8, 12, true, '175 kW', 4.90, 'Mer', 'Helsfyr Atrium, 0659 Oslo'),
('Tesla Supercharger Asker', 'Asker', 59.8317, 10.4353, 10, 14, true, '250 kW', 4.50, 'Tesla', 'Knud Askers vei 26, 1383 Asker'),
('Fortum Bærum Sandvika', 'Bærum', 59.8939, 10.5230, 12, 16, true, '175 kW', 5.00, 'Fortum', 'Sandvika Storsenter, 1338 Sandvika'),
('Circle K Kolbotn', 'Kolbotn', 59.8167, 10.7833, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Sofiemyrveien 2, 1410 Kolbotn'),

-- Flere Bergen område
('Fortum Bergen Kokstad', 'Bergen', 60.3333, 5.4000, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Kokstadveien 23, 5257 Kokstad'),
('Circle K Bergen Åsane', 'Bergen', 60.4667, 5.3167, 6, 10, true, '150 kW', 5.20, 'Circle K', 'Åsane Storsenter, 5116 Ulset'),
('Eviny Bergen Lagunen', 'Bergen', 60.3833, 5.3500, 10, 14, true, '200 kW', 4.80, 'Eviny', 'Lagunen Storsenter, 5239 Rådal'),
('Mer Bergen Sartor', 'Bergen', 60.3500, 5.3167, 8, 12, true, '175 kW', 4.90, 'Mer', 'Sartor Senter, 5235 Rådal'),

-- Flere Trondheim område  
('Eviny Trondheim Lade', 'Trondheim', 63.4500, 10.4500, 8, 12, true, '200 kW', 4.80, 'Eviny', 'Ladekaia 1, 7041 Trondheim'),
('Mer Trondheim Torgarden', 'Trondheim', 63.4167, 10.4000, 6, 10, true, '175 kW', 4.90, 'Mer', 'Torgard Senter, 7012 Trondheim'),
('Tesla Supercharger Trondheim Sør', 'Trondheim', 63.3600, 10.4000, 14, 18, true, '250 kW', 4.50, 'Tesla', 'Heimdalsveien 50, 7080 Heimdal'),

-- Flere Stavanger/Rogaland
('Circle K Stavanger Madla', 'Stavanger', 58.9167, 5.7000, 8, 12, true, '150 kW', 5.20, 'Circle K', 'Madlamarkveien 10, 4042 Hafrsfjord'),
('Eviny Stavanger Forus', 'Stavanger', 58.9333, 5.7333, 10, 14, true, '200 kW', 4.80, 'Eviny', 'Forusveien 15, 4033 Stavanger'),
('Fortum Bryne', 'Bryne', 58.7333, 5.6500, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Storgata 2, 4340 Bryne'),
('Circle K Jørpeland', 'Jørpeland', 59.0333, 6.0667, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Sentrumsveien 12, 4100 Jørpeland'),
('Tesla Supercharger Tau', 'Tau', 59.0500, 5.9333, 4, 6, true, '250 kW', 4.50, 'Tesla', 'Strandgata 8, 4120 Tau'),

-- Flere Kristiansand/Agder
('Circle K Kristiansand Sørlandsparken', 'Kristiansand', 58.1833, 8.0833, 12, 16, true, '150 kW', 5.20, 'Circle K', 'Barstølveien 31, 4636 Kristiansand'),
('Fortum Kristiansand Kvadraturen', 'Kristiansand', 58.1461, 7.9956, 8, 12, true, '175 kW', 5.00, 'Fortum', 'Kirkegata 15, 4612 Kristiansand'),
('Mer Farsund', 'Farsund', 58.0833, 6.8000, 4, 6, true, '175 kW', 4.90, 'Mer', 'Storgata 30, 4550 Farsund'),
('Eviny Lista', 'Lista', 58.0167, 6.6000, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Listadriveien 1, 4563 Borhaug'),

-- Flere langs E6 nord
('Fortum Verdal', 'Verdal', 63.7833, 11.4667, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Storgata 42, 7650 Verdal'),
('Circle K Levanger', 'Levanger', 63.7500, 11.3000, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Sjøgata 36, 7600 Levanger'),
('Eviny Namsos', 'Namsos', 64.4667, 11.5000, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Storgata 8, 7800 Namsos'),
('Fortum Grong', 'Grong', 64.4667, 12.3000, 2, 4, true, '175 kW', 5.00, 'Fortum', 'Storgata 1, 7870 Grong'),
('Circle K Majavatn', 'Majavatn', 65.1667, 13.2000, 2, 4, true, '150 kW', 5.20, 'Circle K', 'E6 Majavatn, 8680 Trofors'),
('Tesla Supercharger Rognan', 'Rognan', 67.1000, 15.4000, 4, 6, true, '250 kW', 4.50, 'Tesla', 'Storgata 15, 8250 Rognan'),

-- Flere Nordland
('Fortum Sandnessjøen', 'Sandnessjøen', 66.0167, 12.6333, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Storgata 18, 8800 Sandnessjøen'),
('Circle K Brønnøysund', 'Brønnøysund', 65.4667, 12.2167, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Havnegata 10, 8900 Brønnøysund'),
('Eviny Sortland', 'Sortland', 68.6983, 15.4097, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Storgata 9, 8400 Sortland'),

-- Flere Troms
('Circle K Harstad', 'Harstad', 68.8000, 16.5500, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Stangnes, 9405 Harstad'),
('Fortum Finnsnes', 'Finnsnes', 69.2333, 17.9833, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Sentrum 4, 9440 Evenskjer'),
('Eviny Bardufoss', 'Bardufoss', 69.0667, 18.5333, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Storveien 1, 9325 Bardufoss'),

-- Flere Finnmark
('Fortum Vadsø', 'Vadsø', 70.0667, 29.7500, 2, 4, true, '175 kW', 5.00, 'Fortum', 'Storgata 23, 9800 Vadsø'),
('Circle K Vardø', 'Vardø', 70.3667, 31.1000, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Strandgata 11, 9950 Vardø'),
('Eviny Kautokeino', 'Kautokeino', 69.0167, 23.0333, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Bieddjovuohppi 5, 9520 Guovdageaidnu'),
('Fortum Karasjok', 'Karasjok', 69.4667, 25.5167, 2, 4, true, '175 kW', 5.00, 'Fortum', 'Museumsgata 17, 9730 Karasjok'),

-- Flere Sogn og Fjordane  
('Circle K Balestrand', 'Balestrand', 61.2000, 6.5333, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Sentrum 1, 6899 Balestrand'),
('Eviny Ørsta', 'Ørsta', 62.2000, 6.1333, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Storgata 4, 6150 Ørsta'),
('Fortum Volda', 'Volda', 62.1500, 6.0667, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Sentrum 9, 6100 Volda'),

-- Flere Møre og Romsdal
('Tesla Supercharger Kristiansund', 'Kristiansund', 63.1167, 7.7333, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Langveien 1, 6517 Kristiansund'),
('Circle K Sunndalsøra', 'Sunndalsøra', 62.6833, 8.5667, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Sentrumsveien 12, 6600 Sunndalsøra'),
('Fortum Andalsnes', 'Andalsnes', 62.5667, 7.6833, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Storgata 14, 6300 Åndalsnes'),

-- Flere Oppland/Innlandet
('Eviny Otta', 'Otta', 61.7729, 9.5295, 6, 8, true, '175 kW', 4.80, 'Eviny', 'Ola Dahls gate 3, 2670 Otta'),
('Circle K Lom', 'Lom', 61.8333, 8.5667, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Fossbergveien 19, 2686 Lom'),
('Tesla Supercharger Beitostølen', 'Beitostølen', 61.2500, 8.9167, 4, 6, true, '250 kW', 4.50, 'Tesla', 'Radisson Blu Resort, 2953 Beitostølen'),
('Fortum Sjusjøen', 'Sjusjøen', 61.2333, 10.6333, 2, 4, true, '175 kW', 5.00, 'Fortum', 'Nordseterveien 90, 2612 Sjusjøen'),

-- Flere Hedmark
('Circle K Flisa', 'Flisa', 60.6333, 12.1167, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Storgata 8, 2270 Flisa'),
('Eviny Koppang', 'Koppang', 61.5667, 11.0500, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Storgata 32, 2480 Koppang'),

-- Flere Telemark
('Fortum Bø', 'Bø', 59.4167, 9.0667, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Storgata 8, 3800 Bø'),
('Circle K Drangedal', 'Drangedal', 59.1000, 9.0500, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Sentrumsveien 1, 3750 Drangedal'),
('Eviny Seljord', 'Seljord', 59.4833, 8.6333, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Rjukanveien 13, 3840 Seljord'),

-- Flere Vestfold
('Tesla Supercharger Horten', 'Horten', 59.4167, 10.4833, 8, 12, true, '250 kW', 4.50, 'Tesla', 'Storgata 17, 3187 Horten'),
('Circle K Åsgårdstrand', 'Åsgårdstrand', 59.3500, 10.4500, 4, 6, true, '150 kW', 5.20, 'Circle K', 'Hovedveien 21, 3179 Åsgårdstrand'),

-- Flere Buskerud
('Fortum Ål', 'Ål', 60.6333, 8.5500, 4, 6, true, '175 kW', 5.00, 'Fortum', 'Torget 3, 3570 Ål'),
('Circle K Flå', 'Flå', 60.7167, 9.2500, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Sentrumsveien 7, 3536 Flå'),
('Eviny Nore og Uvdal', 'Nore og Uvdal', 60.7500, 8.4667, 2, 4, true, '175 kW', 4.80, 'Eviny', 'Uvdalsveien 42, 3632 Uvdal'),

-- Flere Østfold
('Fortum Mysen', 'Mysen', 59.5500, 11.3167, 6, 8, true, '175 kW', 5.00, 'Fortum', 'Storgata 25, 1850 Mysen'),
('Circle K Askim', 'Askim', 59.5833, 11.1667, 6, 8, true, '150 kW', 5.20, 'Circle K', 'Storgata 48, 1825 Askim'),
('Eviny Spydeberg', 'Spydeberg', 59.6000, 11.0667, 4, 6, true, '175 kW', 4.80, 'Eviny', 'Senterveien 2, 1820 Spydeberg'),

-- Øyene og spesielle steder
('Fortum Svalbard Longyearbyen', 'Longyearbyen', 78.2167, 15.6333, 2, 4, true, '100 kW', 6.00, 'Fortum', 'Sentrum, 9170 Longyearbyen'),
('Circle K Hammerfest Måsøy', 'Måsøy', 71.0000, 23.0000, 2, 4, true, '150 kW', 5.20, 'Circle K', 'Havøysund, 9690 Havøysund');