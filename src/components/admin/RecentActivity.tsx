import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  nom: string;
  formule: string;
  statut: string | null;
  created_at: string;
}

interface Message {
  id: string;
  nom: string;
  sujet: string | null;
  created_at: string;
  lu: boolean | null;
}

interface RecentActivityProps {
  reservations: Reservation[];
  messages: Message[];
}

type ActivityItem = {
  id: string;
  type: "reservation" | "message";
  title: string;
  subtitle: string;
  status?: string;
  timestamp: Date;
};

export function RecentActivity({ reservations, messages }: RecentActivityProps) {
  const activities: ActivityItem[] = [
    ...reservations.slice(0, 5).map((res) => ({
      id: res.id,
      type: "reservation" as const,
      title: res.nom,
      subtitle: res.formule,
      status: res.statut,
      timestamp: parseISO(res.created_at),
    })),
    ...messages.slice(0, 5).map((msg) => ({
      id: msg.id,
      type: "message" as const,
      title: msg.nom,
      subtitle: msg.sujet || "Sans sujet",
      status: msg.lu ? "lu" : "non_lu",
      timestamp: parseISO(msg.created_at),
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  const getIcon = (item: ActivityItem) => {
    if (item.type === "message") {
      return <MessageSquare className="h-4 w-4" />;
    }
    switch (item.status) {
      case "confirmee":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "annulee":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getIconBg = (item: ActivityItem) => {
    if (item.type === "message") {
      return item.status === "non_lu" ? "bg-primary/10" : "bg-muted";
    }
    switch (item.status) {
      case "confirmee":
        return "bg-green-500/10";
      case "annulee":
        return "bg-red-500/10";
      default:
        return "bg-yellow-500/10";
    }
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune activité récente
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg flex-shrink-0", getIconBg(activity))}>
                  {getIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {activity.type === "reservation" ? "Réservation" : "Message"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.subtitle}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(activity.timestamp, "dd MMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
