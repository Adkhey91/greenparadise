import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Reservation {
  id: string;
  created_at: string;
  date_reservation: string;
  statut: string | null;
}

interface ReservationsChartProps {
  reservations: Reservation[];
}

export function ReservationsChart({ reservations }: ReservationsChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(today, 13 - i);
      return {
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "dd/MM", { locale: fr }),
        count: 0,
      };
    });

    reservations.forEach((res) => {
      const resDate = format(startOfDay(parseISO(res.created_at)), "yyyy-MM-dd");
      const dayData = last14Days.find((d) => d.date === resDate);
      if (dayData) {
        dayData.count += 1;
      }
    });

    return last14Days;
  }, [reservations]);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Réservations (14 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(122, 86%, 16%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(122, 86%, 16%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Réservations"
                stroke="hsl(122, 86%, 16%)"
                strokeWidth={2}
                fill="url(#colorReservations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
