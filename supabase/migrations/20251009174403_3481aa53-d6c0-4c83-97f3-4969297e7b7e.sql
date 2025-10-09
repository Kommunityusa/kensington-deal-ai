-- Reactivate ALL unique properties one more time
WITH unique_props AS (
  SELECT (array_agg(id ORDER BY created_at ASC))[1] as keep_id
  FROM properties
  GROUP BY address
)
UPDATE properties
SET is_active = (id IN (SELECT keep_id FROM unique_props));