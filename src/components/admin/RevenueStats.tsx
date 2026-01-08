import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign, Wallet } from "lucide-react";
import { isToday, parseISO, startOfWeek, isAfter } from "date-fns";

interface RevenueStatsProps {
  reservations: any[];
}

export function RevenueStats({ reservations }: RevenueStatsProps) {
  // Only count reservations with payment_status = 'paid_cash' or 'paid'
  const paidReservations = reservations.filter(
    (r) => r.payment_status === "paid_cash" || r.payment_status === "paid"
  );

  // Calculate total revenue from total_price field
  const totalRevenue = paidReservations.reduce((sum, r) => {
    return sum + (r.total_price || 0);
  }, 0);

  // Today's revenue
  const todayRevenue = paidReservations
    .filter((r) => {
      const paidAt = r.paid_at ? parseISO(r.paid_at) : null;
      return paidAt && isToday(paidAt);
    })
    .reduce((sum, r) => sum + (r.total_price || 0), 0);

  // This week's revenue
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyRevenue = paidReservations
    .filter((r) => {
      const paidAt = r.paid_at ? parseISO(r.paid_at) : null;
      return paidAt && isAfter(paidAt, weekStart);
    })
    .reduce((sum, r) => sum + (r.total_price || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " DA";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Today's Revenue */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aujourd'hui
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(todayRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paidReservations.filter(r => r.paid_at && isToday(parseISO(r.paid_at))).length} paiements cash
          </p>
        </CardContent>
      </Card>

      {/* Weekly Revenue */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cette semaine
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(weeklyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Depuis lundi
          </p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenu total
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
            {paidReservations.length} paiements reçus
          </p>
        </CardContent>
      </Card>

      {/* Average */}
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
            {paidReservations.length > 0
              ? formatCurrency(totalRevenue / paidReservations.length)
              : formatCurrency(0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Par réservation payée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
