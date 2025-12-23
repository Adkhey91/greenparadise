import { 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Users 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "warning" | "success" | "primary";
}

function StatCard({ title, value, subtitle, icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card",
    warning: "bg-yellow-500/5 border-yellow-500/20",
    success: "bg-green-500/5 border-green-500/20",
    primary: "bg-primary/5 border-primary/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    warning: "bg-yellow-500/10 text-yellow-600",
    success: "bg-green-500/10 text-green-600",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <Card className={cn("border transition-all duration-300 hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{value}</span>
              {trend && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}>
                  <TrendingUp className={cn("h-3 w-3", !trend.positive && "rotate-180")} />
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  unreadMessages: number;
  todayReservations?: number;
}

export function StatsCards({ 
  totalReservations, 
  pendingCount, 
  confirmedCount, 
  unreadMessages,
  todayReservations = 0
}: StatsCardsProps) {
  const confirmationRate = totalReservations > 0 
    ? Math.round((confirmedCount / totalReservations) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Réservations totales"
        value={totalReservations}
        subtitle={`${todayReservations} aujourd'hui`}
        icon={<Calendar className="h-5 w-5" />}
        variant="primary"
      />
      <StatCard
        title="En attente"
        value={pendingCount}
        subtitle="À confirmer"
        icon={<Clock className="h-5 w-5" />}
        variant="warning"
      />
      <StatCard
        title="Taux de confirmation"
        value={`${confirmationRate}%`}
        subtitle={`${confirmedCount} confirmées`}
        icon={<CheckCircle2 className="h-5 w-5" />}
        variant="success"
      />
      <StatCard
        title="Messages non lus"
        value={unreadMessages}
        subtitle="En attente de réponse"
        icon={<MessageSquare className="h-5 w-5" />}
        variant={unreadMessages > 0 ? "primary" : "default"}
      />
    </div>
  );
}
