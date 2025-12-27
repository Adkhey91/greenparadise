import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCards } from "@/components/admin/StatsCards";
import { RevenueStats } from "@/components/admin/RevenueStats";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { ReservationsChart } from "@/components/admin/ReservationsChart";
import { FormulasPieChart } from "@/components/admin/FormulasPieChart";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { TableStats } from "@/components/admin/TableStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isToday, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calendar,
  Users,
  Sparkles
} from "lucide-react";

interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
}

interface Table {
  id: string;
  nom_ou_numero: string;
  capacite: number;
  statut: string;
  formule_id: string;
}

interface Formula {
  id: string;
  nom: string;
  prix_dzd: number;
}

export default function OverviewPage() {
  const { reservations, messages } = useOutletContext<AdminContextData>();
  const [tables, setTables] = useState<Table[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);

  useEffect(() => {
    fetchTablesAndFormulas();
    
    // Real-time subscription for tables
    const tablesChannel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'park_tables' },
        () => {
          fetchTablesAndFormulas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  const fetchTablesAndFormulas = async () => {
    const [tablesRes, formulasRes] = await Promise.all([
      supabase.from('park_tables').select('*'),
      supabase.from('formulas').select('id, nom, prix_dzd').eq('actif', true)
    ]);
    
    if (tablesRes.data) setTables(tablesRes.data as Table[]);
    if (formulasRes.data) setFormulas(formulasRes.data as Formula[]);
  };

  const pendingCount = reservations.filter(
    (r) => r.statut === "en_attente" || !r.statut
  ).length;
  const confirmedCount = reservations.filter((r) => r.statut === "confirmee").length;
  const unreadMessages = messages.filter((m) => !m.lu).length;
  const todayReservations = reservations.filter((r) => 
    isToday(parseISO(r.created_at))
  ).length;

  // Tables stats
  const tablesLibres = tables.filter(t => t.statut === 'libre').length;
  const tablesReservees = tables.filter(t => t.statut === 'reservee').length;

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tableau de Bord</h1>
              <p className="text-white/80">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white/70">Tables disponibles</p>
              <p className="text-2xl font-bold">{tablesLibres}/{tables.length}</p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-right">
              <p className="text-sm text-white/70">Réservations aujourd'hui</p>
              <p className="text-2xl font-bold">{todayReservations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Tables en temps réel */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">État des Tables en Temps Réel</h2>
          <Badge variant="outline" className="ml-2 animate-pulse">
            Live
          </Badge>
        </div>
        <TableStats tables={tables} formulas={formulas} />
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

      {/* Charts Row */}
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
