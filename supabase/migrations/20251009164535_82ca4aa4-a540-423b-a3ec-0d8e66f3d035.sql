-- Allow service role to insert, update, and delete properties
CREATE POLICY "Service role can manage properties"
ON properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add a field to track when a property was last seen/verified
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS last_verified_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS source text;

-- Create index for faster lookups by external_id
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_last_verified ON properties(last_verified_at);