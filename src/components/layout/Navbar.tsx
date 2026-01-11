import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, TreePine, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getThemeFromPath } from "@/hooks/useTheme";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/resto", label: "Le Repère" },
  { href: "/lounge", label: "Lounge" },
  { href: "/reservation", label: "Réserver" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const theme = getThemeFromPath(location.pathname);
  const isChalet = theme === "chalet";

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-colors",
      isChalet 
        ? "bg-chalet-cream/90 border-chalet-beige" 
        : "bg-background/80 border-border"
    )}>
      <nav className="container mx-auto container-padding">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isChalet ? "bg-chalet-charcoal" : "nature-gradient"
            )}>
              <TreePine className={cn(
                "w-6 h-6",
                isChalet ? "text-chalet-cream" : "text-primary-foreground"
              )} />
            </div>
            <span className={cn(
              "font-semibold text-lg transition-colors",
              isChalet 
                ? "text-chalet-charcoal group-hover:text-chalet-gold" 
                : "text-foreground group-hover:text-primary"
            )}>
              Green Paradise
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? isChalet 
                      ? "bg-chalet-charcoal text-chalet-cream"
                      : "bg-primary text-primary-foreground"
                    : isChalet
                      ? "text-chalet-warm hover:text-chalet-charcoal hover:bg-chalet-beige/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className={cn(
                "gap-2",
                isChalet && "border-chalet-beige hover:bg-chalet-beige/50 text-chalet-charcoal"
              )}
            >
              <Link to="/mon-ticket">
                <Ticket className="w-4 h-4" />
                Mon Ticket
              </Link>
            </Button>
            <Button 
              size="default" 
              asChild
              className={cn(
                isChalet 
                  ? "bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream"
                  : "nature-gradient text-primary-foreground hover:opacity-90"
              )}
            >
              <Link to="/reservation">Réserver</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "lg:hidden p-2 rounded-xl transition-colors",
              isChalet ? "hover:bg-chalet-beige/50" : "hover:bg-muted"
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={cn("w-6 h-6", isChalet ? "text-chalet-charcoal" : "text-foreground")} />
            ) : (
              <Menu className={cn("w-6 h-6", isChalet ? "text-chalet-charcoal" : "text-foreground")} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-[500px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-2 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? isChalet 
                      ? "bg-chalet-charcoal text-chalet-cream"
                      : "bg-primary text-primary-foreground"
                    : isChalet
                      ? "text-chalet-warm hover:text-chalet-charcoal hover:bg-chalet-beige/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                className={cn(
                  "flex-1 gap-2",
                  isChalet && "border-chalet-beige hover:bg-chalet-beige/50 text-chalet-charcoal"
                )} 
                asChild
              >
                 <Link to="/mon-ticket" onClick={() => setIsOpen(false)}>
                   <Ticket className="w-4 h-4" />
                   Mon Ticket
                 </Link>
              </Button>
            </div>
            <Button 
              size="lg" 
              className={cn(
                "mt-2",
                isChalet 
                  ? "bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream"
                  : "nature-gradient text-primary-foreground"
              )} 
              asChild
            >
              <Link to="/reservation" onClick={() => setIsOpen(false)}>
                Réserver une table
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
