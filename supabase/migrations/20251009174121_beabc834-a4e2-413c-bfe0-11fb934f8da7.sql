-- Activate one property per unique address using array aggregation
UPDATE properties
SET is_active = CASE 
  WHEN id IN (
    SELECT (array_agg(id ORDER BY created_at ASC))[1]
    FROM properties
    GROUP BY address
  ) THEN true
  ELSE false
END;