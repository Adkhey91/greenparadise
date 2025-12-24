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
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Prix par formule (en euros)
const FORMULA_PRICES: Record<string, number> = {
  "500": 500,
  "1000": 1000,
  "1500": 1500,
  "3000": 3000,
  "5000": 5000,
};

interface RevenueChartProps {
  reservations: any[];
}

export function RevenueChart({ reservations }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const dateStr = format(date, "yyyy-MM-dd");

      // Calculer le revenu du jour (réservations confirmées)
      const dayRevenue = reservations
        .filter((r) => {
          if (r.statut !== "confirmee") return false;
          const createdAt = format(startOfDay(parseISO(r.created_at)), "yyyy-MM-dd");
          return createdAt === dateStr;
        })
        .reduce((sum, r) => {
          const price = FORMULA_PRICES[r.formule] || 0;
          return sum + price;
        }, 0);

      data.push({
        date: dateStr,
        label: format(date, "dd MMM", { locale: fr }),
        revenue: dayRevenue,
      });
    }

    return data;
  }, [reservations]);

  const totalPeriod = chartData.reduce((sum, d) => sum + d.revenue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Évolution des revenus
            </CardTitle>
            <CardDescription>
              Revenus des 30 derniers jours
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
                tickFormatter={(value) => `${value}€`}
                width={60}
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
