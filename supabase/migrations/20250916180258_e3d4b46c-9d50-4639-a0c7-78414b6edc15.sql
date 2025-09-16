-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function that triggers registration email
CREATE OR REPLACE FUNCTION notify_new_registration()
RETURNS trigger AS $$
BEGIN
  -- Call the edge function to send registration email
  PERFORM net.http_post(
    url := 'https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/send-registration-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5NDQwOCwiZXhwIjoyMDczMzcwNDA4fQ.3E3kP5Yr-2m8_Dg9oKfwhGP9dEsHZJpOSGgzLQo8-Yg"}'::jsonb,
    body := json_build_object(
      'userEmail', NEW.email,
      'userName', NEW.full_name
    )::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registrations
DROP TRIGGER IF EXISTS trigger_notify_registration ON public.profiles;
CREATE TRIGGER trigger_notify_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_registration();

-- Schedule daily stats email at 22:00 Norwegian time (21:00 UTC)
SELECT cron.schedule(
  'daily-stats-email',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vwmopjkrnjrxkbxsswnb.supabase.co/functions/v1/send-daily-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW9wamtybmpyeGtieHNzd25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5NDQwOCwiZXhwIjoyMDczMzcwNDA4fQ.3E3kP5Yr-2m8_Dg9oKfwhGP9dEsHZJpOSGgzLQo8-Yg"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);