-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create formulas table for park offerings
CREATE TABLE public.formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  description_courte TEXT,
  prix_dzd INTEGER NOT NULL DEFAULT 0,
  nb_personnes INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  actif BOOLEAN NOT NULL DEFAULT true,
  photo_url TEXT,
  photo_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create park tables linked to formulas
CREATE TABLE public.park_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formule_id UUID NOT NULL REFERENCES public.formulas(id) ON DELETE CASCADE,
  nom_ou_numero TEXT NOT NULL,
  capacite INTEGER NOT NULL DEFAULT 4,
  statut TEXT NOT NULL DEFAULT 'libre' CHECK (statut IN ('libre', 'occupee', 'reservee', 'hors_service')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.park_tables ENABLE ROW LEVEL SECURITY;

-- Formulas policies
CREATE POLICY "Anyone can view active formulas"
ON public.formulas FOR SELECT
USING (actif = true);

CREATE POLICY "Admins can view all formulas"
ON public.formulas FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert formulas"
ON public.formulas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update formulas"
ON public.formulas FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete formulas"
ON public.formulas FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Park tables policies
CREATE POLICY "Anyone can view tables of active formulas"
ON public.park_tables FOR SELECT
USING (EXISTS (SELECT 1 FROM public.formulas f WHERE f.id = formule_id AND f.actif = true));

CREATE POLICY "Admins can view all tables"
ON public.park_tables FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert tables"
ON public.park_tables FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tables"
ON public.park_tables FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tables"
ON public.park_tables FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_formulas_updated_at
BEFORE UPDATE ON public.formulas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_park_tables_updated_at
BEFORE UPDATE ON public.park_tables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for formula photos
INSERT INTO storage.buckets (id, name, public) VALUES ('formula-photos', 'formula-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view formula photos"
ON storage.objects FOR SELECT USING (bucket_id = 'formula-photos');

CREATE POLICY "Admins can upload formula photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formula-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update formula photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'formula-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete formula photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'formula-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for tables status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.park_tables;