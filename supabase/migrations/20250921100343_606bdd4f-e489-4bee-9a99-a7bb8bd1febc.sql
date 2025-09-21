-- Remove duplicate charging stations, keeping only the first occurrence
DELETE FROM charging_stations 
WHERE id NOT IN (
  SELECT DISTINCT ON (name, location, latitude, longitude) id 
  FROM charging_stations 
  ORDER BY name, location, latitude, longitude, created_at
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_charging_station 
ON charging_stations (name, location, latitude, longitude);