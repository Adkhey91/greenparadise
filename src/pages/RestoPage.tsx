import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { 
  UtensilsCrossed, 
  CalendarIcon, 
  Leaf,
  IceCream,
  Wine,
  AlertCircle,
  RefreshCw,
  Star,
  ArrowRight,
  Clock,
  MapPin
} from "lucide-react";

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

const CATEGORIES: { value: RestoCategorie; label: string; icon: React.ElementType }[] = [
  { value: 'entrees', label: 'Entrées', icon: Leaf },
  { value: 'plats', label: 'Plats', icon: UtensilsCrossed },
  { value: 'desserts', label: 'Desserts', icon: IceCream },
  { value: 'boissons', label: 'Boissons', icon: Wine },
];

export default function RestoPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RestoCategorie>('plats');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('resto_menu_items')
        .select('*')
        .eq('disponible', true)
        .order('ordre');

      if (data) setMenuItems(data as MenuItem[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => item.categorie === activeCategory);

  return (
    <Layout>
      {/* Hero Section with navbar visible */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
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
        
        <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-chalet-gold/15 backdrop-blur-md rounded-full mb-10 border border-chalet-gold/25">
            <span className="w-1.5 h-1.5 rounded-full bg-chalet-gold animate-pulse" />
            <span className="text-chalet-gold/90 font-medium tracking-widest uppercase text-xs">Restaurant Gastronomique</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-chalet-cream mb-6 tracking-tight">
            Le <span className="font-semibold">Repère</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-chalet-gold/60 to-transparent mx-auto mb-8" />
          <p className="text-lg md:text-xl text-chalet-cream/70 max-w-xl mx-auto mb-12 font-light leading-relaxed">
            Une expérience culinaire d'exception dans l'écrin chaleureux d'un chalet de montagne
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-chalet-gold/90 hover:bg-chalet-gold text-chalet-charcoal font-medium gap-3 px-8 h-14 rounded-full transition-all hover:scale-105"
              onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <UtensilsCrossed className="w-5 h-5" />
              Découvrir la Carte
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent text-chalet-cream/90 border-chalet-cream/20 hover:bg-chalet-cream/10 hover:border-chalet-cream/40 gap-3 px-8 h-14 rounded-full transition-all"
              asChild
            >
              <Link to="/reservation">
                <CalendarIcon className="w-5 h-5" />
                Réserver une table
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-chalet-cream to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-chalet-cream">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-chalet-gold/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-chalet-gold" />
              </div>
              <h3 className="font-semibold text-chalet-charcoal mb-2">Cuisine Raffinée</h3>
              <p className="text-sm text-chalet-wood-light">Des plats élaborés avec des produits frais et locaux</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-chalet-gold/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-chalet-gold" />
              </div>
              <h3 className="font-semibold text-chalet-charcoal mb-2">Cadre Unique</h3>
              <p className="text-sm text-chalet-wood-light">Ambiance chalet authentique au cœur de la nature</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-chalet-gold/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-chalet-gold" />
              </div>
              <h3 className="font-semibold text-chalet-charcoal mb-2">Service Premium</h3>
              <p className="text-sm text-chalet-wood-light">Une équipe attentive pour une expérience inoubliable</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu-section" className="py-24 bg-chalet-cream">
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
            <TabsList className="flex justify-center gap-2 max-w-2xl mx-auto mb-14 h-auto bg-transparent p-0 flex-wrap">
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
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-chalet-warm" />
                    <p className="mt-4 text-chalet-wood-light">Chargement...</p>
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
                            <div className="flex items-center gap-1.5 text-xs text-chalet-warm">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{item.allergenes.join(', ')}</span>
                            </div>
                          )}
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-chalet-cream to-white">
        <div className="container mx-auto container-padding">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-chalet-charcoal mb-6">
              Réservez votre <span className="font-semibold">Table</span>
            </h2>
            <p className="text-chalet-wood-light text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Pour une soirée inoubliable au Repère, réservez dès maintenant. 
              Notre équipe vous accueillera dans un cadre chaleureux et raffiné.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream gap-3 px-8 h-14 rounded-full transition-all hover:scale-105"
                asChild
              >
                <Link to="/reservation">
                  <CalendarIcon className="w-5 h-5" />
                  Réserver maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-chalet-wood-light">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>12h-14h30 • 19h-22h</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Green Paradise, Alger</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
