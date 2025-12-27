import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload,
  RefreshCw,
  UtensilsCrossed,
  Coffee,
  Gamepad2,
  Wrench,
  GripVertical
} from "lucide-react";

type SectionType = 'restaurant' | 'cafeteria' | 'activites' | 'services';

interface ContentSection {
  id: string;
  section_type: SectionType;
  titre: string;
  description: string | null;
  photo_url: string | null;
  photo_filename: string | null;
  prix_dzd: number | null;
  actif: boolean;
  ordre: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const SECTION_CONFIG: Record<SectionType, { label: string; icon: typeof UtensilsCrossed; color: string }> = {
  restaurant: { label: 'Restaurant', icon: UtensilsCrossed, color: 'bg-orange-500' },
  cafeteria: { label: 'Cafétéria', icon: Coffee, color: 'bg-amber-500' },
  activites: { label: 'Activités', icon: Gamepad2, color: 'bg-blue-500' },
  services: { label: 'Services', icon: Wrench, color: 'bg-purple-500' },
};

const AVAILABLE_TAGS: Record<SectionType, string[]> = {
  restaurant: ['halal', 'traditionnel', 'grillades', 'pizza', 'salade', 'dessert'],
  cafeteria: ['boissons-chaudes', 'jus', 'patisserie', 'glace', 'snack'],
  activites: ['enfants', 'adultes', 'famille', 'groupe', 'sport', 'detente'],
  services: ['parking', 'wifi', 'livraison', 'reservation', 'evenement'],
};

export default function ContentManagementPage() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SectionType>('restaurant');
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    prix_dzd: '',
    tags: [] as string[],
    actif: true,
    photo_url: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_sections')
      .select('*')
      .order('ordre', { ascending: true });
    
    if (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
      setLoading(false);
      return;
    }
    setSections((data || []) as ContentSection[]);
    setLoading(false);
  };

  const openDialog = (section?: ContentSection) => {
    if (section) {
      setEditingSection(section);
      setForm({
        titre: section.titre,
        description: section.description || '',
        prix_dzd: section.prix_dzd?.toString() || '',
        tags: section.tags || [],
        actif: section.actif,
        photo_url: section.photo_url || '',
      });
    } else {
      setEditingSection(null);
      setForm({
        titre: '',
        description: '',
        prix_dzd: '',
        tags: [],
        actif: true,
        photo_url: '',
      });
    }
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5 Mo)');
      return;
    }

    setUploadingPhoto(true);
    const filename = `${activeTab}/${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('content-photos')
      .upload(filename, file);

    if (error) {
      toast.error('Erreur lors du téléversement');
      console.error(error);
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('content-photos')
      .getPublicUrl(filename);

    setForm(prev => ({ ...prev, photo_url: urlData.publicUrl }));
    setUploadingPhoto(false);
    toast.success('Photo téléversée');
  };

  const saveSection = async () => {
    if (!form.titre.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    const maxOrder = sections
      .filter(s => s.section_type === activeTab)
      .reduce((max, s) => Math.max(max, s.ordre), -1);

    const sectionData = {
      section_type: activeTab,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      prix_dzd: form.prix_dzd ? parseInt(form.prix_dzd) : null,
      tags: form.tags,
      actif: form.actif,
      photo_url: form.photo_url.trim() || null,
      photo_filename: form.photo_url ? form.photo_url.split('/').pop() : null,
      ordre: editingSection ? editingSection.ordre : maxOrder + 1,
    };

    if (editingSection) {
      const { error } = await supabase
        .from('content_sections')
        .update(sectionData)
        .eq('id', editingSection.id);

      if (error) {
        toast.error('Erreur lors de la modification');
        console.error(error);
        return;
      }
      toast.success('Élément modifié');
    } else {
      const { error } = await supabase
        .from('content_sections')
        .insert([sectionData]);

      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
        return;
      }
      toast.success('Élément créé');
    }

    setDialogOpen(false);
    fetchSections();
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('content_sections')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return;
    }
    toast.success('Élément supprimé');
    fetchSections();
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const filteredSections = sections.filter(s => s.section_type === activeTab);
  const config = SECTION_CONFIG[activeTab];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du Contenu</h1>
          <p className="text-muted-foreground">Restaurant, Cafétéria, Activités et Services</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionType)}>
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => {
            const cfg = SECTION_CONFIG[type];
            return (
              <TabsTrigger key={type} value={type} className="gap-2">
                <cfg.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{SECTION_CONFIG[type].label}</h2>
              <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            {filteredSections.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Aucun élément dans cette section
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSections.map(section => (
                  <Card key={section.id} className={`${!section.actif ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex items-center text-muted-foreground">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        
                        {section.photo_url && (
                          <img 
                            src={section.photo_url} 
                            alt={section.titre}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">{section.titre}</h3>
                            {!section.actif && (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </div>
                          
                          {section.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {section.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {section.prix_dzd && (
                              <Badge variant="outline" className="text-primary">
                                {section.prix_dzd} DA
                              </Badge>
                            )}
                            {section.tags?.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDialog(section)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSection(section.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog for adding/editing */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Modifier' : 'Ajouter'} - {config.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre *</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm(prev => ({ ...prev, titre: e.target.value }))}
                placeholder="Nom de l'élément"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">Prix (DA)</Label>
              <Input
                id="prix"
                type="number"
                value={form.prix_dzd}
                onChange={(e) => setForm(prev => ({ ...prev, prix_dzd: e.target.value }))}
                placeholder="Optionnel"
              />
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex gap-4 items-center">
                {form.photo_url && (
                  <img 
                    src={form.photo_url} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-accent">
                  <Upload className="w-4 h-4" />
                  {uploadingPhoto ? 'Envoi...' : 'Téléverser'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS[activeTab].map(tag => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="actif"
                checked={form.actif}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif">Actif (visible sur le site)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveSection}>
              {editingSection ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
