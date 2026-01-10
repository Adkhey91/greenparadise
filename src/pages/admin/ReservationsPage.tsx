import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Download,
  Filter,
  Phone,
  CheckCircle,
  XCircle,
  QrCode,
  LogIn,
  Wallet,
  TreePine,
  UtensilsCrossed
} from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface Venue {
  id: string;
  code: string;
  name: string;
}

interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export default function ReservationsPage() {
  const { reservations, refetch } = useOutletContext<AdminContextData>();
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [formulaFilter, setFormulaFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    const { data } = await supabase.from('venues').select('*').eq('is_reservable', true);
    if (data) setVenues(data);
  };

  const confirmReservation = async (reservation: any) => {
    setProcessing(reservation.id);
    
    // Determine venue code from reservation number
    const venueCode = reservation.reservation_number?.startsWith("RPR-") ? "RESTAURANT" : "GARDEN";
    
    // Get venue ID
    const { data: venueData } = await supabase
      .from("venues")
      .select("id")
      .eq("code", venueCode)
      .single();
    
    let assignedTableId: string | null = null;
    let assignedTableNumber: string | null = null;
    
    if (venueData) {
      // Find an available table (best fit: smallest table that fits the party)
      const partySize = reservation.nombre_personnes || 1;
      
      const { data: availableTables } = await supabase
        .from("park_tables")
        .select("*")
        .eq("venue_id", venueData.id)
        .eq("statut", "libre")
        .gte("capacite", partySize)
        .order("capacite", { ascending: true })
        .limit(1);
      
      if (availableTables && availableTables.length > 0) {
        const table = availableTables[0];
        assignedTableId = table.id;
        assignedTableNumber = table.nom_ou_numero;
        
        // Mark table as reserved
        await supabase
          .from("park_tables")
          .update({ statut: "reservee" })
          .eq("id", table.id);
      }
    }
    
    // Update reservation
    const updateData: any = { 
      statut: "confirmee",
      confirmed_at: new Date().toISOString()
    };
    
    if (assignedTableId) {
      updateData.table_id = assignedTableId;
      updateData.table_number_snapshot = assignedTableNumber;
    }
    
    const { error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservation.id);

    setProcessing(null);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la réservation",
        variant: "destructive",
      });
      return;
    }

    const tableMessage = assignedTableNumber 
      ? `Table ${assignedTableNumber} assignée` 
      : "Pas de table dispo, à assigner manuellement";

    toast({
      title: "Réservation confirmée ✓",
      description: `${reservation.nom} - ${tableMessage}`,
    });

    await refetch();
  };

  const cancelReservation = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ statut: "annulee" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive",
      });
    } else {
      await refetch();
      toast({
        title: "Réservation annulée",
        description: "Le statut a été mis à jour",
      });
    }
  };

  const markNoShow = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ statut: "no_show" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour",
        variant: "destructive",
      });
    } else {
      await refetch();
      toast({ title: "Marqué comme non présenté" });
    }
  };

  const deleteReservation = async (id: string) => {
    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation",
        variant: "destructive",
      });
    } else {
      await refetch();
      toast({ title: "Réservation supprimée" });
    }
  };

  const exportCSV = () => {
    const headers = ["N° Réservation", "Lieu", "Date", "Nom", "Téléphone", "Email", "Formule", "Personnes", "Statut", "Paiement"];
    const rows = filteredReservations.map((r) => {
      const venue = venues.find(v => v.id === r.venue_id);
      return [
        r.reservation_number || "",
        venue?.name || "Jardin",
        format(parseISO(r.date_reservation), "dd/MM/yyyy"),
        r.nom,
        r.telephone,
        r.email || "",
        r.formule,
        r.nombre_personnes || "",
        r.statut || "en_attente",
        r.payment_status || "unpaid",
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const formulas = [...new Set(reservations.map((r) => r.formule))];

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.nom.toLowerCase().includes(search.toLowerCase()) ||
      r.telephone.includes(search) ||
      (r.email && r.email.toLowerCase().includes(search.toLowerCase())) ||
      (r.reservation_number && r.reservation_number.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || (r.statut || "en_attente") === statusFilter;
    const matchesFormula = formulaFilter === "all" || r.formule === formulaFilter;
    const matchesVenue = venueFilter === "all" || r.venue_id === venueFilter;

    return matchesSearch && matchesStatus && matchesFormula && matchesVenue;
  });

  // Stats by venue
  const getVenueStats = (venueId?: string) => {
    const filtered = venueId ? reservations.filter(r => r.venue_id === venueId) : reservations;
    return {
      total: filtered.length,
      pending: filtered.filter(r => !r.statut || r.statut === "en_attente").length,
      confirmed: filtered.filter(r => r.statut === "confirmee").length,
      checkedIn: filtered.filter(r => r.statut === "checked_in").length,
      paid: filtered.filter(r => r.payment_status === "paid_cash").length,
    };
  };

  const allStats = getVenueStats();
  const gardenVenue = venues.find(v => v.code === 'GARDEN');
  const restoVenue = venues.find(v => v.code === 'RESTAURANT');
  const gardenStats = gardenVenue ? getVenueStats(gardenVenue.id) : { total: 0, pending: 0, confirmed: 0, checkedIn: 0, paid: 0 };
  const restoStats = restoVenue ? getVenueStats(restoVenue.id) : { total: 0, pending: 0, confirmed: 0, checkedIn: 0, paid: 0 };

  const getStatusBadge = (reservation: any) => {
    const statut = reservation.statut;
    
    switch (statut) {
      case "confirmee":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <Check className="w-3 h-3 mr-1" />
            Confirmée
          </Badge>
        );
      case "checked_in":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
            <LogIn className="w-3 h-3 mr-1" />
            Entrée validée
          </Badge>
        );
      case "annulee":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        );
      case "no_show":
        return (
          <Badge className="bg-gray-500/10 text-gray-700 border-gray-200">
            <X className="w-3 h-3 mr-1" />
            Non présenté
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  const getVenueBadge = (venueId: string | null) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return null;
    
    if (venue.code === 'RESTAURANT') {
      return (
        <Badge variant="outline" className="gap-1 bg-chalet-gold/10 text-chalet-charcoal border-chalet-gold/30">
          <UtensilsCrossed className="w-3 h-3" />
          Resto
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
        <TreePine className="w-3 h-3" />
        Jardin
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Toutes les Réservations</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de réservation Jardin & Restaurant
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats by Venue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* All */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Toutes</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold">{allStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{allStats.pending}</p>
                <p className="text-xs text-muted-foreground">Attente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{allStats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmées</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{allStats.paid}</p>
                <p className="text-xs text-muted-foreground">Payées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jardin */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TreePine className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium">Jardin</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold">{gardenStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{gardenStats.pending}</p>
                <p className="text-xs text-muted-foreground">Attente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{gardenStats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmées</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{gardenStats.paid}</p>
                <p className="text-xs text-muted-foreground">Payées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant */}
        <Card className="bg-gradient-to-br from-chalet-cream to-chalet-beige/50 border-chalet-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-chalet-gold/10">
                <UtensilsCrossed className="w-5 h-5 text-chalet-gold" />
              </div>
              <span className="font-medium">Le Repère</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold">{restoStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{restoStats.pending}</p>
                <p className="text-xs text-muted-foreground">Attente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{restoStats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmées</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{restoStats.paid}</p>
                <p className="text-xs text-muted-foreground">Payées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone, n° réservation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={venueFilter} onValueChange={setVenueFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Lieu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les lieux</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="confirmee">Confirmée</SelectItem>
                <SelectItem value="checked_in">Entrée validée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
                <SelectItem value="no_show">Non présenté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formulaFilter} onValueChange={setFormulaFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Formule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les formules</SelectItem>
                {formulas.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">N° Résa</TableHead>
                    <TableHead className="font-semibold">Lieu</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Formule</TableHead>
                    <TableHead className="font-semibold text-center">Prix</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Paiement</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((res) => (
                    <TableRow key={res.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-mono font-bold text-primary">
                          {res.reservation_number || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVenueBadge(res.venue_id)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {format(parseISO(res.date_reservation), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(res.created_at), "dd/MM à HH:mm", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-medium">{res.nom}</span>
                          <a
                            href={`tel:${res.telephone}`}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            {res.telephone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {res.formule}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {res.nombre_personnes || "-"} pers.
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {res.total_price?.toLocaleString() || "-"} DA
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(res)}
                      </TableCell>
                      <TableCell>
                        {res.payment_status === "paid_cash" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                            <Wallet className="w-3 h-3 mr-1" />
                            Payé cash
                          </Badge>
                        ) : (
                          <Badge variant="outline">Non payé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Confirm button - only for pending */}
                          {(!res.statut || res.statut === "en_attente") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => confirmReservation(res)}
                              disabled={processing === res.id}
                            >
                              {processing === res.id ? (
                                <QrCode className="h-3 w-3 animate-pulse" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Confirmer
                            </Button>
                          )}

                          {/* Cancel button - for pending or confirmed */}
                          {(res.statut === "en_attente" || res.statut === "confirmee" || !res.statut) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cancelReservation(res.id)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}

                          {/* No-show button - for confirmed reservations of today */}
                          {res.statut === "confirmee" && isToday(parseISO(res.date_reservation)) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => markNoShow(res.id)}
                            >
                              No-show
                            </Button>
                          )}

                          {/* Delete button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la réservation ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. La réservation de {res.nom} sera supprimée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReservation(res.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
