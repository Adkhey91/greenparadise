import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays, startOfDay, parseISO, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface RevenueChartProps {
  reservations: any[];
}

export function RevenueChart({ reservations }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = new Date();

    // Only count paid reservations
    const paidReservations = reservations.filter(
      (r) => r.payment_status === "paid_cash" || r.payment_status === "paid"
    );

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));

      // Calculate revenue for the day based on paid_at date
      const dayRevenue = paidReservations
        .filter((r) => {
          if (!r.paid_at) return false;
          const paidAt = parseISO(r.paid_at);
          return isSameDay(paidAt, date);
        })
        .reduce((sum, r) => sum + (r.total_price || 0), 0);

      data.push({
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "dd MMM", { locale: fr }),
        revenue: dayRevenue,
      });
    }

    return data;
  }, [reservations]);

  const totalPeriod = chartData.reduce((sum, d) => sum + d.revenue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value) + " DA";
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Revenus (paiements cash)
            </CardTitle>
            <CardDescription>
              30 derniers jours
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalPeriod)}
            </p>
            <p className="text-xs text-muted-foreground">Total période</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(122, 86%, 16%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(122, 86%, 16%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{payload[0].payload.label}</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(122, 86%, 16%)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
