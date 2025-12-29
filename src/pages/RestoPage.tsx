import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  UtensilsCrossed, 
  Users, 
  CalendarIcon, 
  Clock, 
  ShoppingCart,
  Leaf,
  Coffee,
  IceCream,
  Wine,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";

type RestoCategorie = 'entrees' | 'plats' | 'desserts' | 'boissons';

interface MenuItem {
  id: string;
  nom: string;
  description: string | null;
  prix_dzd: number;
  categorie: RestoCategorie;
  photo_url: string | null;
  allergenes: string[] | null;
  disponible: boolean;
}

interface RestoTable {
  id: string;
  numero: number;
  capacite: number;
  statut: string;
  position_x: number;
  position_y: number;
}

const CATEGORIES: { value: RestoCategorie; label: string; icon: React.ElementType }[] = [
  { value: 'entrees', label: 'Entrées', icon: Leaf },
  { value: 'plats', label: 'Plats', icon: UtensilsCrossed },
  { value: 'desserts', label: 'Desserts', icon: IceCream },
  { value: 'boissons', label: 'Boissons', icon: Wine },
];

const HEURES = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

export default function RestoPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestoTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RestoCategorie>('plats');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestoTable | null>(null);
  const [reservationDate, setReservationDate] = useState<Date>();
  const [reservationHeure, setReservationHeure] = useState<string>("");
  const [reservationPersonnes, setReservationPersonnes] = useState<number>(2);
  const [reservationNom, setReservationNom] = useState("");
  const [reservationTel, setReservationTel] = useState("");
  const [reservationEmail, setReservationEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingReservationId, setPendingReservationId] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const { toast } = useToast();

  // Fixed amount for restaurant table reservation (can be adjusted)
  const RESTO_RESERVATION_AMOUNT = 500; // 500 DA

  useEffect(() => {
    fetchData();
    
    // Realtime subscription for tables
    const channel = supabase
      .channel('resto-tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resto_tables' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTables(prev => prev.map(t => 
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([
        supabase.from('resto_menu_items').select('*').eq('disponible', true).order('ordre'),
        supabase.from('resto_tables').select('*').order('numero')
      ]);

      if (menuRes.data) setMenuItems(menuRes.data as MenuItem[]);
      if (tablesRes.data) setTables(tablesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast({ title: "Ajouté au panier", description: item.nom });
  };

  const getTableColor = (statut: string) => {
    switch (statut) {
      case 'libre': return 'bg-chalet-gold hover:bg-chalet-gold/90';
      case 'occupee': return 'bg-rose-600';
      case 'reservee': return 'bg-chalet-wood';
      case 'hs': return 'bg-chalet-beige';
      default: return 'bg-chalet-beige';
    }
  };

  const handleTableClick = (table: RestoTable) => {
    if (table.statut === 'libre') {
      setSelectedTable(table);
      setIsDialogOpen(true);
    }
  };

  const handleReservation = async () => {
    if (!selectedTable || !reservationDate || !reservationHeure || !reservationNom || !reservationTel) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Create reservation with pending payment status
      const { data, error } = await supabase.from('resto_reservations').insert({
        table_id: selectedTable.id,
        nom: reservationNom,
        telephone: reservationTel,
        email: reservationEmail || null,
        date_reservation: format(reservationDate, 'yyyy-MM-dd'),
        heure: reservationHeure,
        nombre_personnes: reservationPersonnes,
        montant_dzd: RESTO_RESERVATION_AMOUNT,
        statut: 'paiement_en_attente'
      }).select('id').single();

      if (error) throw error;

      // Store reservation ID and open payment modal
      setPendingReservationId(data.id);
      setIsDialogOpen(false);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", description: "Impossible de créer la réservation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (code: string) => {
    setConfirmationCode(code);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    // Reset form
    setSelectedTable(null);
    setReservationNom("");
    setReservationTel("");
    setReservationEmail("");
    setReservationDate(undefined);
    setReservationHeure("");
    setPendingReservationId(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setConfirmationCode("");
  };

  const filteredItems = menuItems.filter(item => item.categorie === activeCategory);
  const cartTotal = cart.reduce((sum, c) => sum + c.item.prix_dzd * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="min-h-screen bg-chalet-cream">
      {/* Hero Section - Modern Chalet */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-chalet-charcoal via-chalet-wood/95 to-chalet-warm/90" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1920)'
          }}
        />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)' }} />
        
        <div className="relative z-10 text-center px-4 py-24 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-chalet-gold/15 backdrop-blur-md rounded-full mb-10 border border-chalet-gold/25">
            <span className="w-1.5 h-1.5 rounded-full bg-chalet-gold animate-pulse" />
            <span className="text-chalet-gold/90 font-medium tracking-widest uppercase text-xs">Restaurant Gastronomique</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-light text-chalet-cream mb-6 tracking-tight">
            Le <span className="font-semibold">Chalet</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-chalet-gold/60 to-transparent mx-auto mb-8" />
          <p className="text-lg md:text-xl text-chalet-cream/70 max-w-xl mx-auto mb-12 font-light leading-relaxed">
            Une expérience culinaire d'exception dans l'écrin chaleureux d'un chalet de montagne
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-chalet-gold/90 hover:bg-chalet-gold text-chalet-charcoal font-medium gap-3 px-8 h-14 rounded-full transition-all hover:scale-105">
              <UtensilsCrossed className="w-5 h-5" />
              Découvrir la Carte
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-chalet-cream/90 border-chalet-cream/20 hover:bg-chalet-cream/10 hover:border-chalet-cream/40 gap-3 px-8 h-14 rounded-full transition-all">
              <CalendarIcon className="w-5 h-5" />
              Réserver
            </Button>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-chalet-cream to-transparent" />
      </section>

      {/* Menu Section - Elegant Chalet */}
      <section className="py-24 bg-chalet-cream">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-16">
            <span className="inline-block text-chalet-warm uppercase tracking-[0.3em] text-xs font-medium mb-4">Saveurs</span>
            <h2 className="text-4xl md:text-5xl font-light text-chalet-charcoal mb-4">
              Notre <span className="font-semibold">Carte</span>
            </h2>
            <div className="w-16 h-px bg-chalet-gold/50 mx-auto mb-6" />
            <p className="text-chalet-wood-light max-w-lg mx-auto font-light">
              Des créations raffinées, sublimées par des produits d'exception
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RestoCategorie)} className="w-full">
            <TabsList className="flex justify-center gap-2 max-w-2xl mx-auto mb-14 h-auto bg-transparent p-0">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-chalet-beige bg-white data-[state=active]:bg-chalet-charcoal data-[state=active]:text-chalet-cream data-[state=active]:border-chalet-charcoal transition-all duration-300 hover:border-chalet-warm/50"
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(cat => (
              <TabsContent key={cat.value} value={cat.value}>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="h-56 bg-chalet-beige/50" />
                        <div className="p-6 space-y-3">
                          <div className="h-5 bg-chalet-beige/50 rounded-full w-2/3" />
                          <div className="h-4 bg-chalet-beige/50 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-chalet-beige/50 flex items-center justify-center mx-auto mb-6">
                      <UtensilsCrossed className="w-10 h-10 text-chalet-warm/40" />
                    </div>
                    <p className="text-chalet-wood-light text-lg">Aucun plat disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map(item => (
                      <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-chalet-beige/50">
                        <div className="relative h-56 overflow-hidden">
                          {item.photo_url ? (
                            <img 
                              src={item.photo_url} 
                              alt={item.nom}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chalet-beige/30 to-chalet-cream">
                              <UtensilsCrossed className="w-14 h-14 text-chalet-warm/20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-chalet-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-chalet-charcoal px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                            {item.prix_dzd.toLocaleString()} DA
                          </span>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-lg mb-2 text-chalet-charcoal">{item.nom}</h3>
                          {item.description && (
                            <p className="text-sm text-chalet-wood-light mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                          {item.allergenes && item.allergenes.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-chalet-warm mb-4">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{item.allergenes.join(', ')}</span>
                            </div>
                          )}
                          <Button 
                            onClick={() => addToCart(item)}
                            className="w-full gap-2 bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream rounded-full h-11 transition-all"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Table Plan Section - Modern Elegant Design */}
      <section className="py-24 bg-gradient-to-b from-chalet-cream via-white to-chalet-cream">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-16">
            <span className="inline-block text-chalet-warm uppercase tracking-[0.3em] text-xs font-medium mb-4">Réservation</span>
            <h2 className="text-4xl md:text-5xl font-light text-chalet-charcoal mb-4">
              Choisir sa <span className="font-semibold">Table</span>
            </h2>
            <div className="w-16 h-px bg-chalet-gold/50 mx-auto mb-6" />
            <p className="text-chalet-wood-light max-w-lg mx-auto font-light mb-10">
              Sélectionnez votre emplacement pour une soirée inoubliable
            </p>
            
            {/* Legend */}
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-chalet-gold to-chalet-gold-muted shadow-sm" />
                <span className="text-sm text-chalet-charcoal/80">Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chalet-rose" />
                <span className="text-sm text-chalet-charcoal/80">Occupée</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chalet-warm" />
                <span className="text-sm text-chalet-charcoal/80">Réservée</span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Restaurant floor plan visual */}
            <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-chalet-beige/30">
              {/* Decorative elements */}
              <div className="absolute top-6 left-6 w-20 h-1 bg-chalet-beige/50 rounded-full" />
              <div className="absolute top-6 right-6 flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-chalet-sage/50" />
                <div className="w-2 h-2 rounded-full bg-chalet-gold/50" />
                <div className="w-2 h-2 rounded-full bg-chalet-rose/50" />
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    disabled={table.statut !== 'libre'}
                    className={cn(
                      "relative aspect-square rounded-2xl flex flex-col items-center justify-center font-medium transition-all duration-300 group",
                      table.statut === 'libre' && "bg-gradient-to-br from-chalet-gold/90 to-chalet-gold text-chalet-charcoal cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-chalet-gold/20",
                      table.statut === 'occupee' && "bg-chalet-rose text-chalet-warm cursor-not-allowed",
                      table.statut === 'reservee' && "bg-chalet-warm/80 text-chalet-cream cursor-not-allowed",
                      table.statut === 'hs' && "bg-chalet-beige/60 text-chalet-wood-light/50 cursor-not-allowed"
                    )}
                  >
                    {/* Table shape indicator */}
                    <div className={cn(
                      "absolute inset-2 rounded-xl border-2 border-dashed opacity-30",
                      table.statut === 'libre' ? "border-chalet-charcoal/40" : "border-current"
                    )} />
                    <span className="text-2xl md:text-3xl font-light">{table.numero}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1">{table.capacite} pers.</span>
                    {table.statut === 'libre' && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider opacity-0 group-hover:opacity-100 group-hover:-bottom-6 transition-all text-chalet-charcoal">
                        Réserver
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Kitchen indicator */}
              <div className="mt-10 pt-6 border-t border-chalet-beige/50">
                <div className="flex items-center justify-center gap-2 text-chalet-wood-light/60 text-sm">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="uppercase tracking-widest text-xs">Cuisine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation Dialog - Modern Chalet Style */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-chalet-charcoal to-chalet-wood p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-chalet-gold/20 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-7 h-7 text-chalet-gold" />
            </div>
            <DialogTitle className="text-2xl font-light text-chalet-cream">
              Table <span className="font-semibold">{selectedTable?.numero}</span>
            </DialogTitle>
            <p className="text-chalet-cream/60 text-sm mt-2">
              Capacité : {selectedTable?.capacite} personnes
            </p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-chalet-charcoal text-sm font-medium">Nom complet</Label>
                <Input 
                  placeholder="Votre nom"
                  value={reservationNom}
                  onChange={(e) => setReservationNom(e.target.value)}
                  className="h-12 rounded-xl border-chalet-beige focus:border-chalet-gold focus:ring-chalet-gold/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-chalet-charcoal text-sm font-medium">Téléphone</Label>
                <Input 
                  placeholder="0X XX XX XX XX"
                  value={reservationTel}
                  onChange={(e) => setReservationTel(e.target.value)}
                  className="h-12 rounded-xl border-chalet-beige focus:border-chalet-gold focus:ring-chalet-gold/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-chalet-charcoal text-sm font-medium">Email <span className="text-chalet-wood-light font-normal">(optionnel)</span></Label>
              <Input 
                type="email"
                placeholder="email@exemple.com"
                value={reservationEmail}
                onChange={(e) => setReservationEmail(e.target.value)}
                className="h-12 rounded-xl border-chalet-beige focus:border-chalet-gold focus:ring-chalet-gold/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-chalet-charcoal text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 justify-start text-left font-normal rounded-xl border-chalet-beige hover:border-chalet-gold">
                      <CalendarIcon className="mr-2 h-4 w-4 text-chalet-warm" />
                      {reservationDate ? format(reservationDate, "dd/MM/yyyy", { locale: fr }) : "Choisir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={reservationDate}
                      onSelect={setReservationDate}
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-chalet-charcoal text-sm font-medium">Heure</Label>
                <Select value={reservationHeure} onValueChange={setReservationHeure}>
                  <SelectTrigger className="h-12 rounded-xl border-chalet-beige focus:border-chalet-gold">
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {HEURES.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-chalet-charcoal text-sm font-medium">Nombre de personnes</Label>
              <Select 
                value={reservationPersonnes.toString()} 
                onValueChange={(v) => setReservationPersonnes(parseInt(v))}
              >
                <SelectTrigger className="h-12 rounded-xl border-chalet-beige focus:border-chalet-gold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[...Array(selectedTable?.capacite || 4)].map((_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1} personne{i > 0 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleReservation}
              disabled={submitting}
              className="w-full h-14 bg-gradient-to-r from-chalet-gold to-chalet-gold-muted hover:from-chalet-gold/90 hover:to-chalet-gold text-chalet-charcoal font-semibold rounded-xl transition-all text-base"
            >
              {submitting ? "Envoi..." : "Confirmer la réservation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Floating Button - Chalet Style */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream gap-2 shadow-xl">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-chalet-gold font-bold">{cartCount}</span>
            <span className="border-l border-chalet-gold/30 pl-2 ml-2">
              {cartTotal.toLocaleString()} DA
            </span>
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      {pendingReservationId && selectedTable && reservationDate && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          reservationData={{
            id: pendingReservationId,
            type: 'resto',
            amount: RESTO_RESERVATION_AMOUNT,
            customerName: reservationNom,
            customerPhone: reservationTel,
            customerEmail: reservationEmail || undefined,
            tableNumber: selectedTable.numero,
            date: format(reservationDate, 'dd/MM/yyyy', { locale: fr }),
          }}
        />
      )}

      {/* Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        confirmationCode={confirmationCode}
        tableNumber={selectedTable?.numero}
        date={reservationDate ? format(reservationDate, 'dd/MM/yyyy', { locale: fr }) : ''}
        type="resto"
      />
    </div>
  );
}