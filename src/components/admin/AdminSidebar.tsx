import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Settings,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Trees,
  UtensilsCrossed,
  QrCode,
  UserPlus,
  Grid3X3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  gardenPendingCount?: number;
  restoPendingCount?: number;
  unreadMessagesCount?: number;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  badge?: number;
  variant?: "garden" | "resto" | "default";
}

export function AdminSidebar({ 
  collapsed, 
  onToggle, 
  gardenPendingCount = 0,
  restoPendingCount = 0,
  unreadMessagesCount = 0
}: AdminSidebarProps) {
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { to: "/admin", icon: LayoutDashboard, label: "Vue d'ensemble", end: true },
  ];

  const gardenNavItems: NavItem[] = [
    { to: "/admin/garden", icon: Trees, label: "Jardin", variant: "garden" },
    { to: "/admin/reservations", icon: Calendar, label: "Réservations", badge: gardenPendingCount, variant: "garden" },
  ];

  const restoNavItems: NavItem[] = [
    { to: "/admin/resto", icon: UtensilsCrossed, label: "Restaurant", variant: "resto" },
  ];

  const operationsNavItems: NavItem[] = [
    { to: "/admin/checkin", icon: QrCode, label: "Check-in" },
    { to: "/admin/walkin", icon: UserPlus, label: "Walk-in" },
    { to: "/admin/tables", icon: Grid3X3, label: "Tables" },
  ];

  const systemNavItems: NavItem[] = [
    { to: "/admin/content", icon: Leaf, label: "Contenu" },
    { to: "/admin/messages", icon: MessageSquare, label: "Messages", badge: unreadMessagesCount },
    { to: "/admin/settings", icon: Settings, label: "Paramètres" },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = item.end 
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
    
    const getBgClass = () => {
      if (!isActive) return "hover:bg-muted/60";
      switch (item.variant) {
        case "garden": return "bg-emerald-600 text-white shadow-md shadow-emerald-500/20";
        case "resto": return "bg-amber-600 text-white shadow-md shadow-amber-500/20";
        default: return "bg-primary text-primary-foreground shadow-md";
      }
    };

    const getBadgeClass = () => {
      switch (item.variant) {
        case "garden": return "bg-emerald-500 text-white";
        case "resto": return "bg-amber-500 text-white";
        default: return "bg-destructive text-destructive-foreground";
      }
    };

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          getBgClass(),
          !isActive && "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn(
          "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
          isActive && "text-current"
        )} />
        {!collapsed && (
          <>
            <span className="font-medium text-sm whitespace-nowrap flex-1">
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge className={cn(
                "h-5 min-w-5 px-1.5 text-xs font-bold",
                isActive ? "bg-white/20 text-current" : getBadgeClass()
              )}>
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </>
        )}
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center",
            getBadgeClass()
          )}>
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const renderSection = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && !collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {title}
        </p>
      )}
      {items.map(renderNavItem)}
    </div>
  );

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card/95 backdrop-blur-sm border-r border-border/50 transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0 shadow-md">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-foreground whitespace-nowrap block text-sm">
                Green Paradise
              </span>
              <span className="text-[10px] text-muted-foreground">
                Admin Panel
              </span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="flex-shrink-0 h-8 w-8 hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {renderSection(mainNavItems)}
        
        {!collapsed && <Separator className="my-2 opacity-50" />}
        
        {renderSection(gardenNavItems, "Jardin")}
        
        {!collapsed && <Separator className="my-2 opacity-50" />}
        
        {renderSection(restoNavItems, "Restaurant")}
        
        {!collapsed && <Separator className="my-2 opacity-50" />}
        
        {renderSection(operationsNavItems, "Opérations")}
        
        {!collapsed && <Separator className="my-2 opacity-50" />}
        
        {renderSection(systemNavItems, "Système")}
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="p-3 border-t border-border/50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                En ligne
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              v2.0 • Realtime activé
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
