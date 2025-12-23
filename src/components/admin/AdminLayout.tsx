import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Loader2 } from "lucide-react";
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.lu).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <AdminHeader
          userEmail={user?.email || ""}
          unreadCount={unreadCount}
          onSignOut={handleSignOut}
        />
        
        <main className="p-6">
          <Outlet context={{ reservations, messages, loading: loadingData, refetch: fetchData }} />
        </main>
      </div>
    </div>
  );
}
