import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Image as ImageIcon, 
  Upload,
  Table as TableIcon,
  Users,
  Check,
  X,
  Clock,
  Wrench,
  RefreshCw,
  Sparkles,
  Crown,
  Layers,
  TreePine
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
  libre: { label: 'Libre', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', icon: Check },
  occupee: { label: 'Occupée', color: 'bg-rose-500', textColor: 'text-rose-600', bgLight: 'bg-rose-50', icon: X },
  reservee: { label: 'Réservée', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50', icon: Clock },
  hors_service: { label: 'H.S.', color: 'bg-slate-400', textColor: 'text-slate-600', bgLight: 'bg-slate-50', icon: Wrench },
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
      .order('prix_dzd', { ascending: true });
    
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

  const selectedFormulaTables = selectedFormula
    ? tables.filter(t => t.formule_id === selectedFormula.id)
    : [];

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
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TreePine className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">Gestion du Jardin</h1>
          </div>
          <p className="text-white/80 text-lg">
            Gérez vos formules et tables de jardin en temps réel
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Layers className="w-5 h-5" />
              <span className="font-semibold">{formulas.length}</span>
              <span className="text-white/80">Formules</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <TableIcon className="w-5 h-5" />
              <span className="font-semibold">{tables.length}</span>
              <span className="text-white/80">Tables</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Formulas list */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Formules
            </h2>
            <Button onClick={() => openFormulaDialog()} size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              <Plus className="w-4 h-4" />
              Nouvelle
            </Button>
          </div>
          
          {formulas.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Aucune formule</p>
              <p className="text-sm text-muted-foreground mt-1">Créez votre première formule</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {formulas.map((formula, index) => {
                const counts = getTableCounts(formula.id);
                const isSelected = selectedFormula?.id === formula.id;
                const isPremium = formula.prix_dzd >= 3000;
                
                return (
                  <Card 
                    key={formula.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg group overflow-hidden ${
                      isSelected 
                        ? 'ring-2 ring-primary shadow-lg shadow-primary/20' 
                        : 'hover:-translate-y-0.5'
                    } ${!formula.actif ? 'opacity-60' : ''}`}
                    onClick={() => setSelectedFormula(formula)}
                  >
                    <div className="relative">
                      {/* Photo header */}
                      <div className="relative h-32 overflow-hidden">
                        {formula.photo_url ? (
                          <img 
                            src={formula.photo_url} 
                            alt={formula.nom}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900 dark:to-green-800 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-emerald-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Price badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className={`text-sm font-bold shadow-lg ${
                            isPremium 
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0' 
                              : 'bg-white/90 text-emerald-700 border-0'
                          }`}>
                            {formula.prix_dzd.toLocaleString()} DZD
                          </Badge>
                        </div>
                        
                        {/* Status badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {!formula.actif && (
                            <Badge variant="secondary" className="bg-slate-900/80 text-white border-0">
                              Inactif
                            </Badge>
                          )}
                          {isPremium && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 gap-1">
                              <Crown className="w-3 h-3" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        
                        {/* Title overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-bold text-white text-lg truncate drop-shadow-lg">
                            {formula.nom}
                          </h3>
                          <p className="text-white/80 text-sm flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {formula.nb_personnes} personnes
                          </p>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <CardContent className="p-4">
                        {/* Table status indicators */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium">{counts.libre}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span className="text-sm font-medium">{counts.reservee}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span className="text-sm font-medium">{counts.occupee}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {counts.total} table{counts.total > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFormulaDialog(formula);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                                <AlertDialogAction 
                                  onClick={() => deleteFormula(formula.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Tables management */}
        <div className="xl:col-span-8">
          {selectedFormula ? (
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedFormula.photo_url && (
                      <img 
                        src={selectedFormula.photo_url}
                        alt={selectedFormula.nom}
                        className="w-14 h-14 rounded-xl object-cover shadow-md"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {selectedFormula.nom}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedFormulaTables.length} table{selectedFormulaTables.length > 1 ? 's' : ''} • {selectedFormula.prix_dzd.toLocaleString()} DZD
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBulkTableDialogOpen(true)}
                      className="gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      Lot
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => openTableDialog()}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      Table
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selectedFormulaTables.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <TableIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">Aucune table</p>
                    <p className="text-sm text-muted-foreground mt-1">Ajoutez des tables pour cette formule</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedFormulaTables.map(table => {
                      const status = STATUS_CONFIG[table.statut];
                      const StatusIcon = status.icon;
                      
                      return (
                        <div 
                          key={table.id}
                          className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-lg overflow-hidden ${status.bgLight} border-transparent hover:border-primary/30`}
                        >
                          {/* Status indicator bar */}
                          <div className={`h-1 ${status.color}`} />
                          
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-foreground">{table.nom_ou_numero}</h4>
                                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                  <Users className="w-3.5 h-3.5" />
                                  <span className="text-xs">{table.capacite} pers.</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => openTableDialog(table)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-7 w-7 rounded-full text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
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
                                      <AlertDialogAction 
                                        onClick={() => deleteTable(table.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            {/* Status badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgLight} ${status.textColor} mb-3`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </div>

                            {/* Quick actions */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {table.statut !== 'libre' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400"
                                  onClick={() => updateTableStatus(table.id, 'libre')}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Libre
                                </Button>
                              )}
                              {table.statut !== 'occupee' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400"
                                  onClick={() => updateTableStatus(table.id, 'occupee')}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Occupée
                                </Button>
                              )}
                              {table.statut !== 'reservee' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400"
                                  onClick={() => updateTableStatus(table.id, 'reservee')}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Réservée
                                </Button>
                              )}
                              {table.statut !== 'hors_service' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400"
                                  onClick={() => updateTableStatus(table.id, 'hors_service')}
                                >
                                  <Wrench className="w-3 h-3 mr-1" />
                                  H.S.
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[500px] border-dashed border-2">
              <div className="text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900 dark:to-green-800 flex items-center justify-center mx-auto mb-6">
                  <TableIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xl font-medium text-muted-foreground">Sélectionnez une formule</p>
                <p className="text-sm text-muted-foreground mt-2">pour gérer ses tables</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Formula Dialog */}
      <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingFormula ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingFormula ? 'Modifier la formule' : 'Nouvelle formule'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la formule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formulaForm.nom}
                onChange={(e) => setFormulaForm(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Table Premium VIP"
                className="h-11"
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
                  className="h-11"
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
                  className="h-11"
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
                    className="cursor-pointer transition-all hover:scale-105"
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
                    placeholder="URL de l'image"
                    className="flex-1 h-11"
                  />
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingPhoto}
                    />
                    <Button variant="outline" disabled={uploadingPhoto} size="icon" className="h-11 w-11">
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
                    className="w-full h-40 object-cover rounded-xl"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
              <Switch
                id="actif"
                checked={formulaForm.actif}
                onCheckedChange={(checked) => setFormulaForm(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif" className="cursor-pointer">Formule active (visible sur le site)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormulaDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveFormula} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              {editingFormula ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
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
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacite">Capacité (personnes)</Label>
              <Input
                id="capacite"
                type="number"
                min="1"
                value={tableForm.capacite}
                onChange={(e) => setTableForm(prev => ({ ...prev, capacite: parseInt(e.target.value) || 1 }))}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveTable} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              {editingTable ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Table Dialog */}
      <Dialog open={bulkTableDialogOpen} onOpenChange={setBulkTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Ajouter plusieurs tables
            </DialogTitle>
            <DialogDescription>
              Créez plusieurs tables en une seule fois
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Préfixe</Label>
                <Input
                  id="prefix"
                  value={bulkTableForm.prefix}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, prefix: e.target.value }))}
                  placeholder="Table"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">Commencer à</Label>
                <Input
                  id="start"
                  type="number"
                  min="1"
                  value={bulkTableForm.start}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Nombre de tables</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="50"
                  value={bulkTableForm.count}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk_capacite">Capacité</Label>
                <Input
                  id="bulk_capacite"
                  type="number"
                  min="1"
                  value={bulkTableForm.capacite}
                  onChange={(e) => setBulkTableForm(prev => ({ ...prev, capacite: parseInt(e.target.value) || 1 }))}
                  className="h-11"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted text-sm">
              <p className="font-medium mb-2">Aperçu :</p>
              <p className="text-muted-foreground">
                {bulkTableForm.prefix} n°{bulkTableForm.start} → {bulkTableForm.prefix} n°{bulkTableForm.start + bulkTableForm.count - 1}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkTableDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addBulkTables} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              Créer {bulkTableForm.count} tables
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
