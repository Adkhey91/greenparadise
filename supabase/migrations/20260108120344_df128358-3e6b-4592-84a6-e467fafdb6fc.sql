-- =====================================================
-- MULTI-VENUE PLATFORM MIGRATION
-- Jardin de Green + Restaurant Le Repère + Lounge
-- =====================================================

-- 1. Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_reservable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default venues
INSERT INTO public.venues (code, name, description, is_reservable) VALUES
  ('GARDEN', 'Jardin de Green', 'Espace détente en plein air avec formules tout compris', true),
  ('RESTAURANT', 'Le Repère', 'Restaurant gastronomique dans un chalet de montagne', true),
  ('LOUNGE', 'Lounge', 'Espace cafétéria et bar - Menu uniquement', false)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Anyone can view venues
CREATE POLICY "Anyone can view venues" ON public.venues
  FOR SELECT USING (true);

-- Admins can manage venues
CREATE POLICY "Admins can manage venues" ON public.venues
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add venue_id to formulas table
ALTER TABLE public.formulas 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing formulas to belong to GARDEN venue
UPDATE public.formulas 
SET venue_id = (SELECT id FROM public.venues WHERE code = 'GARDEN')
WHERE venue_id IS NULL;

-- 3. Add venue_id to park_tables
ALTER TABLE public.park_tables 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing park_tables to belong to GARDEN venue
UPDATE public.park_tables 
SET venue_id = (SELECT id FROM public.venues WHERE code = 'GARDEN')
WHERE venue_id IS NULL;

-- 4. Add new columns to reservations table
ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'walkin')),
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120;

-- Update existing reservations to belong to GARDEN venue
UPDATE public.reservations 
SET venue_id = (SELECT id FROM public.venues WHERE code = 'GARDEN')
WHERE venue_id IS NULL;

-- 5. Create function to generate venue-specific reservation numbers
CREATE OR REPLACE FUNCTION public.generate_venue_reservation_number(venue_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  prefix TEXT;
  exists_already BOOLEAN;
BEGIN
  -- Set prefix based on venue
  IF venue_code = 'RESTAURANT' THEN
    prefix := 'RPR-';
  ELSE
    prefix := 'GRN-';
  END IF;
  
  LOOP
    new_number := prefix || lpad(floor(random() * 10000)::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.reservations WHERE reservation_number = new_number) INTO exists_already;
    IF NOT exists_already THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$;

-- 6. Update trigger to use venue-aware reservation number
CREATE OR REPLACE FUNCTION public.set_reservation_identifiers()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  venue_code TEXT;
BEGIN
  -- Get venue code if venue_id is set
  IF NEW.venue_id IS NOT NULL THEN
    SELECT code INTO venue_code FROM public.venues WHERE id = NEW.venue_id;
  ELSE
    venue_code := 'GARDEN';
  END IF;
  
  IF NEW.reservation_number IS NULL THEN
    NEW.reservation_number := generate_venue_reservation_number(venue_code);
  END IF;
  
  IF NEW.secure_token IS NULL THEN
    NEW.secure_token := generate_secure_token();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Add constraint to prevent double-booking (same table, overlapping time)
-- First, create a function to check for overlaps
CREATE OR REPLACE FUNCTION public.check_table_availability(
  p_table_id UUID,
  p_start_datetime TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_end_datetime TIMESTAMP WITH TIME ZONE;
  conflict_count INTEGER;
BEGIN
  p_end_datetime := p_start_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
  
  SELECT COUNT(*) INTO conflict_count
  FROM public.reservations r
  WHERE r.table_id = p_table_id
    AND r.statut IN ('confirmee', 'checked_in')
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    AND (
      (r.date_reservation::TIMESTAMP WITH TIME ZONE + COALESCE(r.duration_minutes, 120) * INTERVAL '1 minute') > p_start_datetime
      AND r.date_reservation::TIMESTAMP WITH TIME ZONE < p_end_datetime
    );
  
  RETURN conflict_count = 0;
END;
$$;

-- 8. Update resto_tables to have venue_id (for restaurant tables)
ALTER TABLE public.resto_tables 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

UPDATE public.resto_tables 
SET venue_id = (SELECT id FROM public.venues WHERE code = 'RESTAURANT')
WHERE venue_id IS NULL;

-- 9. Add venue_id to resto_menu_items for Lounge items
ALTER TABLE public.resto_menu_items 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing menu items to belong to RESTAURANT venue
UPDATE public.resto_menu_items 
SET venue_id = (SELECT id FROM public.venues WHERE code = 'RESTAURANT')
WHERE venue_id IS NULL;