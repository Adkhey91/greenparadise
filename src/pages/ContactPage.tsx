import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";

export default function ContactPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
            Contact
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Une question ? N'hésitez pas à nous contacter. Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Informations de contact
                </h2>
                <p className="text-muted-foreground mb-8">
                  Venez nous rendre visite ou contactez-nous directement par téléphone ou via nos réseaux sociaux.
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Adresse</h3>
                    <p className="text-sm text-muted-foreground">
                      Plateau Lalla Setti<br />
                      Tlemcen, Algérie
                    </p>
                  </div>
                </div>

                <a 
                  href="tel:+213770840081"
                  className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-secondary/30 transition-colors block group"
                >
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Téléphone</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">0770 84 00 81</p>
                  </div>
                </a>

                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Horaires</h3>
                    <p className="text-sm text-muted-foreground">
                      Tous les jours<br />
                      9h00 - 20h00
                    </p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-4">Suivez-nous sur les réseaux</h3>
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/greenparadisetlemcen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary hover:scale-110"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61571202361668"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary hover:scale-110"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* CTA */}
              <Button variant="nature" size="lg" className="w-full" asChild>
                <a href="tel:+213770840081">
                  <Phone className="w-5 h-5" />
                  Appeler maintenant
                </a>
              </Button>
            </div>

            {/* Map */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-2xl font-bold text-foreground">
                Notre emplacement
              </h2>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3253.0!2d-1.3147!3d34.8833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd78c8a3c8f0c0c1%3A0x0!2sLalla%20Setti%2C%20Tlemcen!5e0!3m2!1sfr!2sdz!4v1702000000000!5m2!1sfr!2sdz"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Emplacement Green Paradise"
                  className="grayscale-[30%] hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                📍 Situé sur le magnifique Plateau Lalla Setti avec vue panoramique sur Tlemcen
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}