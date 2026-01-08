import { useState } from "react";
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
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  QrCode,
  LogIn,
  Wallet
} from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export default function ReservationsPage() {
  const { reservations, refetch } = useOutletContext<AdminContextData>();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formulaFilter, setFormulaFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const confirmReservation = async (reservation: any) => {
    setProcessing(reservation.id);
    
    const { error } = await supabase
      .from("reservations")
      .update({ 
        statut: "confirmee",
        confirmed_at: new Date().toISOString()
      })
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

    toast({
      title: "Réservation confirmée ✓",
      description: `${reservation.nom} - Le ticket QR est maintenant disponible`,
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
    const headers = ["N° Réservation", "Date", "Nom", "Téléphone", "Email", "Formule", "Personnes", "Statut", "Paiement"];
    const rows = filteredReservations.map((r) => [
      r.reservation_number || "",
      format(parseISO(r.date_reservation), "dd/MM/yyyy"),
      r.nom,
      r.telephone,
      r.email || "",
      r.formule,
      r.nombre_personnes || "",
      r.statut || "en_attente",
      r.payment_status || "unpaid",
    ]);

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

    return matchesSearch && matchesStatus && matchesFormula;
  });

  const pendingCount = reservations.filter(r => !r.statut || r.statut === "en_attente").length;
  const confirmedCount = reservations.filter(r => r.statut === "confirmee").length;
  const checkedInCount = reservations.filter(r => r.statut === "checked_in").length;
  const paidCount = reservations.filter(r => r.payment_status === "paid_cash").length;

  const getStatusBadge = (reservation: any) => {
    const statut = reservation.statut;
    const isPaid = reservation.payment_status === "paid_cash";
    
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Réservations Jardin</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de réservation et confirmez les tickets
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{confirmedCount}</p>
            <p className="text-sm text-muted-foreground">Confirmées</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{checkedInCount}</p>
            <p className="text-sm text-muted-foreground">Entrées validées</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{paidCount}</p>
            <p className="text-sm text-muted-foreground">Payés cash</p>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
                                  Cette action est irréversible. La réservation de {res.nom} sera
                                  définitivement supprimée.
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
