-- First mark all inactive
UPDATE properties SET is_active = false;

-- Then activate the first property for each unique address
UPDATE properties p1
SET is_active = true
WHERE NOT EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.address = p1.address
  AND p2.created_at < p1.created_at
);