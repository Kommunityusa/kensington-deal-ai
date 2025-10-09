-- Reactivate all unique properties that were incorrectly marked as inactive
-- This keeps only one property per unique normalized address (the oldest one)

WITH unique_properties AS (
  SELECT DISTINCT ON (
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(address, '[.,\s-]', '', 'g'),
                'street', 'st', 'gi'
              ),
              'avenue', 'ave', 'gi'
            ),
            'road', 'rd', 'gi'
          ),
          'boulevard', 'blvd', 'gi'
        ),
        'drive', 'dr', 'gi'
      )
    )
  ) id
  FROM properties
  ORDER BY LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(address, '[.,\s-]', '', 'g'),
              'street', 'st', 'gi'
            ),
            'avenue', 'ave', 'gi'
          ),
          'road', 'rd', 'gi'
        ),
        'boulevard', 'blvd', 'gi'
      ),
      'drive', 'dr', 'gi'
    )
  ), created_at ASC
)
UPDATE properties
SET is_active = true
WHERE id IN (SELECT id FROM unique_properties);