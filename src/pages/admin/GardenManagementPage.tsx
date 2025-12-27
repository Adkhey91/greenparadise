import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Upload,
  Table as TableIcon,
  Users,
  Check,
  X,
  Clock,
  Wrench,
  RefreshCw
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

const AVAILABLE_TAGS = ['wifi', 'jeu', 'espace-vert', 'piscine', 'ombre', 'vue', 'familial', 'romantique', 'groupe'];

const STATUS_CONFIG = {
  libre: { label: 'Libre', color: 'bg-emerald-500', icon: Check },
  occupee: { label: 'Occupée', color: 'bg-red-500', icon: X },
  reservee: { label: 'Réservée', color: 'bg-amber-500', icon: Clock },
  hors_service: { label: 'Hors service', color: 'bg-gray-500', icon: Wrench },
};

export default function GardenManagementPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [tables, setTables] = useState<ParkTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  
  // Formula form state
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [formulaForm, setFormulaForm] = useState({
    nom: '',
    description_courte: '',
    prix_dzd: 0,
    nb_personnes: 1,
    tags: [] as string[],
    actif: true,
    photo_url: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Table form state
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [bulkTableDialogOpen, setBulkTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<ParkTable | null>(null);
  const [tableForm, setTableForm] = useState({
    nom_ou_numero: '',
    capacite: 4,
  });
  const [bulkTableForm, setBulkTableForm] = useState({
    prefix: 'Table',
    start: 1,
    count: 5,
    capacite: 4,
  });

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates for tables
    const channel = supabase
      .channel('park-tables-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_tables' },
        () => fetchTables()
      )
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
    const { data, error } = await supabase
      .from('formulas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Erreur lors du chargement des formules');
      console.error(error);
      return;
    }
    setFormulas(data || []);
  };

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('park_tables')
      .select('*')
      .order('nom_ou_numero', { ascending: true });
    
    if (error) {
      toast.error('Erreur lors du chargement des tables');
      console.error(error);
      return;
    }
    setTables((data || []) as ParkTable[]);
  };

  // Formula CRUD operations
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
      setFormulaForm({
        nom: '',
        description_courte: '',
        prix_dzd: 0,
        nb_personnes: 1,
        tags: [],
        actif: true,
        photo_url: '',
      });
    }
    setFormulaDialogOpen(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5 Mo)');
      return;
    }

    setUploadingPhoto(true);
    const filename = `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('formula-photos')
      .upload(filename, file);

    if (error) {
      toast.error('Erreur lors du téléversement de la photo');
      console.error(error);
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('formula-photos')
      .getPublicUrl(filename);

    setFormulaForm(prev => ({
      ...prev,
      photo_url: urlData.publicUrl,
    }));
    setUploadingPhoto(false);
    toast.success('Photo téléversée avec succès');
  };

  const saveFormula = async () => {
    if (!formulaForm.nom.trim()) {
      toast.error('Le nom de la formule est requis');
      return;
    }

    const formulaData = {
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
      const { error } = await supabase
        .from('formulas')
        .update(formulaData)
        .eq('id', editingFormula.id);

      if (error) {
        toast.error('Erreur lors de la modification');
        console.error(error);
        return;
      }
      toast.success('Formule modifiée avec succès');
    } else {
      const { error } = await supabase
        .from('formulas')
        .insert([formulaData]);

      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
        return;
      }
      toast.success('Formule créée avec succès');
    }

    setFormulaDialogOpen(false);
    fetchFormulas();
  };

  const deleteFormula = async (id: string) => {
    const { error } = await supabase
      .from('formulas')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return;
    }
    toast.success('Formule supprimée avec succès');
    if (selectedFormula?.id === id) {
      setSelectedFormula(null);
    }
    fetchFormulas();
  };

  const toggleTag = (tag: string) => {
    setFormulaForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // Table CRUD operations
  const openTableDialog = (table?: ParkTable) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        nom_ou_numero: table.nom_ou_numero,
        capacite: table.capacite,
      });
    } else {
      setEditingTable(null);
      setTableForm({
        nom_ou_numero: '',
        capacite: 4,
      });
    }
    setTableDialogOpen(true);
  };

  const saveTable = async () => {
    if (!selectedFormula) {
      toast.error('Sélectionnez d\'abord une formule');
      return;
    }

    if (!tableForm.nom_ou_numero.trim()) {
      toast.error('Le nom/numéro de la table est requis');
      return;
    }

    const tableData = {
      formule_id: selectedFormula.id,
      nom_ou_numero: tableForm.nom_ou_numero.trim(),
      capacite: tableForm.capacite,
    };

    if (editingTable) {
      const { error } = await supabase
        .from('park_tables')
        .update(tableData)
        .eq('id', editingTable.id);

      if (error) {
        toast.error('Erreur lors de la modification');
        console.error(error);
        return;
      }
      toast.success('Table modifiée avec succès');
    } else {
      const { error } = await supabase
        .from('park_tables')
        .insert([{ ...tableData, statut: 'libre' }]);

      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
        return;
      }
      toast.success('Table créée avec succès');
    }

    setTableDialogOpen(false);
    fetchTables();
  };

  const addBulkTables = async () => {
    if (!selectedFormula) {
      toast.error('Sélectionnez d\'abord une formule');
      return;
    }

    const tablesToInsert = [];
    for (let i = 0; i < bulkTableForm.count; i++) {
      tablesToInsert.push({
        formule_id: selectedFormula.id,
        nom_ou_numero: `${bulkTableForm.prefix} n°${bulkTableForm.start + i}`,
        capacite: bulkTableForm.capacite,
        statut: 'libre',
      });
    }

    const { error } = await supabase
      .from('park_tables')
      .insert(tablesToInsert);

    if (error) {
      toast.error('Erreur lors de la création des tables');
      console.error(error);
      return;
    }

    toast.success(`${bulkTableForm.count} tables créées avec succès`);
    setBulkTableDialogOpen(false);
    fetchTables();
  };

  const updateTableStatus = async (tableId: string, newStatus: ParkTable['statut']) => {
    const { error } = await supabase
      .from('park_tables')
      .update({ statut: newStatus })
      .eq('id', tableId);

    if (error) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error(error);
      return;
    }
    toast.success('Statut mis à jour');
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase
      .from('park_tables')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return;
    }
    toast.success('Table supprimée');
    fetchTables();
  };

  // Get tables for selected formula
  const selectedFormulaTables = selectedFormula
    ? tables.filter(t => t.formule_id === selectedFormula.id)
    : [];

  // Get table counts per formula
  const getTableCounts = (formulaId: string) => {
    const formulaTables = tables.filter(t => t.formule_id === formulaId);
    return {
      total: formulaTables.length,
      libre: formulaTables.filter(t => t.statut === 'libre').length,
      occupee: formulaTables.filter(t => t.statut === 'occupee').length,
      reservee: formulaTables.filter(t => t.statut === 'reservee').length,
      hors_service: formulaTables.filter(t => t.statut === 'hors_service').length,
    };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du Jardin</h1>
          <p className="text-muted-foreground">Gérez vos formules et tables de jardin</p>
        </div>
        <Button onClick={() => openFormulaDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle formule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulas list */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg">Formules</h2>
          {formulas.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Aucune formule. Créez-en une !
            </Card>
          ) : (
            formulas.map(formula => {
              const counts = getTableCounts(formula.id);
              const isSelected = selectedFormula?.id === formula.id;
              
              return (
                <Card 
                  key={formula.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${!formula.actif ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedFormula(formula)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {formula.photo_url ? (
                        <img 
                          src={formula.photo_url} 
                          alt={formula.nom}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{formula.nom}</h3>
                          {!formula.actif && (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formula.prix_dzd.toLocaleString()} DZD · {formula.nb_personnes} pers.
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {counts.libre}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {counts.reservee}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <X className="w-3 h-3 text-red-500" />
                            {counts.occupee}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFormulaDialog(formula);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette formule ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Toutes les tables associées seront également supprimées. Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFormula(formula.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Tables management */}
        <div className="lg:col-span-2">
          {selectedFormula ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5" />
                    Tables - {selectedFormula.nom}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedFormulaTables.length} table(s) au total
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkTableDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter plusieurs
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openTableDialog()}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une table
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedFormulaTables.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune table pour cette formule</p>
                    <p className="text-sm">Ajoutez des tables pour commencer</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedFormulaTables.map(table => {
                      const status = STATUS_CONFIG[table.statut];
                      const StatusIcon = status.icon;
                      
                      return (
                        <div 
                          key={table.id}
                          className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{table.nom_ou_numero}</span>
                            <div className="flex gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => openTableDialog(table)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-7 w-7"
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cette table ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTable(table.id)}>
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {table.capacite} personnes
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                            <span className="text-sm font-medium">{status.label}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {table.statut !== 'libre' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => updateTableStatus(table.id, 'libre')}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Libérer
                              </Button>
                            )}
                            {table.statut !== 'occupee' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => updateTableStatus(table.id, 'occupee')}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Occuper
                              </Button>
                            )}
                            {table.statut !== 'reservee' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => updateTableStatus(table.id, 'reservee')}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Réserver
                              </Button>
                            )}
                            {table.statut !== 'hors_service' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => updateTableStatus(table.id, 'hors_service')}
                              >
                                <Wrench className="w-3 h-3 mr-1" />
                                H.S.
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Sélectionnez une formule pour gérer ses tables</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Formula Dialog */}
      <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormula ? 'Modifier la formule' : 'Nouvelle formule'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la formule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formulaForm.nom}
                onChange={(e) => setFormulaForm(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Table Premium VIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description courte</Label>
              <Textarea
                id="description"
                value={formulaForm.description_courte}
                onChange={(e) => setFormulaForm(prev => ({ ...prev, description_courte: e.target.value }))}
                placeholder="Une description attrayante..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix">Prix (DZD)</Label>
                <Input
                  id="prix"
                  type="number"
                  min="0"
                  value={formulaForm.prix_dzd}
                  onChange={(e) => setFormulaForm(prev => ({ ...prev, prix_dzd: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personnes">Nombre de personnes</Label>
                <Input
                  id="personnes"
                  type="number"
                  min="1"
                  value={formulaForm.nb_personnes}
                  onChange={(e) => setFormulaForm(prev => ({ ...prev, nb_personnes: parseInt(e.target.value) || 1 }))}
                />
              </div>
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

            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={formulaForm.photo_url}
                    onChange={(e) => setFormulaForm(prev => ({ ...prev, photo_url: e.target.value }))}
                    placeholder="URL de l'image ou téléversez un fichier"
                    className="flex-1"
                  />
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingPhoto}
                    />
                    <Button variant="outline" disabled={uploadingPhoto}>
                      {uploadingPhoto ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {formulaForm.photo_url && (
                  <img 
                    src={formulaForm.photo_url} 
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="actif"
                checked={formulaForm.actif}
                onCheckedChange={(checked) => setFormulaForm(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif">Formule active (visible sur le site)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormulaDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveFormula}>
              {editingFormula ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? 'Modifier la table' : 'Nouvelle table'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table_nom">Nom / Numéro</Label>
              <Input
                id="table_nom"
                value={tableForm.nom_ou_numero}
                onChange={(e) => setTableForm(prev => ({ ...prev, nom_ou_numero: e.target.value }))}
                placeholder="Ex: Table n°1, Zone A, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table_capacite">Capacité (personnes)</Label>
              <Input
                id="table_capacite"
                type="number"
                min="1"
                value={tableForm.capacite}
                onChange={(e) => setTableForm(prev => ({ ...prev, capacite: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveTable}>
              {editingTable ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Table Dialog */}
      <Dialog open={bulkTableDialogOpen} onOpenChange={setBulkTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter plusieurs tables</DialogTitle>
            <DialogDescription>
              Générer plusieurs tables à la fois
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Préfixe</Label>
              <Input
                id="prefix"
                value={bulkTableForm.prefix}
                onChange={(e) => setBulkTableForm(prev => ({ ...prev, prefix: e.target.value }))}
                placeholder="Ex: Table, Zone A, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Numéro de départ</Label>
                <Input
                  id="start"
                  type="number"
                  min="1"
                  value={bulkTableForm.start}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Nombre de tables</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={bulkTableForm.count}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk_capacite">Capacité par table</Label>
              <Input
                id="bulk_capacite"
                type="number"
                min="1"
                value={bulkTableForm.capacite}
                onChange={(e) => setBulkTableForm(prev => ({ ...prev, capacite: parseInt(e.target.value) || 4 }))}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              Aperçu : {bulkTableForm.prefix} n°{bulkTableForm.start} à {bulkTableForm.prefix} n°{bulkTableForm.start + bulkTableForm.count - 1}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTableDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addBulkTables}>
              Créer {bulkTableForm.count} tables
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
