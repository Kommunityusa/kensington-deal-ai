-- Add sentiment column to news_articles
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS sentiment_score numeric,
ADD COLUMN IF NOT EXISTS sentiment_details jsonb;