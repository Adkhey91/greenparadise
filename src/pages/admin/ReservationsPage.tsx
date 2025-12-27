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
  Send
} from "lucide-react";
import { format, parseISO } from "date-fns";
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
  const [sendingSms, setSendingSms] = useState<string | null>(null);

  const confirmReservation = async (reservation: any) => {
    setSendingSms(reservation.id);
    
    // Update status to confirmed
    const { error } = await supabase
      .from("reservations")
      .update({ statut: "confirmee" })
      .eq("id", reservation.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la réservation",
        variant: "destructive",
      });
      setSendingSms(null);
      return;
    }

    // Try to send SMS
    try {
      const response = await supabase.functions.invoke('send-sms', {
        body: {
          to: reservation.telephone,
          message: `Votre réservation au parc Green Paradise est confirmée pour le ${format(parseISO(reservation.date_reservation), "dd MMMM yyyy", { locale: fr })}. Formule: ${reservation.formule}. Merci de votre confiance !`,
          reservationId: reservation.id
        }
      });

      if (response.error) {
        console.warn('SMS not sent:', response.error);
        toast({
          title: "Réservation confirmée",
          description: "SMS non envoyé (service SMS non configuré)",
        });
      } else {
        toast({
          title: "Réservation confirmée",
          description: "SMS de confirmation envoyé au client",
        });
      }
    } catch (smsError) {
      console.warn('SMS service not available:', smsError);
      toast({
        title: "Réservation confirmée",
        description: "Le client sera notifié manuellement",
      });
    }

    setSendingSms(null);
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
    const headers = ["Date", "Nom", "Téléphone", "Email", "Formule", "Personnes", "Statut"];
    const rows = filteredReservations.map((r) => [
      format(parseISO(r.date_reservation), "dd/MM/yyyy"),
      r.nom,
      r.telephone,
      r.email || "",
      r.formule,
      r.nombre_personnes || "",
      r.statut || "en_attente",
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
      (r.email && r.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || (r.statut || "en_attente") === statusFilter;
    const matchesFormula = formulaFilter === "all" || r.formule === formulaFilter;

    return matchesSearch && matchesStatus && matchesFormula;
  });

  const pendingCount = reservations.filter(r => !r.statut || r.statut === "en_attente").length;
  const confirmedCount = reservations.filter(r => r.statut === "confirmee").length;
  const cancelledCount = reservations.filter(r => r.statut === "annulee").length;

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case "confirmee":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <Check className="w-3 h-3 mr-1" />
            Confirmée
          </Badge>
        );
      case "annulee":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Annulée
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
          <h1 className="text-2xl font-bold text-foreground">Réservations</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de réservation
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{cancelledCount}</p>
            <p className="text-sm text-muted-foreground">Annulées</p>
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
                placeholder="Rechercher par nom, téléphone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="confirmee">Confirmée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
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
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Formule</TableHead>
                    <TableHead className="font-semibold text-center">Pers.</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((res) => (
                    <TableRow key={res.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">
                          {format(parseISO(res.date_reservation), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Créée le {format(parseISO(res.created_at), "dd/MM à HH:mm", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{res.nom}</span>
                        {res.message && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate max-w-32">{res.message}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <a
                            href={`tel:${res.telephone}`}
                            className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            {res.telephone}
                          </a>
                          {res.email && (
                            <a
                              href={`mailto:${res.email}`}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Mail className="h-3 w-3" />
                              {res.email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {res.formule}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{res.nombre_personnes || "-"}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(res.statut)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Confirm button */}
                          {(!res.statut || res.statut === "en_attente") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => confirmReservation(res)}
                              disabled={sendingSms === res.id}
                            >
                              {sendingSms === res.id ? (
                                <Send className="h-3 w-3 animate-pulse" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Confirmer
                            </Button>
                          )}

                          {/* Cancel button */}
                          {(!res.statut || res.statut === "en_attente") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cancelReservation(res.id)}
                            >
                              <XCircle className="h-3 w-3" />
                              Annuler
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
