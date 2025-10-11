-- Create blog_posts table for SEO content
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author TEXT DEFAULT 'Kensington Deals Team',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  category TEXT,
  tags TEXT[],
  read_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to published posts
CREATE POLICY "Published blog posts are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

-- Create policy for authenticated users to view all posts
CREATE POLICY "Authenticated users can view all blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert posts
CREATE POLICY "Authenticated users can create blog posts" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update posts
CREATE POLICY "Authenticated users can update blog posts" 
ON public.blog_posts 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create index on slug for faster lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Create index on published_at for sorting
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- Create index on category
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();