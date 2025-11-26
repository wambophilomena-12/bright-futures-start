-- Enable realtime for saved_items table
ALTER TABLE saved_items REPLICA IDENTITY FULL;

-- Add unique constraint to prevent duplicate saves
ALTER TABLE saved_items 
ADD CONSTRAINT unique_user_item UNIQUE (user_id, item_id);

-- Add check constraint for valid item types
ALTER TABLE saved_items 
ADD CONSTRAINT valid_item_type 
CHECK (item_type IN ('trip', 'event', 'hotel', 'adventure_place', 'attraction'));

-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);

-- Add index on item_id for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON saved_items(item_id);

-- Add composite index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_items_user_item ON saved_items(user_id, item_id);

-- Update RLS policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Authenticated users can insert their own saved items" ON saved_items;
CREATE POLICY "Authenticated users can insert their own saved items"
ON saved_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND item_type IN ('trip', 'event', 'hotel', 'adventure_place', 'attraction')
);