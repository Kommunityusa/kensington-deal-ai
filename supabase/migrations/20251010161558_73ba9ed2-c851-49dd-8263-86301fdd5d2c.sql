-- Create a cron job to scrape properties daily at 2 AM UTC
SELECT cron.schedule(
  'daily-property-scrape',
  '0 2 * * *', -- Run at 2 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/scrape-multi-source-properties',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create a cron job to update property images daily at 2:30 AM UTC (30 minutes after property scrape)
SELECT cron.schedule(
  'daily-image-update',
  '30 2 * * *', -- Run at 2:30 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/update-property-images',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);