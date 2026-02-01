-- Add establishment_type column to hotels table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'hotels' 
        AND column_name = 'establishment_type'
    ) THEN
        ALTER TABLE public.hotels 
        ADD COLUMN establishment_type text DEFAULT 'general';
    END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN public.hotels.establishment_type IS 'Type of establishment: general (full hotel) or accommodation_only (rental/stay only)';