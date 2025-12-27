-- Create content_sections table for Restaurant, Cafétéria, Activités, Services
CREATE TABLE public.content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL CHECK (section_type IN ('restaurant', 'cafeteria', 'activites', 'services')),
  titre TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  photo_filename TEXT,
  prix_dzd INTEGER,
  actif BOOLEAN NOT NULL DEFAULT true,
  ordre INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;

-- Public can view active sections
CREATE POLICY "Anyone can view active sections"
ON public.content_sections
FOR SELECT
USING (actif = true);

-- Admins can view all sections
CREATE POLICY "Admins can view all sections"
ON public.content_sections
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert sections
CREATE POLICY "Admins can insert sections"
ON public.content_sections
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update sections
CREATE POLICY "Admins can update sections"
ON public.content_sections
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete sections
CREATE POLICY "Admins can delete sections"
ON public.content_sections
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_content_sections_updated_at
BEFORE UPDATE ON public.content_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for content photos
INSERT INTO storage.buckets (id, name, public) VALUES ('content-photos', 'content-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content photos
CREATE POLICY "Content photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-photos');

CREATE POLICY "Admins can upload content photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update content photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete content photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-photos' AND has_role(auth.uid(), 'admin'::app_role));