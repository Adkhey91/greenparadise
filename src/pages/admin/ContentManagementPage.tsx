import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  ImageIcon,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp
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

const SECTION_CONFIG: Record<SectionType, { label: string; icon: typeof UtensilsCrossed; gradient: string; bgColor: string }> = {
  restaurant: { 
    label: 'Restaurant', 
    icon: UtensilsCrossed, 
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10'
  },
  cafeteria: { 
    label: 'Cafétéria', 
    icon: Coffee, 
    gradient: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10'
  },
  activites: { 
    label: 'Activités', 
    icon: Gamepad2, 
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10'
  },
  services: { 
    label: 'Services', 
    icon: Wrench, 
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10'
  },
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

  const toggleActive = async (section: ContentSection) => {
    const { error } = await supabase
      .from('content_sections')
      .update({ actif: !section.actif })
      .eq('id', section.id);

    if (error) {
      toast.error('Erreur');
      return;
    }
    toast.success(section.actif ? 'Désactivé' : 'Activé');
    fetchSections();
  };

  const filteredSections = sections.filter(s => s.section_type === activeTab);
  const config = SECTION_CONFIG[activeTab];

  // Stats par section
  const stats = {
    total: filteredSections.length,
    active: filteredSections.filter(s => s.actif).length,
    withPhoto: filteredSections.filter(s => s.photo_url).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-6 text-white`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <config.icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestion du Contenu</h1>
              <p className="text-white/80">Restaurant, Cafétéria, Activités et Services</p>
            </div>
          </div>
          
          <Button 
            onClick={() => openDialog()} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`${config.bgColor} border-0`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`${config.bgColor} border-0`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`${config.bgColor} border-0`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withPhoto}</p>
              <p className="text-sm text-muted-foreground">Avec photo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionType)}>
        <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/50">
          {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => {
            const cfg = SECTION_CONFIG[type];
            const count = sections.filter(s => s.section_type === type).length;
            return (
              <TabsTrigger 
                key={type} 
                value={type} 
                className={`gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:${cfg.gradient} data-[state=active]:text-white transition-all`}
              >
                <cfg.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cfg.label}</span>
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => (
          <TabsContent key={type} value={type} className="space-y-4 mt-6">
            {filteredSections.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2">
                <div className={`mx-auto w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
                  <config.icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Aucun élément</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par ajouter du contenu à cette section
                </p>
                <Button onClick={() => openDialog()} className={`bg-gradient-to-r ${config.gradient} border-0`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un élément
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSections.map(section => (
                  <Card 
                    key={section.id} 
                    className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${!section.actif ? 'opacity-60' : ''}`}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      {section.photo_url ? (
                        <img 
                          src={section.photo_url} 
                          alt={section.titre}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
                          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Overlay badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {section.prix_dzd && (
                          <Badge className={`bg-gradient-to-r ${config.gradient} border-0 text-white font-bold`}>
                            {section.prix_dzd.toLocaleString()} DA
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant={section.actif ? "default" : "secondary"}
                          className={section.actif ? "bg-green-500/90 hover:bg-green-500" : ""}
                        >
                          {section.actif ? (
                            <><Eye className="w-3 h-3 mr-1" /> Visible</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" /> Masqué</>
                          )}
                        </Badge>
                      </div>
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-foreground line-clamp-1">{section.titre}</h3>
                        <Sparkles className={`w-4 h-4 flex-shrink-0 ${section.actif ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      </div>
                      
                      {section.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {section.description}
                        </p>
                      )}
                      
                      {/* Tags */}
                      {section.tags && section.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {section.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {section.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{section.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleActive(section)}
                          className="flex-1"
                        >
                          {section.actif ? (
                            <><EyeOff className="w-4 h-4 mr-1" /> Masquer</>
                          ) : (
                            <><Eye className="w-4 h-4 mr-1" /> Afficher</>
                          )}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDialog(section)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer "{section.titre}" ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteSection(section.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
                <config.icon className="w-4 h-4 text-white" />
              </div>
              {editingSection ? 'Modifier' : 'Ajouter'} - {config.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo Preview */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className={`relative h-40 rounded-xl overflow-hidden ${config.bgColor}`}>
                {form.photo_url ? (
                  <img 
                    src={form.photo_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? 'Envoi...' : 'Changer la photo'}
                  </div>
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="prix">Prix (DA)</Label>
                <Input
                  id="prix"
                  type="number"
                  value={form.prix_dzd}
                  onChange={(e) => setForm(prev => ({ ...prev, prix_dzd: e.target.value }))}
                  placeholder="Optionnel"
                />
              </div>
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
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS[activeTab].map(tag => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${form.tags.includes(tag) ? `bg-gradient-to-r ${config.gradient} border-0` : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {form.actif ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4" />}
                <Label htmlFor="actif" className="cursor-pointer">
                  {form.actif ? 'Visible sur le site' : 'Masqué du site'}
                </Label>
              </div>
              <Switch
                id="actif"
                checked={form.actif}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, actif: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveSection} className={`bg-gradient-to-r ${config.gradient} border-0`}>
              {editingSection ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
