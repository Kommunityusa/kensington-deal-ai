-- Create cron job to auto-generate blog posts daily at 9 AM UTC
-- Note: pg_cron extension should already be enabled in your project
SELECT cron.schedule(
  'auto-generate-blog-daily',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/auto-generate-blog',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);