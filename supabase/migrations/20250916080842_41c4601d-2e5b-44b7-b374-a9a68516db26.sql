-- Allow service role to update charging stations for live data simulation
CREATE POLICY "Service role can update charging stations"
ON public.charging_stations
FOR UPDATE
TO service_role
USING (true);