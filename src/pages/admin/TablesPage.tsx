import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Grid3X3,
  Plus,
  Edit,
  Trash2,
  Users,
  TreePine,
  UtensilsCrossed,
  Loader2
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface ParkTable {
  id: string;
  nom_ou_numero: string;
  capacite: number;
  statut: string;
  formule_id: string;
  venue_id: string | null;
}

interface Venue {
  id: string;
  code: string;
  name: string;
}

export default function TablesPage() {
  const { toast } = useToast();
  const [tables, setTables] = useState<ParkTable[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterVenue, setFilterVenue] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<ParkTable | null>(null);
  const [formData, setFormData] = useState({
    nom_ou_numero: "",
    capacite: 4,
    venue_id: "",
    statut: "libre"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tablesResult, venuesResult] = await Promise.all([
      supabase.from("park_tables").select("*").order("nom_ou_numero"),
      supabase.from("venues").select("*")
    ]);

    if (tablesResult.data) setTables(tablesResult.data);
    if (venuesResult.data) setVenues(venuesResult.data);
    setLoading(false);
  };

  const handleOpenDialog = (table?: ParkTable) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        nom_ou_numero: table.nom_ou_numero,
        capacite: table.capacite,
        venue_id: table.venue_id || "",
        statut: table.statut
      });
    } else {
      setEditingTable(null);
      setFormData({
        nom_ou_numero: "",
        capacite: 4,
        venue_id: venues.find(v => v.code === "GARDEN")?.id || "",
        statut: "libre"
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom_ou_numero || !formData.venue_id) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    // Get a default formula_id for the venue
    const { data: formulas } = await supabase
      .from("formulas")
      .select("id")
      .eq("venue_id", formData.venue_id)
      .limit(1);

    const formulaId = formulas?.[0]?.id || "";

    if (editingTable) {
      const { error } = await supabase
        .from("park_tables")
        .update({
          nom_ou_numero: formData.nom_ou_numero,
          capacite: formData.capacite,
          venue_id: formData.venue_id,
          statut: formData.statut
        })
        .eq("id", editingTable.id);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Table modifiée ✓" });
      }
    } else {
      const { error } = await supabase
        .from("park_tables")
        .insert({
          nom_ou_numero: formData.nom_ou_numero,
          capacite: formData.capacite,
          venue_id: formData.venue_id,
          statut: formData.statut,
          formule_id: formulaId
        });

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Table créée ✓" });
      }
    }

    setProcessing(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (tableId: string) => {
    const { error } = await supabase
      .from("park_tables")
      .delete()
      .eq("id", tableId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Table supprimée ✓" });
      fetchData();
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    const { error } = await supabase
      .from("park_tables")
      .update({ statut: newStatus })
      .eq("id", tableId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut mis à jour ✓" });
      fetchData();
    }
  };

  const getVenueInfo = (venueId: string | null) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return { name: "Inconnu", icon: Grid3X3, color: "bg-gray-100 text-gray-700" };
    if (venue.code === "GARDEN") return { name: "Jardin", icon: TreePine, color: "bg-emerald-100 text-emerald-700" };
    return { name: "Restaurant", icon: UtensilsCrossed, color: "bg-amber-100 text-amber-700" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "libre":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Libre</Badge>;
      case "reservee":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Réservée</Badge>;
      case "occupee":
        return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">Occupée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter tables
  const filteredTables = tables.filter(table => {
    if (filterVenue !== "all" && table.venue_id !== filterVenue) return false;
    if (filterStatus !== "all" && table.statut !== filterStatus) return false;
    return true;
  });

  // Stats
  const stats = {
    total: tables.length,
    libre: tables.filter(t => t.statut === "libre").length,
    reservee: tables.filter(t => t.statut === "reservee").length,
    occupee: tables.filter(t => t.statut === "occupee").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Tables</h1>
          <p className="text-muted-foreground">
            Gérez les tables du jardin et du restaurant
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Nouvelle table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? "Modifier la table" : "Nouvelle table"}</DialogTitle>
              <DialogDescription>
                {editingTable ? "Modifiez les informations de la table" : "Ajoutez une nouvelle table"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom / Numéro *</Label>
                <Input
                  value={formData.nom_ou_numero}
                  onChange={(e) => setFormData({ ...formData, nom_ou_numero: e.target.value })}
                  placeholder="Ex: Table 1, A-01..."
                />
              </div>
              <div className="space-y-2">
                <Label>Capacité (personnes) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lieu *</Label>
                <Select
                  value={formData.venue_id}
                  onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="libre">Libre</SelectItem>
                    <SelectItem value="reservee">Réservée</SelectItem>
                    <SelectItem value="occupee">Occupée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTable ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Grid3X3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.libre}</p>
                <p className="text-xs text-muted-foreground">Libres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Grid3X3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.reservee}</p>
                <p className="text-xs text-muted-foreground">Réservées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Grid3X3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.occupee}</p>
                <p className="text-xs text-muted-foreground">Occupées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Lieu</Label>
              <Select value={filterVenue} onValueChange={setFilterVenue}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="reservee">Réservée</SelectItem>
                  <SelectItem value="occupee">Occupée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const venueInfo = getVenueInfo(table.venue_id);
          const VenueIcon = venueInfo.icon;

          return (
            <Card key={table.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${venueInfo.color}`}>
                      <VenueIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{table.nom_ou_numero}</p>
                      <p className="text-xs text-muted-foreground">{venueInfo.name}</p>
                    </div>
                  </div>
                  {getStatusBadge(table.statut)}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <Users className="h-4 w-4" />
                  <span>{table.capacite} personnes</span>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={table.statut}
                    onValueChange={(value) => handleStatusChange(table.id, value)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="libre">Libre</SelectItem>
                      <SelectItem value="reservee">Réservée</SelectItem>
                      <SelectItem value="occupee">Occupée</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenDialog(table)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la table ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer "{table.nom_ou_numero}" ?
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(table.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Grid3X3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune table trouvée</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une table
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
