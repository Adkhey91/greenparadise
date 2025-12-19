-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  date_reservation DATE NOT NULL,
  formule TEXT NOT NULL,
  nombre_personnes INTEGER,
  message TEXT,
  statut TEXT DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact messages table
CREATE TABLE public.messages_contact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  sujet TEXT,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_contact ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for reservations (visitors can submit)
CREATE POLICY "Anyone can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (true);

-- Allow public inserts for contact messages (visitors can submit)
CREATE POLICY "Anyone can create contact messages"
ON public.messages_contact
FOR INSERT
WITH CHECK (true);