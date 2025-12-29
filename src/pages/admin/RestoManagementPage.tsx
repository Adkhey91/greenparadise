import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Check,
  X,
  Upload,
  Table as TableIcon
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type RestoCategorie = 'entrees' | 'plats' | 'desserts' | 'boissons';

interface MenuItem {
  id: string;
  nom: string;
  description: string | null;
  prix_dzd: number;
  categorie: RestoCategorie;
  photo_url: string | null;
  photo_filename: string | null;
  allergenes: string[] | null;
  disponible: boolean;
  stock: number | null;
  ordre: number;
}

interface RestoTable {
  id: string;
  numero: number;
  capacite: number;
  statut: string;
}

interface RestoReservation {
  id: string;
  table_id: string;
  nom: string;
  telephone: string;
  email: string | null;
  date_reservation: string;
  heure: string;
  nombre_personnes: number;
  statut: string;
  montant_dzd: number;
  mode_paiement: string | null;
  created_at: string;
  resto_tables?: { numero: number };
}

const CATEGORIES: { value: RestoCategorie; label: string }[] = [
  { value: 'entrees', label: 'Entrées' },
  { value: 'plats', label: 'Plats' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'boissons', label: 'Boissons' },
];

export default function RestoManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestoTable[]>([]);
  const [reservations, setReservations] = useState<RestoReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  // Form states
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    nom: '',
    description: '',
    prix_dzd: 0,
    categorie: 'plats' as RestoCategorie,
    allergenes: '',
    disponible: true,
    stock: null as number | null
  });
  const [tableForm, setTableForm] = useState({ numero: 1, capacite: 4 });
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    
    // Realtime for tables
    const channel = supabase
      .channel('admin-resto-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resto_tables' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resto_reservations' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, tablesRes, reservationsRes] = await Promise.all([
        supabase.from('resto_menu_items').select('*').order('ordre'),
        supabase.from('resto_tables').select('*').order('numero'),
        supabase.from('resto_reservations').select('*, resto_tables(numero)').order('created_at', { ascending: false })
      ]);

      if (menuRes.data) setMenuItems(menuRes.data as MenuItem[]);
      if (tablesRes.data) setTables(tablesRes.data);
      if (reservationsRes.data) setReservations(reservationsRes.data as RestoReservation[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const todayReservations = reservations.filter(r => 
    r.date_reservation === format(new Date(), 'yyyy-MM-dd')
  );
  const tablesLibres = tables.filter(t => t.statut === 'libre').length;
  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const revenueToday = todayReservations.reduce((sum, r) => sum + (r.montant_dzd || 0), 0);
  const revenueWeek = reservations
    .filter(r => new Date(r.date_reservation) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, r) => sum + (r.montant_dzd || 0), 0);

  // Menu CRUD
  const handleSaveMenuItem = async () => {
    setUploading(true);
    try {
      let photo_url = editingItem?.photo_url || null;
      let photo_filename = editingItem?.photo_filename || null;

      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const filename = `menu-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('resto-photos')
          .upload(filename, photoFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('resto-photos').getPublicUrl(filename);
        photo_url = urlData.publicUrl;
        photo_filename = filename;
      }

      const data = {
        nom: menuForm.nom,
        description: menuForm.description || null,
        prix_dzd: menuForm.prix_dzd,
        categorie: menuForm.categorie,
        allergenes: menuForm.allergenes ? menuForm.allergenes.split(',').map(a => a.trim()) : [],
        disponible: menuForm.disponible,
        stock: menuForm.stock,
        photo_url,
        photo_filename
      };

      if (editingItem) {
        await supabase.from('resto_menu_items').update(data).eq('id', editingItem.id);
        toast({ title: "Plat modifié" });
      } else {
        await supabase.from('resto_menu_items').insert(data);
        toast({ title: "Plat ajouté" });
      }

      setIsMenuDialogOpen(false);
      setEditingItem(null);
      setPhotoFile(null);
      setMenuForm({ nom: '', description: '', prix_dzd: 0, categorie: 'plats', allergenes: '', disponible: true, stock: null });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    await supabase.from('resto_menu_items').delete().eq('id', id);
    toast({ title: "Plat supprimé" });
    fetchData();
  };

  const openEditMenu = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      nom: item.nom,
      description: item.description || '',
      prix_dzd: item.prix_dzd,
      categorie: item.categorie,
      allergenes: item.allergenes?.join(', ') || '',
      disponible: item.disponible,
      stock: item.stock
    });
    setIsMenuDialogOpen(true);
  };

  // Table CRUD
  const handleAddTable = async () => {
    try {
      await supabase.from('resto_tables').insert({
        numero: tableForm.numero,
        capacite: tableForm.capacite
      });
      toast({ title: "Table ajoutée" });
      setIsTableDialogOpen(false);
      setTableForm({ numero: tables.length + 1, capacite: 4 });
      fetchData();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Supprimer cette table ?")) return;
    await supabase.from('resto_tables').delete().eq('id', id);
    toast({ title: "Table supprimée" });
    fetchData();
  };

  const handleTableStatus = async (id: string, statut: string) => {
    await supabase.from('resto_tables').update({ statut }).eq('id', id);
    toast({ title: `Table ${statut}` });
    fetchData();
  };

  // Reservation actions
  const handleReservationStatus = async (id: string, statut: string, tableId?: string) => {
    await supabase.from('resto_reservations').update({ statut }).eq('id', id);
    
    if (statut === 'confirmee' && tableId) {
      await supabase.from('resto_tables').update({ statut: 'reservee' }).eq('id', tableId);
    } else if (statut === 'annulee' && tableId) {
      await supabase.from('resto_tables').update({ statut: 'libre' }).eq('id', tableId);
    }
    
    toast({ title: `Réservation ${statut}` });
    fetchData();
  };

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'libre': 'bg-green-100 text-green-800',
      'occupee': 'bg-red-100 text-red-800',
      'reservee': 'bg-amber-100 text-amber-800',
      'hs': 'bg-gray-100 text-gray-800',
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'confirmee': 'bg-green-100 text-green-800',
      'annulee': 'bg-red-100 text-red-800',
      'terminee': 'bg-blue-100 text-blue-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8" />
              Gestion Restaurant
            </h1>
            <p className="text-white/80 mt-1">Dashboard et gestion complète</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isMenuDialogOpen} onOpenChange={(o) => { setIsMenuDialogOpen(o); if(!o) { setEditingItem(null); setPhotoFile(null); } }}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" /> Ajouter Plat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un plat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input value={menuForm.nom} onChange={e => setMenuForm({...menuForm, nom: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prix (DA) *</Label>
                      <Input type="number" value={menuForm.prix_dzd} onChange={e => setMenuForm({...menuForm, prix_dzd: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie *</Label>
                      <Select value={menuForm.categorie} onValueChange={v => setMenuForm({...menuForm, categorie: v as RestoCategorie})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Allergènes (séparés par virgule)</Label>
                    <Input placeholder="gluten, lactose..." value={menuForm.allergenes} onChange={e => setMenuForm({...menuForm, allergenes: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo</Label>
                    <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={menuForm.disponible} onCheckedChange={v => setMenuForm({...menuForm, disponible: v})} />
                      <Label>Disponible</Label>
                    </div>
                    <div className="flex-1">
                      <Input type="number" placeholder="Stock (optionnel)" value={menuForm.stock || ''} onChange={e => setMenuForm({...menuForm, stock: e.target.value ? parseInt(e.target.value) : null})} />
                    </div>
                  </div>
                  <Button onClick={handleSaveMenuItem} disabled={uploading || !menuForm.nom} className="w-full">
                    {uploading ? 'Envoi...' : (editingItem ? 'Modifier' : 'Ajouter')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/20 text-white border-white/30 gap-2">
                  <Plus className="w-4 h-4" /> Ajouter Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Ajouter une table</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Numéro</Label>
                      <Input type="number" value={tableForm.numero} onChange={e => setTableForm({...tableForm, numero: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacité</Label>
                      <Input type="number" value={tableForm.capacite} onChange={e => setTableForm({...tableForm, capacite: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <Button onClick={handleAddTable} className="w-full">Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Jour</p>
                <p className="text-2xl font-bold">{revenueToday.toLocaleString()} DA</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Semaine</p>
                <p className="text-2xl font-bold">{revenueWeek.toLocaleString()} DA</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tables Libres</p>
                <p className="text-2xl font-bold text-green-600">{tablesLibres}</p>
              </div>
              <TableIcon className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tables Occupées</p>
                <p className="text-2xl font-bold text-red-600">{tablesOccupees}</p>
              </div>
              <Users className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Réservations Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                {todayReservations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Aucune réservation aujourd'hui</p>
                ) : (
                  <div className="space-y-3">
                    {todayReservations.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{r.nom}</p>
                          <p className="text-sm text-muted-foreground">{r.heure} - Table {r.resto_tables?.numero}</p>
                        </div>
                        <Badge className={getStatusBadge(r.statut)}>{r.statut}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Plats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuItems.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">{i + 1}</span>
                      <span className="flex-1">{item.nom}</span>
                      <span className="text-muted-foreground">{item.prix_dzd} DA</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => (
                  <div key={table.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">#{table.numero}</span>
                      <Badge className={getStatusBadge(table.statut)}>{table.statut}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{table.capacite} personnes</p>
                    <div className="flex flex-wrap gap-1">
                      {table.statut !== 'libre' && (
                        <Button size="sm" variant="outline" onClick={() => handleTableStatus(table.id, 'libre')}>Libérer</Button>
                      )}
                      {table.statut === 'libre' && (
                        <Button size="sm" variant="outline" onClick={() => handleTableStatus(table.id, 'occupee')}>Occuper</Button>
                      )}
                      {table.statut !== 'hs' && (
                        <Button size="sm" variant="outline" onClick={() => handleTableStatus(table.id, 'hs')}>H.S.</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTable(table.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="h-32 bg-muted flex items-center justify-center">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.nom} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{item.nom}</h3>
                      <Badge variant="outline" className="mt-1">{CATEGORIES.find(c => c.value === item.categorie)?.label}</Badge>
                    </div>
                    <span className="font-bold text-primary">{item.prix_dzd} DA</span>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge className={item.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {item.disponible ? 'Disponible' : 'Indisponible'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditMenu(item)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteMenuItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {reservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune réservation</p>
                ) : (
                  reservations.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">{r.nom}</span>
                          <Badge className={getStatusBadge(r.statut)}>{r.statut}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(r.date_reservation), 'dd/MM/yyyy', { locale: fr })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.heure}</span>
                          <span className="flex items-center gap-1"><TableIcon className="w-3 h-3" /> Table {r.resto_tables?.numero}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {r.nombre_personnes}p</span>
                          <span>{r.telephone}</span>
                        </div>
                      </div>
                      {r.statut === 'en_attente' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => handleReservationStatus(r.id, 'confirmee', r.table_id)}>
                            <Check className="w-4 h-4" /> Confirmer
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReservationStatus(r.id, 'annulee', r.table_id)}>
                            <X className="w-4 h-4" /> Annuler
                          </Button>
                        </div>
                      )}
                      {r.statut === 'confirmee' && (
                        <Button size="sm" variant="outline" onClick={() => handleReservationStatus(r.id, 'terminee', r.table_id)}>
                          Terminer
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}