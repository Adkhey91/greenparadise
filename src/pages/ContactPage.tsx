import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook } from "lucide-react";

export default function ContactPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Contact
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Une question ? N'hésitez pas à nous contacter. Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-card rounded-3xl p-6 lg:p-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Envoyez-nous un message
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <input
                      type="text"
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prénom</label>
                    <input
                      type="text"
                      placeholder="Votre prénom"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+213 XX XX XX XX"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sujet</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Sélectionner</option>
                    <option value="info">Demande d'information</option>
                    <option value="reservation">Réservation</option>
                    <option value="evenement">Événement privé</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Votre message..."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <Button variant="nature" size="lg" className="w-full">
                  <Send className="w-5 h-5" />
                  Envoyer le message
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  * Formulaire placeholder - non fonctionnel
                </p>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4">
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

                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Téléphone</h3>
                    <p className="text-sm text-muted-foreground">+213 XX XX XX XX</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-sm text-muted-foreground">contact@placeholder.com</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4">
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
                <h3 className="font-semibold text-foreground mb-4">Suivez-nous</h3>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-secondary/30 to-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center space-y-3">
                  <MapPin className="w-12 h-12 text-primary/40 mx-auto" />
                  <p className="text-muted-foreground text-sm">Google Maps - Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
