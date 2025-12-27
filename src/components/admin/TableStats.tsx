import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Users
} from "lucide-react";

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
}

interface TableStatsProps {
  tables: Table[];
  formulas: Formula[];
}

export function TableStats({ tables, formulas }: TableStatsProps) {
  const stats = useMemo(() => {
    const total = tables.length;
    const libre = tables.filter(t => t.statut === 'libre').length;
    const reservee = tables.filter(t => t.statut === 'reservee').length;
    const horsService = tables.filter(t => t.statut === 'hors_service').length;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacite, 0);
    const availableCapacity = tables
      .filter(t => t.statut === 'libre')
      .reduce((sum, t) => sum + t.capacite, 0);
    
    const occupancyRate = total > 0 ? Math.round((reservee / total) * 100) : 0;
    
    return { total, libre, reservee, horsService, totalCapacity, availableCapacity, occupancyRate };
  }, [tables]);

  const statCards = [
    {
      title: "Total Tables",
      value: stats.total,
      icon: LayoutGrid,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Disponibles",
      value: stats.libre,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      badge: stats.total > 0 ? `${Math.round((stats.libre / stats.total) * 100)}%` : "0%"
    },
    {
      title: "Réservées",
      value: stats.reservee,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      badge: `${stats.occupancyRate}%`
    },
    {
      title: "Hors Service",
      value: stats.horsService,
      icon: XCircle,
      gradient: "from-red-500 to-rose-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Capacité Dispo",
      value: stats.availableCapacity,
      subtitle: `/ ${stats.totalCapacity} places`,
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Taux Occupation",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-violet-500",
      bgColor: "bg-indigo-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.bgColor} border-0 overflow-hidden`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              {stat.badge && (
                <Badge variant="secondary" className="text-xs">
                  {stat.badge}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
