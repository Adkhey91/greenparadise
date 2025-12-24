import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: "reservation" | "message";
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, "id" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
    };
    
    setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
    
    // Afficher un toast
    toast.success(notification.title, {
      description: notification.description,
      duration: 5000,
    });
  }, []);

  // Écouter les nouvelles réservations en temps réel
  useEffect(() => {
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservations",
        },
        (payload) => {
          const reservation = payload.new as any;
          addNotification({
            type: "reservation",
            title: "Nouvelle réservation",
            description: `Réservation pour ${reservation.nom} - Formule ${reservation.formule}€`,
            time: new Date(),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages_contact",
        },
        (payload) => {
          const message = payload.new as any;
          addNotification({
            type: "message",
            title: "Nouveau message",
            description: `Message de ${message.nom}`,
            time: new Date(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const displayCount = unreadNotifications > 0 ? unreadNotifications : unreadCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive animate-pulse"
            >
              {displayCount > 9 ? "9+" : displayCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadNotifications > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification récente</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === "reservation"
                          ? "bg-primary"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(notification.time, "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
