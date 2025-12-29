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
  const { toast } = useToast();

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
      case 'libre': return 'bg-green-500 hover:bg-green-600';
      case 'occupee': return 'bg-red-500';
      case 'reservee': return 'bg-amber-500';
      case 'hs': return 'bg-gray-400';
      default: return 'bg-gray-300';
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
      const { error } = await supabase.from('resto_reservations').insert({
        table_id: selectedTable.id,
        nom: reservationNom,
        telephone: reservationTel,
        email: reservationEmail || null,
        date_reservation: format(reservationDate, 'yyyy-MM-dd'),
        heure: reservationHeure,
        nombre_personnes: reservationPersonnes,
        statut: 'en_attente'
      });

      if (error) throw error;

      toast({ 
        title: "Réservation réussie ! 📞", 
        description: "On va vous contacter dans 5 minutes pour confirmer.",
      });
      setIsDialogOpen(false);
      setSelectedTable(null);
      setReservationNom("");
      setReservationTel("");
      setReservationEmail("");
      setReservationDate(undefined);
      setReservationHeure("");
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", description: "Impossible de créer la réservation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter(item => item.categorie === activeCategory);
  const cartTotal = cart.reduce((sum, c) => sum + c.item.prix_dzd * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 nature-gradient opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920)',
            mixBlendMode: 'overlay'
          }}
        />
        <div className="relative z-10 text-center px-4 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <UtensilsCrossed className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Cuisine Traditionnelle</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Restaurant Jardin Vert
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Savourez une cuisine authentique dans un cadre naturel exceptionnel
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="gap-2">
              <Coffee className="w-5 h-5" />
              Voir le Menu
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2">
              <CalendarIcon className="w-5 h-5" />
              Réserver une Table
            </Button>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Notre Menu</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des plats préparés avec passion, à base de produits frais et locaux
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RestoCategorie)} className="w-full">
            <TabsList className="grid grid-cols-4 max-w-lg mx-auto mb-8 h-auto">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:nature-gradient data-[state=active]:text-white"
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(cat => (
              <TabsContent key={cat.value} value={cat.value}>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg" />
                        <CardContent className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun plat disponible dans cette catégorie</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                      <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all">
                        <div className="relative h-48 bg-muted">
                          {item.photo_url ? (
                            <img 
                              src={item.photo_url} 
                              alt={item.nom}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}
                          <Badge className="absolute top-3 right-3 nature-gradient text-white border-0">
                            {item.prix_dzd.toLocaleString()} DA
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{item.nom}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                          )}
                          {item.allergenes && item.allergenes.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 mb-3">
                              <AlertCircle className="w-3 h-3" />
                              {item.allergenes.join(', ')}
                            </div>
                          )}
                          <Button 
                            onClick={() => addToCart(item)}
                            className="w-full gap-2"
                            variant="outline"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Ajouter au panier
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

      {/* Table Plan Section */}
      <section className="py-16">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Plan des Tables</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Cliquez sur une table verte pour réserver
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm">Libre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm">Occupée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-sm">Réservée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400" />
                <span className="text-sm">Hors service</span>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="grid grid-cols-4 gap-4">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    disabled={table.statut !== 'libre'}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center text-white font-bold transition-all",
                      getTableColor(table.statut),
                      table.statut === 'libre' && "cursor-pointer transform hover:scale-105 shadow-md hover:shadow-lg",
                      table.statut !== 'libre' && "cursor-not-allowed opacity-80"
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

      {/* Reservation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              Réserver la Table {selectedTable?.numero}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Table pour <strong>{selectedTable?.capacite} personnes</strong> max
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
              className="w-full nature-gradient"
            >
              {submitting ? "Envoi..." : "Confirmer la réservation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Floating Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="nature-gradient gap-2 shadow-lg">
            <ShoppingCart className="w-5 h-5" />
            <span>{cartCount}</span>
            <span className="border-l border-white/30 pl-2 ml-2">
              {cartTotal.toLocaleString()} DA
            </span>
          </Button>
        </div>
      )}
    </Layout>
  );
}