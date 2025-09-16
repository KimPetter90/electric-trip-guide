-- Enable realtime for charging_stations table
ALTER TABLE public.charging_stations REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER publication supabase_realtime ADD TABLE public.charging_stations;