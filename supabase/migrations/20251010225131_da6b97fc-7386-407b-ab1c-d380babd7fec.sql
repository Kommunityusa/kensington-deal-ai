-- Create trend analysis table
CREATE TABLE IF NOT EXISTS public.trend_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_text TEXT NOT NULL,
  key_insights JSONB,
  sentiment_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trend_analysis ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trend analysis
CREATE POLICY "Anyone can view trend analysis"
  ON public.trend_analysis
  FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage trend analysis"
  ON public.trend_analysis
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_trend_analysis_updated_at
  BEFORE UPDATE ON public.trend_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create cron job to run trend analysis daily at 6 AM
SELECT cron.schedule(
  'daily-trend-analysis',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://wypmanbdmdegxylgvvhx.supabase.co/functions/v1/analyze-trends',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1hbmJkbWRlZ3h5bGd2dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzcwMzYsImV4cCI6MjA3NDkxMzAzNn0.-3LbFpAAJ5FXCtpNzJBCOQ4OM9IcEXYP66IFQ_pGupU"}'::jsonb
    ) as request_id;
  $$
);