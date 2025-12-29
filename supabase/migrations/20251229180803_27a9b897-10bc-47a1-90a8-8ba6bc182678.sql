-- Table des tables du restaurant
CREATE TABLE public.resto_tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    capacite INTEGER NOT NULL DEFAULT 4,
    statut TEXT NOT NULL DEFAULT 'libre' CHECK (statut IN ('libre', 'occupee', 'reservee', 'hs')),
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des catégories de menu
CREATE TYPE public.resto_categorie AS ENUM ('entrees', 'plats', 'desserts', 'boissons');

-- Table des plats du menu
CREATE TABLE public.resto_menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    description TEXT,
    prix_dzd INTEGER NOT NULL,
    categorie resto_categorie NOT NULL,
    photo_url TEXT,
    photo_filename TEXT,
    allergenes TEXT[] DEFAULT '{}',
    disponible BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER DEFAULT NULL,
    ordre INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des réservations restaurant
CREATE TABLE public.resto_reservations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID NOT NULL REFERENCES public.resto_tables(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    date_reservation DATE NOT NULL,
    heure TEXT NOT NULL,
    nombre_personnes INTEGER NOT NULL DEFAULT 2,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),
    montant_dzd INTEGER DEFAULT 0,
    mode_paiement TEXT DEFAULT NULL CHECK (mode_paiement IS NULL OR mode_paiement IN ('cash', 'cib', 'dahabia')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resto_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resto_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resto_reservations ENABLE ROW LEVEL SECURITY;

-- Policies resto_tables
CREATE POLICY "Anyone can view resto tables" ON public.resto_tables FOR SELECT USING (true);
CREATE POLICY "Admins can insert resto tables" ON public.resto_tables FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update resto tables" ON public.resto_tables FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete resto tables" ON public.resto_tables FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies resto_menu_items
CREATE POLICY "Anyone can view available menu items" ON public.resto_menu_items FOR SELECT USING (disponible = true);
CREATE POLICY "Admins can view all menu items" ON public.resto_menu_items FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert menu items" ON public.resto_menu_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update menu items" ON public.resto_menu_items FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete menu items" ON public.resto_menu_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies resto_reservations
CREATE POLICY "Anyone can create resto reservations" ON public.resto_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all resto reservations" ON public.resto_reservations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update resto reservations" ON public.resto_reservations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete resto reservations" ON public.resto_reservations FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_resto_tables_updated_at BEFORE UPDATE ON public.resto_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resto_menu_items_updated_at BEFORE UPDATE ON public.resto_menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resto_reservations_updated_at BEFORE UPDATE ON public.resto_reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tables status
ALTER PUBLICATION supabase_realtime ADD TABLE public.resto_tables;

-- Insert default 12 tables (4x3 grid)
INSERT INTO public.resto_tables (numero, capacite, position_x, position_y) VALUES
(1, 4, 0, 0), (2, 4, 1, 0), (3, 4, 2, 0), (4, 4, 3, 0),
(5, 4, 0, 1), (6, 6, 1, 1), (7, 6, 2, 1), (8, 4, 3, 1),
(9, 2, 0, 2), (10, 2, 1, 2), (11, 4, 2, 2), (12, 8, 3, 2);

-- Create storage bucket for menu photos
INSERT INTO storage.buckets (id, name, public) VALUES ('resto-photos', 'resto-photos', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view resto photos" ON storage.objects FOR SELECT USING (bucket_id = 'resto-photos');
CREATE POLICY "Admins can upload resto photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resto-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update resto photos" ON storage.objects FOR UPDATE USING (bucket_id = 'resto-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete resto photos" ON storage.objects FOR DELETE USING (bucket_id = 'resto-photos' AND has_role(auth.uid(), 'admin'::app_role));