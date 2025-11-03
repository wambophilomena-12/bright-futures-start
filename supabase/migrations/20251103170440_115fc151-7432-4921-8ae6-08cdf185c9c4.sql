-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('guest', 'user', 'business', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Add approval workflow columns to business_accounts
ALTER TABLE public.business_accounts
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN admin_notes TEXT,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID;

-- Update bookings table to support guest bookings
ALTER TABLE public.bookings
ALTER COLUMN user_id DROP NOT NULL,
ADD COLUMN guest_name TEXT,
ADD COLUMN guest_email TEXT,
ADD COLUMN guest_phone TEXT,
ADD COLUMN is_guest_booking BOOLEAN DEFAULT false;

-- Add listing approval columns to all listing tables
ALTER TABLE public.trips
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_notes TEXT;

ALTER TABLE public.events
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_notes TEXT;

ALTER TABLE public.hotels
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_notes TEXT;

ALTER TABLE public.adventure_places
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_notes TEXT;

-- Update RLS policies for listings to show only approved items to public
DROP POLICY IF EXISTS "Allow public read access to trips" ON public.trips;
CREATE POLICY "Allow public read access to approved trips"
ON public.trips
FOR SELECT
USING (approval_status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to approved events"
ON public.events
FOR SELECT
USING (approval_status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow public read access to hotels" ON public.hotels;
CREATE POLICY "Allow public read access to approved hotels"
ON public.hotels
FOR SELECT
USING (approval_status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow public read access to adventure_places" ON public.adventure_places;
CREATE POLICY "Allow public read access to approved adventure_places"
ON public.adventure_places
FOR SELECT
USING (approval_status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Business owners can insert their listings
CREATE POLICY "Business owners can insert trips"
ON public.trips
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'business') AND auth.uid() = created_by);

CREATE POLICY "Business owners can insert events"
ON public.events
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'business') AND auth.uid() = created_by);

CREATE POLICY "Business owners can insert hotels"
ON public.hotels
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'business') AND auth.uid() = created_by);

CREATE POLICY "Business owners can insert adventure places"
ON public.adventure_places
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'business') AND auth.uid() = created_by);

-- Business owners can update their own listings
CREATE POLICY "Business owners can update their trips"
ON public.trips
FOR UPDATE
USING (auth.uid() = created_by AND public.has_role(auth.uid(), 'business'));

CREATE POLICY "Business owners can update their events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by AND public.has_role(auth.uid(), 'business'));

CREATE POLICY "Business owners can update their hotels"
ON public.hotels
FOR UPDATE
USING (auth.uid() = created_by AND public.has_role(auth.uid(), 'business'));

CREATE POLICY "Business owners can update their adventure places"
ON public.adventure_places
FOR UPDATE
USING (auth.uid() = created_by AND public.has_role(auth.uid(), 'business'));

-- Admins can update all listings (for approval)
CREATE POLICY "Admins can update all trips"
ON public.trips
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all hotels"
ON public.hotels
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all adventure places"
ON public.adventure_places
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update bookings RLS to support guest bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.trips WHERE trips.id = bookings.item_id AND trips.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.events WHERE events.id = bookings.item_id AND events.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.hotels WHERE hotels.id = bookings.item_id AND hotels.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.adventure_places WHERE adventure_places.id = bookings.item_id AND adventure_places.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND NOT is_guest_booking)
  OR (is_guest_booking AND guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Trigger to automatically assign 'user' role on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

-- Trigger to assign 'business' role on business account creation
CREATE OR REPLACE FUNCTION public.handle_new_business_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'business')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_account_created
  AFTER INSERT ON public.business_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_business_role();