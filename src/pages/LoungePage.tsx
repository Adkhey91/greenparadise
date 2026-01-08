import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coffee, 
  UtensilsCrossed, 
  IceCream, 
  Wine, 
  Leaf,
  Search,
  AlertCircle,
  Sparkles,
  RefreshCw
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
  { value: 'boissons', label: 'Boissons & Cocktails', icon: Wine },
];

export default function LoungePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RestoCategorie>('plats');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('resto_menu_items')
      .select('*')
      .eq('disponible', true)
      .order('ordre');

    if (data) setMenuItems(data as MenuItem[]);
    setLoading(false);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = item.categorie === activeCategory;
    const matchesSearch = searchQuery === "" || 
      item.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-chalet-charcoal via-chalet-wood/90 to-chalet-warm/80" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920)'
          }}
        />
        
        <div className="relative z-10 text-center px-4 py-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-chalet-gold/15 backdrop-blur-md rounded-full mb-8 border border-chalet-gold/25">
            <Coffee className="w-4 h-4 text-chalet-gold" />
            <span className="text-chalet-gold/90 font-medium tracking-widest uppercase text-xs">Bar & Cafétéria</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-chalet-cream mb-6 tracking-tight">
            Le <span className="font-semibold">Lounge</span>
          </h1>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-chalet-gold/60 to-transparent mx-auto mb-6" />
          <p className="text-lg text-chalet-cream/70 max-w-xl mx-auto font-light leading-relaxed">
            Un espace de détente raffiné pour savourer nos spécialités et cocktails signature
          </p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-chalet-cream to-transparent" />
      </section>

      {/* Menu Section */}
      <section className="py-20 bg-chalet-cream">
        <div className="container mx-auto container-padding">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-chalet-warm uppercase tracking-[0.3em] text-xs font-medium mb-4">Notre Carte</span>
            <h2 className="text-4xl md:text-5xl font-light text-chalet-charcoal mb-4">
              Menu <span className="font-semibold">Lounge</span>
            </h2>
            <div className="w-16 h-px bg-chalet-gold/50 mx-auto mb-6" />
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-chalet-warm/50" />
              <Input
                placeholder="Rechercher un plat, boisson..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-full border-chalet-beige bg-white focus:border-chalet-gold/50"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RestoCategorie)} className="w-full">
            <TabsList className="flex justify-center gap-2 max-w-3xl mx-auto mb-14 h-auto bg-transparent p-0 flex-wrap">
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
                      <cat.icon className="w-10 h-10 text-chalet-warm/40" />
                    </div>
                    <p className="text-chalet-wood-light text-lg">
                      {searchQuery ? "Aucun résultat pour cette recherche" : "Aucun item disponible"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map(item => (
                      <div 
                        key={item.id} 
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-chalet-beige/50"
                      >
                        {/* Image */}
                        <div className="relative h-52 overflow-hidden">
                          {item.photo_url ? (
                            <img 
                              src={item.photo_url} 
                              alt={item.nom}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chalet-beige/30 to-chalet-cream">
                              <cat.icon className="w-14 h-14 text-chalet-warm/20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-chalet-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-chalet-charcoal px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                            {item.prix_dzd.toLocaleString()} DA
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="font-semibold text-lg mb-2 text-chalet-charcoal group-hover:text-chalet-wood transition-colors">
                            {item.nom}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-chalet-wood-light mb-4 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
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

      {/* Ambiance Section */}
      <section className="py-20 bg-gradient-to-b from-chalet-cream to-white">
        <div className="container mx-auto container-padding">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="w-10 h-10 text-chalet-gold mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-light text-chalet-charcoal mb-6">
              Une Ambiance <span className="font-semibold">Unique</span>
            </h2>
            <p className="text-chalet-wood-light text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Le Lounge vous accueille dans un cadre chaleureux et moderne, idéal pour vos moments de détente 
              entre amis ou en famille. Savourez nos créations dans une atmosphère apaisante.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-6 py-2.5 text-sm border-chalet-gold/30 text-chalet-charcoal">
                <Coffee className="w-4 h-4 mr-2" />
                Café Premium
              </Badge>
              <Badge variant="outline" className="px-6 py-2.5 text-sm border-chalet-gold/30 text-chalet-charcoal">
                <Wine className="w-4 h-4 mr-2" />
                Cocktails Signature
              </Badge>
              <Badge variant="outline" className="px-6 py-2.5 text-sm border-chalet-gold/30 text-chalet-charcoal">
                <IceCream className="w-4 h-4 mr-2" />
                Pâtisseries Maison
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
