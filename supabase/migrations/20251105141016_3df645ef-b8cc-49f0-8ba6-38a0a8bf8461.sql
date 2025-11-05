-- Add approved_at and approved_by columns to content tables for admin tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add removed status to approval_status
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_approval_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned', 'removed'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_approval_status_check;
ALTER TABLE events ADD CONSTRAINT events_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned', 'removed'));

ALTER TABLE hotels DROP CONSTRAINT IF EXISTS hotels_approval_status_check;
ALTER TABLE hotels ADD CONSTRAINT hotels_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned', 'removed'));

ALTER TABLE adventure_places DROP CONSTRAINT IF EXISTS adventure_places_approval_status_check;
ALTER TABLE adventure_places ADD CONSTRAINT adventure_places_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected', 'banned', 'removed'));