import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  LayoutGrid,
  List,
  Lock,
  LockOpen,
  ImageIcon,
  RefreshCw,
  Users
} from "lucide-react";

interface Formula {
  id: string;
  nom: string;
  description_courte: string | null;
  prix_dzd: number;
  nb_personnes: number;
  tags: string[];
  actif: boolean;
  photo_url: string | null;
  photo_filename: string | null;
  created_at: string;
  updated_at: string;
}

interface ParkTable {
  id: string;
  formule_id: string;
  nom_ou_numero: string;
  capacite: number;
  statut: 'libre' | 'occupee' | 'reservee' | 'hors_service';
  created_at: string;
  updated_at: string;
}

const AVAILABLE_TAGS = ['Table de jardin', 'Accès espace vert', 'Parasol inclus', 'Table', 'Chaises', 'wifi', 'jeu', 'piscine', 'ombre', 'vue'];

export default function GardenManagementPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [tables, setTables] = useState<ParkTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'formulas' | 'tables'>('formulas');
  
  // Formula dialog
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [formulaForm, setFormulaForm] = useState({
    nom: '',
    description_courte: '',
    prix_dzd: 0,
    nb_personnes: 4,
    tags: [] as string[],
    actif: true,
    photo_url: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Table dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [addingTablesForFormula, setAddingTablesForFormula] = useState<Formula | null>(null);
  const [tableCount, setTableCount] = useState(1);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('garden-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'park_tables' }, () => fetchTables())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formulas' }, () => fetchFormulas())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchFormulas(), fetchTables()]);
    setLoading(false);
  };

  const fetchFormulas = async () => {
    const { data, error } = await supabase.from('formulas').select('*').order('prix_dzd', { ascending: true });
    if (error) { toast.error('Erreur chargement formules'); return; }
    setFormulas(data || []);
  };

  const fetchTables = async () => {
    const { data, error } = await supabase.from('park_tables').select('*').order('nom_ou_numero', { ascending: true });
    if (error) { toast.error('Erreur chargement tables'); return; }
    setTables((data || []) as ParkTable[]);
  };

  const openFormulaDialog = (formula?: Formula) => {
    if (formula) {
      setEditingFormula(formula);
      setFormulaForm({
        nom: formula.nom,
        description_courte: formula.description_courte || '',
        prix_dzd: formula.prix_dzd,
        nb_personnes: formula.nb_personnes,
        tags: formula.tags || [],
        actif: formula.actif,
        photo_url: formula.photo_url || '',
      });
    } else {
      setEditingFormula(null);
      setFormulaForm({ nom: '', description_courte: '', prix_dzd: 0, nb_personnes: 4, tags: [], actif: true, photo_url: '' });
    }
    setFormulaDialogOpen(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    setUploadingPhoto(true);
    const filename = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('formula-photos').upload(filename, file);
    if (error) { toast.error('Erreur téléversement'); setUploadingPhoto(false); return; }
    const { data: urlData } = supabase.storage.from('formula-photos').getPublicUrl(filename);
    setFormulaForm(prev => ({ ...prev, photo_url: urlData.publicUrl }));
    setUploadingPhoto(false);
    toast.success('Photo téléversée');
  };

  const saveFormula = async () => {
    if (!formulaForm.nom.trim()) { toast.error('Nom requis'); return; }
    const data = {
      nom: formulaForm.nom.trim(),
      description_courte: formulaForm.description_courte.trim() || null,
      prix_dzd: formulaForm.prix_dzd,
      nb_personnes: formulaForm.nb_personnes,
      tags: formulaForm.tags,
      actif: formulaForm.actif,
      photo_url: formulaForm.photo_url.trim() || null,
      photo_filename: formulaForm.photo_url ? formulaForm.photo_url.split('/').pop() : null,
    };
    if (editingFormula) {
      const { error } = await supabase.from('formulas').update(data).eq('id', editingFormula.id);
      if (error) { toast.error('Erreur modification'); return; }
      toast.success('Formule modifiée');
    } else {
      const { error } = await supabase.from('formulas').insert([data]);
      if (error) { toast.error('Erreur création'); return; }
      toast.success('Formule créée');
    }
    setFormulaDialogOpen(false);
    fetchFormulas();
  };

  const deleteFormula = async (id: string) => {
    const { error } = await supabase.from('formulas').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); return; }
    toast.success('Formule supprimée');
    fetchFormulas();
  };

  const toggleTag = (tag: string) => {
    setFormulaForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const openAddTablesDialog = (formula: Formula) => {
    setAddingTablesForFormula(formula);
    const existingTables = tables.filter(t => t.formule_id === formula.id);
    setTableCount(existingTables.length > 0 ? 1 : 5);
    setTableDialogOpen(true);
  };

  const addTables = async () => {
    if (!addingTablesForFormula) return;
    const existingTables = tables.filter(t => t.formule_id === addingTablesForFormula.id);
    const startNum = existingTables.length + 1;
    const newTables = [];
    for (let i = 0; i < tableCount; i++) {
      newTables.push({
        formule_id: addingTablesForFormula.id,
        nom_ou_numero: `Table n°${startNum + i}`,
        capacite: addingTablesForFormula.nb_personnes,
        statut: 'libre',
      });
    }
    const { error } = await supabase.from('park_tables').insert(newTables);
    if (error) { toast.error('Erreur ajout tables'); return; }
    toast.success(`${tableCount} table(s) ajoutée(s)`);
    setTableDialogOpen(false);
    fetchTables();
  };

  const updateTableStatus = async (tableId: string, newStatus: ParkTable['statut']) => {
    const { error } = await supabase.from('park_tables').update({ statut: newStatus }).eq('id', tableId);
    if (error) { toast.error('Erreur mise à jour'); return; }
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from('park_tables').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); return; }
    toast.success('Table supprimée');
  };

  const getTableStats = (formulaId: string) => {
    const fTables = tables.filter(t => t.formule_id === formulaId);
    return {
      total: fTables.length,
      libre: fTables.filter(t => t.statut === 'libre').length,
      occupee: fTables.filter(t => t.statut === 'occupee').length,
      reservee: fTables.filter(t => t.statut === 'reservee').length,
    };
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'libre': return 'Libre';
      case 'occupee': return 'Présentiel';
      case 'reservee': return 'Réservée';
      case 'hors_service': return 'H.S.';
      default: return statut;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'libre': return 'text-emerald-600';
      case 'occupee': return 'text-amber-600';
      case 'reservee': return 'text-rose-600';
      case 'hors_service': return 'text-slate-500';
      default: return '';
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du Jardin</h1>
          <p className="text-muted-foreground">
            Gérez vos formules et tables • {formulas.length} formules • {tables.length} tables
          </p>
        </div>
        <Button onClick={() => openFormulaDialog()} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Nouvelle formule
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'formulas' | 'tables')}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="formulas" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Formules
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-2">
            <List className="w-4 h-4" />
            Tableau des tables
          </TabsTrigger>
        </TabsList>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="mt-6">
          {formulas.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground">Aucune formule. Créez-en une !</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formulas.map(formula => {
                const stats = getTableStats(formula.id);
                const formulaTables = tables.filter(t => t.formule_id === formula.id);
                
                return (
                  <Card key={formula.id} className="overflow-hidden">
                    {/* Photo */}
                    <div className="relative h-40 bg-muted">
                      {formula.photo_url ? (
                        <img src={formula.photo_url} alt={formula.nom} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-lg">Aucune photo</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-foreground">
                          {formula.nb_personnes} pers.
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Info */}
                      <div>
                        <h3 className="font-semibold text-foreground">{formula.nom}</h3>
                        <p className="text-lg font-bold text-primary">
                          {formula.prix_dzd.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">DA</span>
                        </p>
                      </div>

                      {/* Tags */}
                      {formula.tags && formula.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {formula.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats bar */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-2">
                          <p className="text-xl font-bold text-emerald-600">{stats.libre}</p>
                          <p className="text-xs text-muted-foreground">Libres</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2">
                          <p className="text-xl font-bold text-amber-600">{stats.occupee}</p>
                          <p className="text-xs text-muted-foreground">Occupées</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg py-2">
                          <p className="text-xl font-bold text-rose-600">{stats.reservee}</p>
                          <p className="text-xs text-muted-foreground">Réservées</p>
                        </div>
                      </div>

                      {/* Tables list */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Tables ({stats.total})</p>
                        {formulaTables.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Aucune table</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {formulaTables.map(table => (
                              <div key={table.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">{table.nom_ou_numero}</span>
                                  <span className={`text-xs ${getStatusColor(table.statut)}`}>
                                    {getStatusLabel(table.statut)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {table.statut === 'libre' ? (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => updateTableStatus(table.id, 'occupee')}
                                    >
                                      <Lock className="w-3 h-3" />
                                      Occuper
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => updateTableStatus(table.id, 'libre')}
                                    >
                                      <LockOpen className="w-3 h-3" />
                                      Libérer
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer cette table ?</AlertDialogTitle>
                                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteTable(table.id)} className="bg-destructive">
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => openFormulaDialog(formula)}
                        >
                          <Pencil className="w-4 h-4" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer "{formula.nom}" ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Toutes les tables associées seront supprimées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFormula(formula.id)} className="bg-destructive">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <Button 
                        className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => openAddTablesDialog(formula)}
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter tables
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Table</th>
                    <th className="text-left p-4 font-medium">Formule</th>
                    <th className="text-left p-4 font-medium">Capacité</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(table => {
                    const formula = formulas.find(f => f.id === table.formule_id);
                    return (
                      <tr key={table.id} className="border-t">
                        <td className="p-4 font-medium">{table.nom_ou_numero}</td>
                        <td className="p-4 text-muted-foreground">{formula?.nom || '-'}</td>
                        <td className="p-4">{table.capacite} pers.</td>
                        <td className="p-4">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              table.statut === 'libre' ? 'bg-emerald-100 text-emerald-700' :
                              table.statut === 'occupee' ? 'bg-amber-100 text-amber-700' :
                              table.statut === 'reservee' ? 'bg-rose-100 text-rose-700' :
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {getStatusLabel(table.statut)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {table.statut === 'libre' ? (
                              <Button size="sm" variant="ghost" onClick={() => updateTableStatus(table.id, 'occupee')}>
                                Occuper
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => updateTableStatus(table.id, 'libre')}>
                                Libérer
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => updateTableStatus(table.id, 'reservee')}>
                              Réserver
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteTable(table.id)} className="bg-destructive">
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {tables.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Aucune table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Formula Dialog */}
      <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFormula ? 'Modifier' : 'Nouvelle'} formule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
                {formulaForm.photo_url ? (
                  <img src={formulaForm.photo_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-sm">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? 'Envoi...' : 'Changer'}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input 
                  value={formulaForm.nom} 
                  onChange={(e) => setFormulaForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Essentielle"
                />
              </div>
              <div className="space-y-2">
                <Label>Prix (DA)</Label>
                <Input 
                  type="number"
                  value={formulaForm.prix_dzd} 
                  onChange={(e) => setFormulaForm(p => ({ ...p, prix_dzd: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre de personnes</Label>
              <Input 
                type="number"
                value={formulaForm.nb_personnes} 
                onChange={(e) => setFormulaForm(p => ({ ...p, nb_personnes: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formulaForm.description_courte} 
                onChange={(e) => setFormulaForm(p => ({ ...p, description_courte: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={formulaForm.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormulaDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveFormula}>{editingFormula ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tables Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des tables à "{addingTablesForFormula?.nom}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de tables à ajouter</Label>
              <Input 
                type="number"
                min="1"
                max="50"
                value={tableCount} 
                onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Les tables seront numérotées automatiquement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Annuler</Button>
            <Button onClick={addTables} className="bg-emerald-500 hover:bg-emerald-600">
              Ajouter {tableCount} table(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
