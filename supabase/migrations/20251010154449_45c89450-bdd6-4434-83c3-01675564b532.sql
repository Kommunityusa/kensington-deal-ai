-- Remove duplicate entries keeping only the most recent one
DELETE FROM properties a USING properties b
WHERE a.id < b.id 
AND a.external_id = b.external_id 
AND a.external_id IS NOT NULL;

-- Now add unique constraint on external_id
CREATE UNIQUE INDEX properties_external_id_unique 
ON properties(external_id) 
WHERE external_id IS NOT NULL;