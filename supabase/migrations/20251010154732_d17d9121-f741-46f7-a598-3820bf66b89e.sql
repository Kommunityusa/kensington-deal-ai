-- Drop the index and create a proper unique constraint
DROP INDEX IF EXISTS properties_external_id_unique;

-- Add a unique constraint on external_id
ALTER TABLE properties 
ADD CONSTRAINT properties_external_id_key 
UNIQUE (external_id);