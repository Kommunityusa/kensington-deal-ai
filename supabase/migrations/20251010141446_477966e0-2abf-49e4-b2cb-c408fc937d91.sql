-- Reactivate all Philadelphia OPA properties that were incorrectly marked as inactive
UPDATE properties 
SET is_active = true 
WHERE source = 'philly-opa' OR external_id LIKE 'philly-opa-%';