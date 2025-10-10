-- Update existing Rentcast properties with Google Street View images
UPDATE properties
SET image_url = 'https://maps.googleapis.com/maps/api/streetview?size=800x600&location=' || 
                regexp_replace(address || ', ' || city || ', ' || state || ' ' || zip_code, '\s+', '+', 'g') ||
                '&key=' || current_setting('app.settings.google_maps_api_key', true)
WHERE source = 'rentcast' 
  AND (image_url IS NULL 
       OR image_url LIKE '%unsplash%' 
       OR image_url LIKE '%placeholder%');