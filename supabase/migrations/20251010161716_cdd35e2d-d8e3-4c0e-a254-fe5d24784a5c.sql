-- Create news_articles table to store fetched news
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL UNIQUE,
  description text,
  source text,
  published_at timestamp with time zone,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view news articles
CREATE POLICY "Anyone can view news articles"
  ON public.news_articles
  FOR SELECT
  USING (true);

-- Service role can manage news articles
CREATE POLICY "Service role can manage news articles"
  ON public.news_articles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on created_at for efficient sorting
CREATE INDEX idx_news_articles_created_at ON public.news_articles(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create cron job to fetch news articles daily at 3 AM UTC
SELECT cron.schedule(
  'daily-news-fetch',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/fetch-kensington-news',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to fetch news images daily at 3:30 AM UTC
SELECT cron.schedule(
  'daily-news-images-fetch',
  '30 3 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/fetch-news-images',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);