-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to property images
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow service role to upload property images
CREATE POLICY "Service role can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');