import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Users,
  Calendar,
  Wallet,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminContextData {
  reservations: any[];
  refetch: () => Promise<void>;
}

interface Formula {
  id: string;
  nom: string;
  prix_dzd: number;
  nb_personnes: number;
}

export default function WalkInPage() {
  const { reservations, refetch } = useOutletContext<AdminContextData>();
  const { toast } = useToast();
  
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    formule: "",
    nombrePersonnes: "",
    paidCash: false
  });

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    const { data } = await supabase
      .from('formulas')
      .select('id, nom, prix_dzd, nb_personnes')
      .eq('actif', true)
      .order('prix_dzd');
    
    if (data) setFormulas(data);
  };

  const selectedFormula = formulas.find(f => f.id === formData.formule);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.telephone || !formData.formule) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reservations").insert({
      nom: formData.nom,
      telephone: formData.telephone,
      date_reservation: format(new Date(), "yyyy-MM-dd"),
      formule: selectedFormula?.nom || "",
      nombre_personnes: formData.nombrePersonnes ? parseInt(formData.nombrePersonnes) : selectedFormula?.nb_personnes || null,
      statut: "checked_in",
      checked_in_at: new Date().toISOString(),
      payment_status: formData.paidCash ? "paid_cash" : "unpaid",
      paid_at: formData.paidCash ? new Date().toISOString() : null,
      total_price: selectedFormula?.prix_dzd || 0
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Walk-in créé ✓",
      description: `${formData.nom} - ${selectedFormula?.nom}`,
    });

    // Reset form
    setFormData({
      nom: "",
      telephone: "",
      formule: "",
      nombrePersonnes: "",
      paidCash: false
    });

    await refetch();
  };

  // Today's walk-ins
  const today = format(new Date(), "yyyy-MM-dd");
  const todayWalkIns = reservations.filter(r => 
    r.date_reservation === today && 
    r.statut === "checked_in" &&
    r.checked_in_at
  );

  const todayRevenue = todayWalkIns
    .filter(r => r.payment_status === "paid_cash")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Walk-in / Sur place</h1>
        <p className="text-muted-foreground">
          Créer une réservation pour un client arrivant sans réservation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{todayWalkIns.length}</p>
            <p className="text-sm text-muted-foreground">Walk-ins aujourd'hui</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{todayRevenue.toLocaleString()} DA</p>
            <p className="text-sm text-muted-foreground">Revenu cash du jour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Walk-in Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Nouveau Walk-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    placeholder="Nom du client"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone *</label>
                  <Input
                    placeholder="0770 XX XX XX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formule *</label>
                <Select 
                  value={formData.formule} 
                  onValueChange={(v) => setFormData({ ...formData, formule: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formule" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nom} - {f.prix_dzd.toLocaleString()} DA
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de personnes</label>
                <Select 
                  value={formData.nombrePersonnes} 
                  onValueChange={(v) => setFormData({ ...formData, nombrePersonnes: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedFormula ? `${selectedFormula.nb_personnes} (par défaut)` : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} personnes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price display */}
              {selectedFormula && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                  <span className="font-medium">{selectedFormula.nom}</span>
                  <span className="text-xl font-bold text-primary">
                    {selectedFormula.prix_dzd.toLocaleString()} DA
                  </span>
                </div>
              )}

              {/* Paid checkbox */}
              <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={formData.paidCash}
                  onChange={(e) => setFormData({ ...formData, paidCash: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Client a payé en cash</span>
                </div>
              </label>

              <Button 
                type="submit" 
                variant="nature" 
                className="w-full gap-2"
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Création..." : "Créer et valider entrée"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Today's Walk-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Walk-ins du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todayWalkIns.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Aucun walk-in aujourd'hui
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Formule</TableHead>
                    <TableHead className="text-center">Pers.</TableHead>
                    <TableHead className="text-right">Paiement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayWalkIns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.formule}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.nombre_personnes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.payment_status === "paid_cash" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700">
                            {r.total_price?.toLocaleString()} DA
                          </Badge>
                        ) : (
                          <Badge variant="outline">Non payé</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
