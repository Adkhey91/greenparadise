import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Clock, Phone, CheckCircle, TreePine, Star, ArrowLeft, ArrowRight, RefreshCw, Crown, Copy, Search, UtensilsCrossed, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link } from "react-router-dom";

interface Venue {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_reservable: boolean;
}

interface Formula {
  id: string;
  nom: string;
  description_courte: string | null;
  prix_dzd: number;
  nb_personnes: number;
  tags: string[];
  photo_url: string | null;
  venue_id: string;
}

const reservationSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  telephone: z.string().regex(/^[0-9\s]{8,20}$/, "Numéro de téléphone invalide"),
  date: z.string().min(1, "La date est requise").refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "La date doit être aujourd'hui ou dans le futur"),
  heure: z.string().min(1, "L'heure est requise"),
  nombrePersonnes: z.coerce.number().min(1, "Minimum 1 personne").max(50, "Maximum 50 personnes"),
});

const HEURES_JARDIN = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

const HEURES_RESTO = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

export default function ReservationPage() {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"venue" | "formule" | "details" | "success">("venue");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedFormule, setSelectedFormule] = useState<Formula | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationNumber, setReservationNumber] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    date: "",
    heure: "",
    nombrePersonnes: 2,
    message: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [venuesRes, formulasRes] = await Promise.all([
      supabase.from('venues').select('*').eq('is_reservable', true).order('code'),
      supabase.from('formulas').select('*').eq('actif', true).order('prix_dzd', { ascending: true })
    ]);

    if (venuesRes.data) setVenues(venuesRes.data);
    if (formulasRes.data) setFormulas(formulasRes.data);
    setLoading(false);
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setSelectedFormule(null);
    setStep("formule");
  };

  const handleSelectFormule = (formule: Formula) => {
    setSelectedFormule(formule);
    setFormData(prev => ({ ...prev, nombrePersonnes: formule.nb_personnes }));
    setStep("details");
  };

  const handleBack = () => {
    if (step === "details") setStep("formule");
    else if (step === "formule") setStep("venue");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!selectedVenue || !selectedFormule) return;

    setIsSubmitting(true);
    
    const { data, error } = await supabase.from("reservations").insert({
      venue_id: selectedVenue.id,
      nom: validation.data.nom,
      telephone: validation.data.telephone,
      date_reservation: validation.data.date,
      formule: selectedFormule.nom,
      nombre_personnes: validation.data.nombrePersonnes,
      message: formData.message || null,
      statut: 'en_attente',
      total_price: selectedFormule.prix_dzd,
      payment_status: 'unpaid',
      source: 'web',
      duration_minutes: selectedVenue.code === 'RESTAURANT' ? 90 : 180
    }).select('reservation_number').single();

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    setReservationNumber(data.reservation_number);
    setStep("success");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reservationNumber);
    toast({ title: "Copié !", description: "Numéro de réservation copié" });
  };

  const handleNewReservation = () => {
    setStep("venue");
    setSelectedVenue(null);
    setSelectedFormule(null);
    setReservationNumber("");
    setFormData({ nom: "", telephone: "", date: "", heure: "", nombrePersonnes: 2, message: "" });
  };

  const venueFormulas = selectedVenue 
    ? formulas.filter(f => f.venue_id === selectedVenue.id) 
    : [];

  const timeSlots = selectedVenue?.code === 'RESTAURANT' ? HEURES_RESTO : HEURES_JARDIN;

  // Loading
  if (loading) {
    return (
      <Layout>
        <section className="py-24 lg:py-32">
          <div className="container mx-auto container-padding text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </section>
      </Layout>
    );
  }

  // Success Screen
  if (step === "success") {
    const isResto = selectedVenue?.code === 'RESTAURANT';
    return (
      <Layout>
        <section className={`py-24 lg:py-32 ${isResto ? 'bg-chalet-cream' : ''}`}>
          <div className="container mx-auto container-padding text-center">
            <div className="max-w-lg mx-auto space-y-8 animate-fade-in">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isResto ? 'bg-chalet-gold/20' : 'nature-gradient'}`}>
                <CheckCircle className={`w-10 h-10 ${isResto ? 'text-chalet-gold' : 'text-primary-foreground'}`} />
              </div>
              
              <div className="space-y-2">
                <h1 className={`text-3xl font-bold ${isResto ? 'text-chalet-charcoal' : 'text-foreground'}`}>
                  Demande envoyée !
                </h1>
                <p className={isResto ? 'text-chalet-wood-light' : 'text-muted-foreground'}>
                  Votre demande pour <strong>{selectedVenue?.name}</strong> est en attente de confirmation.
                </p>
              </div>

              <div className={`rounded-2xl p-6 border ${isResto ? 'bg-chalet-gold/10 border-chalet-gold/20' : 'bg-primary/10 border-primary/20'}`}>
                <p className="text-sm text-muted-foreground mb-2">Numéro de réservation</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-3xl font-black tracking-widest ${isResto ? 'text-chalet-gold' : 'text-primary'}`}>
                    {reservationNumber}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">En attente de confirmation</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">Nous confirmerons sous 24h</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 text-left space-y-3">
                <h3 className="font-semibold">📱 Important</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Faites une capture d'écran de votre numéro</li>
                  <li>• Revenez sur le site pour retrouver votre ticket</li>
                  <li>• Le QR code sera disponible après confirmation</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant={isResto ? "default" : "nature"} asChild className={isResto ? 'bg-chalet-charcoal hover:bg-chalet-wood' : ''}>
                  <Link to="/ticket" className="gap-2">
                    <Search className="w-4 h-4" />
                    Retrouver ma réservation
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleNewReservation}>
                  Nouvelle réservation
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Step 1: Choose Venue
  if (step === "venue") {
    return (
      <Layout>
        <section className="py-16 lg:py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto container-padding text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Réservation Gratuite
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choisissez votre espace et réservez. Paiement sur place uniquement.
            </p>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/ticket">
                <Search className="w-4 h-4" />
                Retrouver ma réservation
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="container mx-auto container-padding">
            <div className="text-center mb-12">
              <span className="text-sm uppercase tracking-widest text-primary font-medium">Étape 1</span>
              <h2 className="text-3xl font-bold mt-2">Choisissez votre espace</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {venues.map((venue) => (
                <Card 
                  key={venue.id}
                  className={`group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${
                    venue.code === 'RESTAURANT' 
                      ? 'bg-gradient-to-br from-chalet-cream to-white border-chalet-beige hover:border-chalet-gold/50' 
                      : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectVenue(venue)}
                >
                  <div className={`h-48 flex items-center justify-center ${
                    venue.code === 'RESTAURANT' 
                      ? 'bg-gradient-to-br from-chalet-charcoal to-chalet-wood' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {venue.code === 'RESTAURANT' ? (
                      <UtensilsCrossed className="w-20 h-20 text-chalet-gold/80" />
                    ) : (
                      <TreePine className="w-20 h-20 text-white/80" />
                    )}
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={venue.code === 'RESTAURANT' ? 'secondary' : 'default'} className={venue.code === 'RESTAURANT' ? 'bg-chalet-gold/10 text-chalet-charcoal' : ''}>
                        {venue.code === 'RESTAURANT' ? <Building2 className="w-3 h-3 mr-1" /> : <TreePine className="w-3 h-3 mr-1" />}
                        {venue.code}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{venue.name}</h3>
                    <p className="text-muted-foreground">{venue.description}</p>
                    <Button className={`w-full gap-2 ${venue.code === 'RESTAURANT' ? 'bg-chalet-charcoal hover:bg-chalet-wood' : ''}`}>
                      Choisir
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Step 2: Choose Formula
  if (step === "formule") {
    const isResto = selectedVenue?.code === 'RESTAURANT';
    return (
      <Layout>
        <section className={`py-16 lg:py-24 ${isResto ? 'bg-chalet-cream' : 'bg-muted/50'}`}>
          <div className="container mx-auto container-padding">
            <Button variant="ghost" onClick={handleBack} className="mb-8 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au choix du lieu
            </Button>

            <div className="text-center mb-12">
              <Badge className={isResto ? 'bg-chalet-gold/20 text-chalet-charcoal' : ''}>{selectedVenue?.name}</Badge>
              <h2 className={`text-3xl font-bold mt-4 ${isResto ? 'text-chalet-charcoal' : ''}`}>Choisissez votre formule</h2>
            </div>

            {venueFormulas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucune formule disponible pour ce lieu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {venueFormulas.map((formule, index) => (
                  <Card 
                    key={formule.id}
                    className={`group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${
                      isResto ? 'bg-white border-chalet-beige/50 hover:border-chalet-gold/50' : ''
                    }`}
                    onClick={() => handleSelectFormule(formule)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {formule.photo_url ? (
                        <img src={formule.photo_url} alt={formule.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isResto ? 'bg-gradient-to-br from-chalet-warm to-chalet-wood' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                          {isResto ? <UtensilsCrossed className="w-16 h-16 text-white/50" /> : <TreePine className="w-16 h-16 text-white/50" />}
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-background/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                          <span className={`text-xl font-bold ${isResto ? 'text-chalet-gold' : 'text-primary'}`}>{formule.prix_dzd.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground ml-1">DA</span>
                        </div>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                          <Crown className="w-3 h-3" />
                          Populaire
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <h3 className="text-xl font-bold">{formule.nom}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" />
                          {formule.nb_personnes} pers.
                        </Badge>
                      </div>
                      {formule.description_courte && (
                        <p className="text-sm text-muted-foreground">{formule.description_courte}</p>
                      )}
                      {formule.tags && formule.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formule.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs">
                              <Star className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </Layout>
    );
  }

  // Step 3: Details Form
  const isResto = selectedVenue?.code === 'RESTAURANT';
  return (
    <Layout>
      <section className={`py-16 lg:py-24 ${isResto ? 'bg-chalet-cream' : 'bg-muted/50'}`}>
        <div className="container mx-auto container-padding">
          <Button variant="ghost" onClick={handleBack} className="mb-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux formules
          </Button>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <Badge className={isResto ? 'bg-chalet-gold/20 text-chalet-charcoal' : ''}>{selectedVenue?.name}</Badge>
              <h2 className={`text-3xl font-bold mt-4 ${isResto ? 'text-chalet-charcoal' : ''}`}>Vos informations</h2>
              <p className="text-muted-foreground mt-2">
                Formule : <strong>{selectedFormule?.nom}</strong> — {selectedFormule?.prix_dzd.toLocaleString()} DA
              </p>
            </div>

            <Card className={isResto ? 'bg-white border-chalet-beige/50' : ''}>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom complet *</Label>
                      <Input
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Téléphone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="telephone"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          placeholder="0X XX XX XX XX"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="pl-10"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heure">Heure *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                          id="heure"
                          name="heure"
                          value={formData.heure}
                          onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
                          required
                        >
                          <option value="">Choisir</option>
                          {timeSlots.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombrePersonnes">Personnes *</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="nombrePersonnes"
                          name="nombrePersonnes"
                          type="number"
                          min="1"
                          max="50"
                          value={formData.nombrePersonnes}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Notes (optionnel)</Label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Demandes spéciales, allergies..."
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className={`rounded-xl p-4 ${isResto ? 'bg-chalet-beige/30' : 'bg-primary/5'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total à payer sur place</span>
                      <span className={`text-2xl font-bold ${isResto ? 'text-chalet-gold' : 'text-primary'}`}>
                        {selectedFormule?.prix_dzd.toLocaleString()} DA
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className={`w-full gap-2 ${isResto ? 'bg-chalet-charcoal hover:bg-chalet-wood' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Confirmer la demande
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
