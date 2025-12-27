import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, MapPin, Phone, CheckCircle, Flame, Gamepad2, TreePine, Armchair, Star, ArrowLeft, RefreshCw, Sparkles, Crown, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Formula {
  id: string;
  nom: string;
  description_courte: string | null;
  prix_dzd: number;
  nb_personnes: number;
  tags: string[];
  actif: boolean;
  photo_url: string | null;
}

const getFeatureIcon = (feature: string) => {
  const featureLower = feature.toLowerCase();
  if (featureLower.includes('jeu') || featureLower.includes('game')) return Gamepad2;
  if (featureLower.includes('barbecue') || featureLower.includes('grill')) return Flame;
  if (featureLower.includes('balanc') || featureLower.includes('vert') || featureLower.includes('espace')) return TreePine;
  if (featureLower.includes('transat') || featureLower.includes('detente')) return Armchair;
  return Star;
};

const getCardStyle = (index: number, total: number) => {
  const isPopular = index === Math.floor(total / 2) && total > 2;
  const styles = [
    { gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20" },
    { gradient: "from-teal-500 to-cyan-600", glow: "shadow-teal-500/20" },
    { gradient: "from-green-500 to-emerald-600", glow: "shadow-green-500/20" },
    { gradient: "from-lime-500 to-green-600", glow: "shadow-lime-500/20" },
    { gradient: "from-amber-500 to-orange-600", glow: "shadow-amber-500/20" },
  ];
  return { ...styles[index % styles.length], isPopular };
};

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
  formule: z.string().min(1, "Veuillez sélectionner une formule"),
  nombrePersonnes: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseInt(val);
    return num >= 1 && num <= 50;
  }, "Nombre de personnes invalide"),
  message: z.string().trim().max(1000, "Le message ne peut pas dépasser 1000 caractères").optional().or(z.literal("")),
});

export default function ReservationPage() {
  const { toast } = useToast();
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"formules" | "form">("formules");
  const [selectedFormule, setSelectedFormule] = useState<Formula | null>(null);
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

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('formulas')
      .select('*')
      .eq('actif', true)
      .order('prix_dzd', { ascending: true });
    
    if (error) {
      console.error('Error fetching formulas:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les formules",
        variant: "destructive",
      });
    } else {
      setFormulas(data || []);
    }
    setLoading(false);
  };

  const handleSelectFormule = (formule: Formula) => {
    setSelectedFormule(formule);
    setFormData({ ...formData, formule: formule.nom });
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
                Réservation réussie !
              </h1>
              <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                <p className="text-lg font-medium text-foreground mb-2">
                  📞 On va vous contacter dans 5 minutes
                </p>
                <p className="text-muted-foreground text-sm">
                  Notre équipe vous appellera pour confirmer votre réservation et répondre à toutes vos questions.
                </p>
              </div>
              <p className="text-muted-foreground text-sm">
                Merci de garder votre téléphone à portée de main.
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

  // Loading state
  if (loading) {
    return (
      <Layout>
        <section className="py-24 lg:py-32">
          <div className="container mx-auto container-padding text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement des formules...</p>
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
            {formulas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucune formule disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {formulas.map((formule, index) => {
                  const style = getCardStyle(index, formulas.length);
                  return (
                    <div
                      key={formule.id}
                      className={`group relative bg-card rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-3 ${
                        style.isPopular 
                          ? `ring-2 ring-primary shadow-2xl ${style.glow} scale-[1.02] z-10` 
                          : `shadow-lg hover:shadow-2xl hover:${style.glow}`
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Popular Badge */}
                      {style.isPopular && (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold shadow-lg">
                          <Crown className="w-3.5 h-3.5" />
                          Populaire
                        </div>
                      )}

                      {/* Premium indicator for last item */}
                      {index === formulas.length - 1 && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          VIP
                        </div>
                      )}

                      {/* Image with overlay gradient */}
                      <div className="relative h-52 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-30`} />
                        {formule.photo_url ? (
                          <img
                            src={formule.photo_url}
                            alt={formule.nom}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${style.gradient}`}>
                            <TreePine className="w-20 h-20 text-white/50" />
                          </div>
                        )}
                        {/* Bottom gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                        
                        {/* Price badge floating on image */}
                        <div className="absolute bottom-4 left-4 z-10">
                          <div className="bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-border/50">
                            <span className="text-2xl font-black text-primary">{formule.prix_dzd.toLocaleString()}</span>
                            <span className="text-sm font-medium text-muted-foreground ml-1">DA</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        {/* Header */}
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {formule.nom}
                          </h3>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="gap-1.5 py-1 px-3 border-primary/30 text-primary">
                              <Users className="w-3.5 h-3.5" />
                              {formule.nb_personnes} pers.
                            </Badge>
                            {style.isPopular && (
                              <Badge variant="secondary" className="gap-1 py-1">
                                <Heart className="w-3 h-3 fill-current" />
                                Favoris
                              </Badge>
                            )}
                          </div>
                          
                          {formule.description_courte && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {formule.description_courte}
                            </p>
                          )}
                        </div>

                        {/* Features/Tags */}
                        {formule.tags && formule.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formule.tags.map((tag) => {
                              const Icon = getFeatureIcon(tag);
                              return (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 text-xs font-medium text-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                                >
                                  <Icon className="w-3.5 h-3.5 text-primary" />
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* CTA Button */}
                        <Button 
                          variant={style.isPopular ? "nature" : "outline"} 
                          size="lg" 
                          className={`w-full mt-4 rounded-xl font-semibold transition-all group-hover:shadow-lg ${
                            style.isPopular 
                              ? "group-hover:scale-[1.02]" 
                              : "hover:bg-primary hover:text-primary-foreground group-hover:border-primary"
                          }`}
                          onClick={() => handleSelectFormule(formule)}
                        >
                          Réserver cette formule
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              Réserver {selectedFormule?.nom}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {selectedFormule?.prix_dzd} DA • {selectedFormule?.nb_personnes} personnes
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
                      <p className="font-medium text-foreground">{selectedFormule?.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFormule?.tags?.join(" • ") || selectedFormule?.description_courte || ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">{selectedFormule?.prix_dzd}</span>
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
