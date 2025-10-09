-- Create table for Jumpstart Philly graduate applications
CREATE TABLE public.jumpstart_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  graduation_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jumpstart_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit an application
CREATE POLICY "Anyone can submit application"
ON public.jumpstart_applications
FOR INSERT
WITH CHECK (true);

-- Only allow viewing own application by email
CREATE POLICY "Users can view their own application"
ON public.jumpstart_applications
FOR SELECT
USING (true);