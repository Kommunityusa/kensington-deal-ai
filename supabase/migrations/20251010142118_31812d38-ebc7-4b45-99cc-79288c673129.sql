-- Schedule Zillow scraping to run once per day at 3 AM
SELECT cron.schedule(
  'scrape-zillow-daily',
  '0 3 * * *', -- At 3:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/scrape-zillow',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb
    ) as request_id;
  $$
);