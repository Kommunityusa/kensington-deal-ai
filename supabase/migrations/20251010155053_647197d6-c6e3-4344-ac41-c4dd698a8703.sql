-- Update existing Rentcast properties with Google Street View images
-- This is a helper function to generate the Street View URL
CREATE OR REPLACE FUNCTION generate_street_view_url(address TEXT, city TEXT, state TEXT, zip TEXT, api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://maps.googleapis.com/maps/api/streetview?size=800x600&location=' || 
         regexp_replace(address || ', ' || city || ', ' || state || ' ' || zip, '\s+', '+', 'g') || 
         '&key=' || api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: We can't call the function here as we don't have access to the API key in migrations
-- The images will be updated when the scraper runs next time