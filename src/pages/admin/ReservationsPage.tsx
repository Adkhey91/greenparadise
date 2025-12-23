import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Mail
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

  const updateStatus = async (id: string, statut: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ statut })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } else {
      await refetch();
      toast({
        title: "Statut mis à jour",
        description: `Réservation marquée comme "${statut}"`,
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

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case "confirmee":
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20">
            <Check className="w-3 h-3 mr-1" />
            Confirmée
          </Badge>
        );
      case "annulee":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20">
            <X className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200 hover:bg-yellow-500/20">
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
            {filteredReservations.length} réservation(s) trouvée(s)
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
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
                        <Select
                          value={res.statut || "en_attente"}
                          onValueChange={(value) => updateStatus(res.id, value)}
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_attente">
                              <span className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-yellow-600" />
                                En attente
                              </span>
                            </SelectItem>
                            <SelectItem value="confirmee">
                              <span className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-600" />
                                Confirmée
                              </span>
                            </SelectItem>
                            <SelectItem value="annulee">
                              <span className="flex items-center gap-2">
                                <X className="h-3 w-3 text-red-600" />
                                Annulée
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
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
