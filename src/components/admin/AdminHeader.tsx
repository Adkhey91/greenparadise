import { LogOut, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";

interface AdminHeaderProps {
  userEmail: string;
  unreadCount: number;
  onSignOut: () => void;
  onSearch?: (query: string) => void;
}

export function AdminHeader({ userEmail, unreadCount, onSignOut, onSearch }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-card/80 backdrop-blur-sm border-b sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications with Realtime */}
        <NotificationBell unreadCount={unreadCount} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden md:inline text-sm font-medium max-w-[150px] truncate">
                {userEmail}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
