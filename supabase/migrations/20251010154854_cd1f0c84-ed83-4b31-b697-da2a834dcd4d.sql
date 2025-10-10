-- Update existing Rentcast properties with placeholder images
UPDATE properties 
SET image_url = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'
WHERE source = 'rentcast' 
AND (image_url IS NULL OR image_url = '');