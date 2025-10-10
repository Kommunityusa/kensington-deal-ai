-- Add user_id to properties table for user-submitted listings
ALTER TABLE public.properties 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN listing_type text DEFAULT 'scraped' CHECK (listing_type IN ('scraped', 'user_listing')),
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text;

-- Update RLS policies to allow users to create their own listings
CREATE POLICY "Users can create their own property listings"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND listing_type = 'user_listing'
  AND zip_code IN ('19125', '19134', '19122', '19137')
);

CREATE POLICY "Users can update their own property listings"
ON public.properties
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND listing_type = 'user_listing')
WITH CHECK (auth.uid() = user_id AND listing_type = 'user_listing');

CREATE POLICY "Users can delete their own property listings"
ON public.properties
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND listing_type = 'user_listing');