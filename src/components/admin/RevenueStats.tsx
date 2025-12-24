import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

// Prix par formule (en euros)
const FORMULA_PRICES: Record<string, number> = {
  "500": 500,
  "1000": 1000,
  "1500": 1500,
  "3000": 3000,
  "5000": 5000,
};

interface RevenueStatsProps {
  reservations: any[];
}

export function RevenueStats({ reservations }: RevenueStatsProps) {
  // Calculer le revenu total
  const totalRevenue = reservations
    .filter((r) => r.statut === "confirmee")
    .reduce((sum, r) => {
      const price = FORMULA_PRICES[r.formule] || 0;
      return sum + price;
    }, 0);

  // Calculer le revenu du mois en cours
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyRevenue = reservations
    .filter((r) => {
      if (r.statut !== "confirmee") return false;
      const createdAt = new Date(r.created_at);
      return createdAt >= startOfMonth;
    })
    .reduce((sum, r) => {
      const price = FORMULA_PRICES[r.formule] || 0;
      return sum + price;
    }, 0);

  // Nombre de réservations confirmées ce mois
  const monthlyConfirmed = reservations.filter((r) => {
    if (r.statut !== "confirmee") return false;
    const createdAt = new Date(r.created_at);
    return createdAt >= startOfMonth;
  }).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Chiffre d'affaires total */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Chiffre d'affaires total
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {reservations.filter((r) => r.statut === "confirmee").length} réservations confirmées
          </p>
        </CardContent>
      </Card>

      {/* Revenu du mois */}
      <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenu du mois
          </CardTitle>
          <div className="p-2 rounded-lg bg-secondary/20">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(monthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthlyConfirmed} réservations ce mois
          </p>
        </CardContent>
      </Card>

      {/* Croissance */}
      <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Panier moyen
          </CardTitle>
          <div className="p-2 rounded-lg bg-accent/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {reservations.filter((r) => r.statut === "confirmee").length > 0
              ? formatCurrency(
                  totalRevenue /
                    reservations.filter((r) => r.statut === "confirmee").length
                )
              : formatCurrency(0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Par réservation confirmée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
