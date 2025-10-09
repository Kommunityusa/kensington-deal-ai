-- Activate all unique properties with the most recent data
UPDATE properties SET is_active = true 
WHERE id IN (
  SELECT DISTINCT ON (LOWER(TRIM(address))) id
  FROM properties
  ORDER BY LOWER(TRIM(address)), last_verified_at DESC NULLS LAST, created_at DESC
);