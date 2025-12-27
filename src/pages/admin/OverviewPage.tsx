import { useOutletContext } from "react-router-dom";
import { StatsCards } from "@/components/admin/StatsCards";
import { RevenueStats } from "@/components/admin/RevenueStats";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { ReservationsChart } from "@/components/admin/ReservationsChart";
import { FormulasPieChart } from "@/components/admin/FormulasPieChart";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { isToday, parseISO } from "date-fns";

interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
}

export default function OverviewPage() {
  const { reservations, messages } = useOutletContext<AdminContextData>();

  const pendingCount = reservations.filter(
    (r) => r.statut === "en_attente" || !r.statut
  ).length;
  const confirmedCount = reservations.filter((r) => r.statut === "confirmee").length;
  const unreadMessages = messages.filter((m) => !m.lu).length;
  const todayReservations = reservations.filter((r) => 
    isToday(parseISO(r.created_at))
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vue d'ensemble</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre tableau de bord
        </p>
      </div>

      {/* Revenue Stats */}
      <RevenueStats reservations={reservations} />

      {/* Stats Cards */}
      <StatsCards
        totalReservations={reservations.length}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        unreadMessages={unreadMessages}
        todayReservations={todayReservations}
      />

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart reservations={reservations} />
        <FormulasPieChart reservations={reservations} />
      </div>

      {/* Reservations Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReservationsChart reservations={reservations} />
      </div>

      {/* Recent Activity */}
      <RecentActivity reservations={reservations} messages={messages} />
    </div>
  );
}
