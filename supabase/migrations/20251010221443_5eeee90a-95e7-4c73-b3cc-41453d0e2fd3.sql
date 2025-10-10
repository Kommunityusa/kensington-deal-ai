-- Schedule auto-fetch-images to run every 5 minutes
SELECT cron.schedule(
  'auto-fetch-property-images',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/auto-fetch-images',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule sentiment analysis to run every 3 minutes
SELECT cron.schedule(
  'auto-analyze-news-sentiment',
  '*/3 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/analyze-news-sentiment',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);