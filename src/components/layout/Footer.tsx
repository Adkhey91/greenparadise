import { Link } from "react-router-dom";
import { TreePine, MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto container-padding py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <TreePine className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Green Paradise</span>
            </Link>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Plateau Lalla Setti, Tlemcen, Algérie. Un espace de détente au cœur de la nature.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold">Navigation</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                Accueil
              </Link>
              <Link to="/plan-tables" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                Plan des Tables
              </Link>
              <Link to="/reservation" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                Réservation
              </Link>
              <Link to="/galerie" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                Galerie
              </Link>
              <Link to="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Plateau Lalla Setti, Tlemcen</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+213 XX XX XX XX</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>contact@placeholder.com</span>
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold">Suivez-nous</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Green Paradise. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
