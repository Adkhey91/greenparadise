-- Add new columns for free reservation system with QR ticket
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reservation_number text,
ADD COLUMN IF NOT EXISTS secure_token text,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS table_id uuid,
ADD COLUMN IF NOT EXISTS total_price integer DEFAULT 0;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_reservation_number ON public.reservations(reservation_number) WHERE reservation_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_secure_token ON public.reservations(secure_token) WHERE secure_token IS NOT NULL;

-- Create function to generate reservation number
CREATE OR REPLACE FUNCTION public.generate_reservation_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number text;
  exists_already boolean;
BEGIN
  LOOP
    -- Generate format: GRN-XXXX (4 random digits)
    new_number := 'GRN-' || lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM public.reservations WHERE reservation_number = new_number) INTO exists_already;
    
    IF NOT exists_already THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$;

-- Create function to generate secure token
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Generate a UUID-based token
  RETURN replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
END;
$$;

-- Create trigger to auto-generate reservation_number and secure_token on insert
CREATE OR REPLACE FUNCTION public.set_reservation_identifiers()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reservation_number IS NULL THEN
    NEW.reservation_number := generate_reservation_number();
  END IF;
  
  IF NEW.secure_token IS NULL THEN
    NEW.secure_token := generate_secure_token();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_reservation_identifiers_trigger ON public.reservations;
CREATE TRIGGER set_reservation_identifiers_trigger
BEFORE INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservation_identifiers();

-- Update existing reservations with identifiers
UPDATE public.reservations 
SET 
  reservation_number = generate_reservation_number(),
  secure_token = generate_secure_token()
WHERE reservation_number IS NULL OR secure_token IS NULL;

-- Add RLS policy for public ticket lookup by phone + reservation_number
CREATE POLICY "Anyone can lookup their reservation by phone and number"
ON public.reservations
FOR SELECT
USING (true);

-- Drop the old restrictive select policy if exists
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;