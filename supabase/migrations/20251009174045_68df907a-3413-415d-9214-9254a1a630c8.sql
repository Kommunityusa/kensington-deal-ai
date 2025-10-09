-- First, mark all properties as inactive
UPDATE properties SET is_active = false;

-- Then, reactivate only one property per unique address (keeping the oldest)
WITH ranked_properties AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(REGEXP_REPLACE(address, '[.,\s-]', '', 'g'))
      ORDER BY created_at ASC
    ) as rn
  FROM properties
)
UPDATE properties
SET is_active = true
WHERE id IN (
  SELECT id FROM ranked_properties WHERE rn = 1
);