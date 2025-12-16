import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, MapPin, Phone, Mail } from "lucide-react";

export default function ReservationPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Réservation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Réservez votre table et profitez d'un moment de détente au cœur de la nature.
          </p>
        </div>
      </section>

      {/* Reservation Form */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form */}
            <div className="bg-card rounded-3xl p-6 lg:p-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Formulaire de réservation
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom complet</label>
                    <input
                      type="text"
                      placeholder="Votre nom"
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Heure
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Sélectionner</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Nombre de personnes
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Sélectionner</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n} personnes</option>
                    ))}
                    <option value="10+">Plus de 10</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Zone préférée</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Sans préférence</option>
                    <option value="ombragee">Zone Ombragée</option>
                    <option value="panoramique">Zone Panoramique</option>
                    <option value="jardin">Zone Jardin</option>
                    <option value="famille">Zone Famille</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message (optionnel)</label>
                  <textarea
                    rows={4}
                    placeholder="Demandes particulières, occasion spéciale..."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <Button variant="nature" size="lg" className="w-full">
                  Envoyer la demande
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  * Formulaire placeholder - non fonctionnel
                </p>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div className="bg-muted/50 rounded-3xl p-6 lg:p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Informations pratiques
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Horaires</h4>
                      <p className="text-sm text-muted-foreground">Tous les jours de 9h à 20h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Adresse</h4>
                      <p className="text-sm text-muted-foreground">Plateau Lalla Setti, Tlemcen, Algérie</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Téléphone</h4>
                      <p className="text-sm text-muted-foreground">+213 XX XX XX XX</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Email</h4>
                      <p className="text-sm text-muted-foreground">contact@placeholder.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-3xl p-6 lg:p-8 border border-primary/20">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Bon à savoir
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Réservation recommandée les week-ends
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Confirmation par téléphone sous 24h
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Annulation gratuite jusqu'à 24h avant
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Parking gratuit disponible
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
