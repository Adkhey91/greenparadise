-- Add table_number_snapshot to reservations for display even if table is modified/deleted
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS table_number_snapshot text;

-- Add comment for clarity
COMMENT ON COLUMN public.reservations.table_number_snapshot IS 'Snapshot of table number at assignment time for persistent display';