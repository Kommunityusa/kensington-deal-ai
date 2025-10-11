-- Add faqs and steps columns to blog_posts table for AI-search optimization
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS faqs jsonb,
ADD COLUMN IF NOT EXISTS steps jsonb;