-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;

-- Create new policy that truly allows anyone (including anonymous users) to view properties
CREATE POLICY "Anyone can view properties" 
ON properties 
FOR SELECT 
USING (true);