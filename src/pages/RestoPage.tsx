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
    <Layout>
      {/* Hero Section - Chalet Prestige */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 chalet-gradient opacity-95" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1920)',
            mixBlendMode: 'overlay'
          }}
        />
        {/* Decorative wood texture overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800)', backgroundSize: '400px' }} />
        
        <div className="relative z-10 text-center px-4 py-20">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-chalet-gold/20 backdrop-blur-sm rounded-full mb-8 border border-chalet-gold/30">
            <UtensilsCrossed className="w-5 h-5 text-chalet-gold" />
            <span className="text-chalet-gold font-medium tracking-wide uppercase text-sm">Gastronomie d'Exception</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-chalet-cream mb-6 tracking-tight">
            Le Chalet
          </h1>
          <p className="text-xl text-chalet-cream/80 max-w-2xl mx-auto mb-10 font-light">
            Une expérience culinaire raffinée dans un cadre chaleureux et prestigieux
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-chalet-gold hover:bg-chalet-gold/90 text-chalet-charcoal font-semibold gap-2 px-8">
              <Coffee className="w-5 h-5" />
              Découvrir le Menu
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-chalet-cream border-chalet-cream/40 hover:bg-chalet-cream/10 gap-2 px-8">
              <CalendarIcon className="w-5 h-5" />
              Réserver une Table
            </Button>
          </div>
        </div>
      </section>

      {/* Menu Section - Chalet Style */}
      <section className="py-20 bg-chalet-cream">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-14">
            <span className="text-chalet-gold uppercase tracking-widest text-sm font-medium mb-3 block">Nos Créations</span>
            <h2 className="text-4xl font-bold text-chalet-charcoal mb-4">La Carte</h2>
            <p className="text-chalet-wood-light max-w-2xl mx-auto font-light">
              Une sélection raffinée de mets préparés avec passion et produits nobles
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RestoCategorie)} className="w-full">
            <TabsList className="grid grid-cols-4 max-w-lg mx-auto mb-10 h-auto bg-chalet-beige/50 p-1 rounded-xl">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="flex flex-col items-center gap-1 py-3 rounded-lg data-[state=active]:bg-chalet-wood data-[state=active]:text-chalet-cream transition-all"
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(cat => (
              <TabsContent key={cat.value} value={cat.value}>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3].map(i => (
                      <Card key={i} className="animate-pulse bg-white border-chalet-beige">
                        <div className="h-52 bg-chalet-beige rounded-t-xl" />
                        <CardContent className="p-5 space-y-3">
                          <div className="h-4 bg-chalet-beige rounded w-3/4" />
                          <div className="h-3 bg-chalet-beige rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <UtensilsCrossed className="w-16 h-16 mx-auto text-chalet-beige mb-4" />
                    <p className="text-chalet-wood-light">Aucun plat disponible dans cette catégorie</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map(item => (
                      <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md rounded-xl">
                        <div className="relative h-52 bg-chalet-beige">
                          {item.photo_url ? (
                            <img 
                              src={item.photo_url} 
                              alt={item.nom}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chalet-beige to-chalet-cream">
                              <UtensilsCrossed className="w-16 h-16 text-chalet-wood-light/30" />
                            </div>
                          )}
                          <Badge className="absolute top-4 right-4 bg-chalet-charcoal text-chalet-gold border-0 font-semibold px-3 py-1">
                            {item.prix_dzd.toLocaleString()} DA
                          </Badge>
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-semibold text-lg mb-2 text-chalet-charcoal">{item.nom}</h3>
                          {item.description && (
                            <p className="text-sm text-chalet-wood-light mb-4 line-clamp-2">{item.description}</p>
                          )}
                          {item.allergenes && item.allergenes.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-chalet-gold mb-4">
                              <AlertCircle className="w-3 h-3" />
                              {item.allergenes.join(', ')}
                            </div>
                          )}
                          <Button 
                            onClick={() => addToCart(item)}
                            className="w-full gap-2 bg-chalet-wood hover:bg-chalet-charcoal text-chalet-cream"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Ajouter
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Table Plan Section - Chalet Style */}
      <section className="py-20 bg-gradient-to-b from-chalet-beige/30 to-chalet-cream">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-14">
            <span className="text-chalet-gold uppercase tracking-widest text-sm font-medium mb-3 block">Votre Table</span>
            <h2 className="text-4xl font-bold text-chalet-charcoal mb-4">Plan de Salle</h2>
            <p className="text-chalet-wood-light max-w-2xl mx-auto mb-8 font-light">
              Sélectionnez votre table préférée
            </p>
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-chalet-gold" />
                <span className="text-sm text-chalet-charcoal">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-600" />
                <span className="text-sm text-chalet-charcoal">Occupée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-chalet-wood" />
                <span className="text-sm text-chalet-charcoal">Réservée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-chalet-beige" />
                <span className="text-sm text-chalet-charcoal">Hors service</span>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="p-10 bg-white/80 backdrop-blur border-chalet-beige shadow-xl rounded-2xl">
              <div className="grid grid-cols-4 gap-5">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    disabled={table.statut !== 'libre'}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center font-bold transition-all duration-300",
                      table.statut === 'libre' && "bg-chalet-gold text-chalet-charcoal cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl hover:bg-chalet-gold/90",
                      table.statut === 'occupee' && "bg-rose-600 text-white cursor-not-allowed",
                      table.statut === 'reservee' && "bg-chalet-wood text-chalet-cream cursor-not-allowed",
                      table.statut === 'hs' && "bg-chalet-beige text-chalet-wood-light cursor-not-allowed",
                      table.statut !== 'libre' && "opacity-80"
                    )}
                  >
                    <span className="text-2xl">{table.numero}</span>
                    <span className="text-xs opacity-80">{table.capacite}p</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Reservation Dialog - Chalet Style */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-chalet-cream border-chalet-beige">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-chalet-charcoal">
              <UtensilsCrossed className="w-5 h-5 text-chalet-gold" />
              Réserver la Table {selectedTable?.numero}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-chalet-beige/50 rounded-lg border border-chalet-beige">
              <p className="text-sm text-chalet-wood">
                Table pour <strong className="text-chalet-charcoal">{selectedTable?.capacite} personnes</strong> max
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input 
                  placeholder="Votre nom"
                  value={reservationNom}
                  onChange={(e) => setReservationNom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input 
                  placeholder="0X XX XX XX XX"
                  value={reservationTel}
                  onChange={(e) => setReservationTel(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email (optionnel)</Label>
              <Input 
                type="email"
                placeholder="email@exemple.com"
                value={reservationEmail}
                onChange={(e) => setReservationEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reservationDate ? format(reservationDate, "dd/MM/yyyy", { locale: fr }) : "Choisir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reservationDate}
                      onSelect={setReservationDate}
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Heure *</Label>
                <Select value={reservationHeure} onValueChange={setReservationHeure}>
                  <SelectTrigger>
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEURES.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre de personnes</Label>
              <Select 
                value={reservationPersonnes.toString()} 
                onValueChange={(v) => setReservationPersonnes(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(selectedTable?.capacite || 4)].map((_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1} personne{i > 0 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleReservation}
              disabled={submitting}
              className="w-full bg-chalet-gold hover:bg-chalet-gold/90 text-chalet-charcoal font-semibold"
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
    </Layout>
  );
}