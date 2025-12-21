import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, MapPin, Phone, CheckCircle, Flame, Gamepad2, TreePine, Armchair, Star, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import table500 from "@/assets/table-500.png";
import table1000 from "@/assets/table-1000.png";
import table1500 from "@/assets/table-1500.png";
import table3000 from "@/assets/table-3000.png";
import table5000 from "@/assets/table-5000.png";

const formules = [
  {
    id: 1,
    name: "Formule Essentielle",
    value: "500da",
    price: 500,
    capacity: 4,
    image: table500,
    features: ["Jeu"],
    popular: false,
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    id: 2,
    name: "Formule Confort",
    value: "1000da",
    price: 1000,
    capacity: 4,
    image: table1000,
    features: ["Jeu", "Barbecue"],
    popular: false,
    color: "from-teal-500/20 to-teal-600/10",
  },
  {
    id: 3,
    name: "Formule Famille",
    value: "1500da",
    price: 1500,
    capacity: 6,
    image: table1500,
    features: ["Jeu", "Barbecue", "Balançoire"],
    popular: true,
    color: "from-green-500/20 to-green-600/10",
  },
  {
    id: 4,
    name: "Formule Premium",
    value: "3000da",
    price: 3000,
    capacity: 8,
    image: table3000,
    features: ["Jeu", "Balançoire", "Barbecue", "Transat"],
    popular: false,
    color: "from-lime-500/20 to-lime-600/10",
  },
  {
    id: 5,
    name: "Formule VIP",
    value: "5000da",
    price: 5000,
    capacity: 15,
    image: table5000,
    features: ["Barbecue", "Jeu"],
    popular: false,
    color: "from-yellow-500/20 to-yellow-600/10",
  },
];

const getFeatureIcon = (feature: string) => {
  switch (feature) {
    case "Jeu":
      return Gamepad2;
    case "Barbecue":
      return Flame;
    case "Balançoire":
      return TreePine;
    case "Transat":
      return Armchair;
    default:
      return Star;
  }
};

const formuleValues = ["500da", "1000da", "1500da", "3000da", "5000da"] as const;

const reservationSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  telephone: z.string().regex(/^[0-9\s]{8,20}$/, "Numéro de téléphone invalide (8-20 chiffres)"),
  email: z.string().trim().email("Adresse email invalide").max(255, "L'email ne peut pas dépasser 255 caractères").optional().or(z.literal("")),
  date: z.string().min(1, "La date est requise").refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "La date doit être aujourd'hui ou dans le futur"),
  formule: z.enum(formuleValues, { errorMap: () => ({ message: "Veuillez sélectionner une formule valide" }) }),
  nombrePersonnes: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseInt(val);
    return num >= 1 && num <= 50;
  }, "Nombre de personnes invalide"),
  message: z.string().trim().max(1000, "Le message ne peut pas dépasser 1000 caractères").optional().or(z.literal("")),
});

export default function ReservationPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"formules" | "form">("formules");
  const [selectedFormule, setSelectedFormule] = useState<typeof formules[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    email: "",
    date: "",
    formule: "",
    nombrePersonnes: "",
    message: "",
  });

  const handleSelectFormule = (formule: typeof formules[0]) => {
    setSelectedFormule(formule);
    setFormData({ ...formData, formule: formule.value });
    setStep("form");
  };

  const handleBack = () => {
    setStep("formules");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = reservationSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Erreur de validation",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validation.data;
    setIsSubmitting(true);
    
    const { error } = await supabase.from("reservations").insert({
      nom: validatedData.nom,
      telephone: validatedData.telephone,
      email: validatedData.email || null,
      date_reservation: validatedData.date,
      formule: validatedData.formule,
      nombre_personnes: validatedData.nombrePersonnes ? parseInt(validatedData.nombrePersonnes) : null,
      message: validatedData.message || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    setIsSuccess(true);
    setFormData({
      nom: "",
      telephone: "",
      email: "",
      date: "",
      formule: "",
      nombrePersonnes: "",
      message: "",
    });
  };

  const handleNewReservation = () => {
    setIsSuccess(false);
    setStep("formules");
    setSelectedFormule(null);
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="py-24 lg:py-32">
          <div className="container mx-auto container-padding text-center">
            <div className="max-w-md mx-auto space-y-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full nature-gradient flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Demande envoyée !
              </h1>
              <p className="text-muted-foreground">
                Merci pour votre réservation. Nous vous contacterons très bientôt pour confirmer votre réservation.
              </p>
              <Button variant="nature" onClick={handleNewReservation}>
                Nouvelle réservation
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Step 1: Choose formule
  if (step === "formules") {
    return (
      <Layout>
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto container-padding text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
              Réservation
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Choisissez la formule qui correspond à vos besoins et profitez d'un moment unique à Green Paradise.
            </p>
          </div>
        </section>

        {/* Formules Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto container-padding">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {formules.map((formule, index) => (
                <div
                  key={formule.id}
                  className={`group relative bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                    formule.popular ? "ring-2 ring-primary md:scale-105" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Popular Badge */}
                  {formule.popular && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold animate-pulse">
                      Populaire
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${formule.color}`} />
                    <img
                      src={formule.image}
                      alt={formule.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{formule.name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{formule.capacity} personnes</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {formule.features.map((feature) => {
                        const Icon = getFeatureIcon(feature);
                        return (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs font-medium text-secondary-foreground"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {feature}
                          </span>
                        );
                      })}
                    </div>

                    {/* Price */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-bold text-primary">{formule.price}</span>
                          <span className="text-lg text-muted-foreground ml-1">DA</span>
                        </div>
                        <Button 
                          variant="nature" 
                          size="sm" 
                          className="group-hover:scale-105 transition-transform"
                          onClick={() => handleSelectFormule(formule)}
                        >
                          Réserver
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-muted/50">
          <div className="container mx-auto container-padding text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Besoin d'informations supplémentaires ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Contactez-nous pour toute question sur nos formules ou pour une demande personnalisée.
            </p>
            <Button variant="nature" size="lg" asChild>
              <a href="tel:+213770840081">Appeler : 0770 84 00 81</a>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  // Step 2: Reservation form
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux formules
          </button>
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
              Réserver {selectedFormule?.name}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {selectedFormule?.price} DA • {selectedFormule?.capacity} personnes
            </p>
          </div>
        </div>
      </section>

      {/* Reservation Form */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form */}
            <div className="bg-card rounded-3xl p-6 lg:p-10 shadow-sm animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Formulaire de réservation
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom complet *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Téléphone *</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="0770 XX XX XX"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email (optionnel)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Nombre de personnes
                    </label>
                    <select 
                      name="nombrePersonnes"
                      value={formData.nombrePersonnes}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sélectionner</option>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
                        <option key={n} value={n}>{n} personnes</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected formule display */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{selectedFormule?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedFormule?.features.join(" • ")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">{selectedFormule?.price}</span>
                      <span className="text-muted-foreground ml-1">DA</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message (optionnel)</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Demandes particulières, occasion spéciale..."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="nature" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                </Button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
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
                  <a href="tel:+213770840081" className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                      <Phone className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Téléphone</h4>
                      <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">0770 84 00 81</p>
                    </div>
                  </a>
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
