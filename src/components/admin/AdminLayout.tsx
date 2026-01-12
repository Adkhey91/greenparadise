import { useState, useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Loader2, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [resResult, msgResult] = await Promise.all([
        supabase.from("reservations").select("*").order("created_at", { ascending: false }),
        supabase.from("messages_contact").select("*").order("created_at", { ascending: false }),
      ]);

      if (resResult.data) setReservations(resResult.data);
      if (msgResult.data) setMessages(msgResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user || !isAdmin) return;

    const resChannel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => fetchData()
      )
      .subscribe();

    const msgChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages_contact" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  // Compute counts for sidebar badges
  const counts = useMemo(() => {
    // Garden reservations pending (GRN- prefix or no venue_id matching garden)
    const gardenPending = reservations.filter(r => {
      const isGarden = r.reservation_number?.startsWith("GRN-");
      const isPending = r.statut === "en_attente" || !r.statut;
      return isGarden && isPending;
    }).length;

    // Restaurant reservations pending (RPR- prefix)
    const restoPending = reservations.filter(r => {
      const isResto = r.reservation_number?.startsWith("RPR-");
      const isPending = r.statut === "en_attente" || !r.statut;
      return isResto && isPending;
    }).length;

    const unreadMessages = messages.filter(m => !m.lu).length;

    return { gardenPending, restoPending, unreadMessages };
  }, [reservations, messages]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl nature-gradient flex items-center justify-center animate-pulse">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground font-medium">Chargement du panneau admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        gardenPendingCount={counts.gardenPending}
        restoPendingCount={counts.restoPending}
        unreadMessagesCount={counts.unreadMessages}
      />
      
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "ml-[68px]" : "ml-64"
      )}>
        <AdminHeader
          userEmail={user?.email || ""}
          unreadCount={counts.unreadMessages}
          onSignOut={handleSignOut}
        />
        
        <main className="p-6">
          <Outlet context={{ reservations, messages, loading: loadingData, refetch: fetchData }} />
        </main>
      </div>
    </div>
  );
}
