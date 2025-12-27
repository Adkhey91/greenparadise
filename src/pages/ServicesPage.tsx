import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UtensilsCrossed, 
  Coffee, 
  Gamepad2, 
  Wrench,
  RefreshCw
} from "lucide-react";

type SectionType = 'restaurant' | 'cafeteria' | 'activites' | 'services';

interface ContentSection {
  id: string;
  section_type: SectionType;
  titre: string;
  description: string | null;
  photo_url: string | null;
  prix_dzd: number | null;
  tags: string[];
}

const SECTION_CONFIG: Record<SectionType, { label: string; icon: typeof UtensilsCrossed; description: string }> = {
  restaurant: { 
    label: 'Restaurant', 
    icon: UtensilsCrossed, 
    description: 'Découvrez notre carte de plats traditionnels et grillades'
  },
  cafeteria: { 
    label: 'Cafétéria', 
    icon: Coffee, 
    description: 'Boissons fraîches, thé, café et pâtisseries'
  },
  activites: { 
    label: 'Activités', 
    icon: Gamepad2, 
    description: 'Divertissements pour petits et grands'
  },
  services: { 
    label: 'Services', 
    icon: Wrench, 
    description: 'Tout pour votre confort'
  },
};

export default function ServicesPage() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SectionType>('restaurant');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_sections')
      .select('*')
      .eq('actif', true)
      .order('ordre', { ascending: true });
    
    if (error) {
      console.error('Error fetching sections:', error);
    } else {
      setSections((data || []) as ContentSection[]);
    }
    setLoading(false);
  };

  const filteredSections = sections.filter(s => s.section_type === activeTab);
  const config = SECTION_CONFIG[activeTab];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
            Nos Services
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Restaurant, cafétéria, activités et bien plus encore pour un séjour parfait.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto container-padding">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionType)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
              {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => {
                const cfg = SECTION_CONFIG[type];
                const count = sections.filter(s => s.section_type === type).length;
                return (
                  <TabsTrigger 
                    key={type} 
                    value={type} 
                    className="flex flex-col items-center gap-2 py-4 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl border border-border data-[state=active]:border-primary transition-all"
                  >
                    <cfg.icon className="w-6 h-6" />
                    <span className="font-medium">{cfg.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(SECTION_CONFIG) as SectionType[]).map(type => {
              const cfg = SECTION_CONFIG[type];
              const items = sections.filter(s => s.section_type === type);
              
              return (
                <TabsContent key={type} value={type} className="space-y-8 animate-fade-in">
                  {/* Section Header */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl nature-gradient flex items-center justify-center">
                      <cfg.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{cfg.label}</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">{cfg.description}</p>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-3xl">
                      <cfg.icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Contenu à venir prochainement...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {/* Image */}
                          {item.photo_url ? (
                            <div className="aspect-[16/10] overflow-hidden">
                              <img
                                src={item.photo_url}
                                alt={item.titre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                              <cfg.icon className="w-12 h-12 text-primary/30" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-6 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-lg font-semibold text-foreground">
                                {item.titre}
                              </h3>
                              {item.prix_dzd && (
                                <span className="text-primary font-bold whitespace-nowrap">
                                  {item.prix_dzd} DA
                                </span>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {item.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* Info cards */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(SECTION_CONFIG) as SectionType[]).map((type, index) => {
              const cfg = SECTION_CONFIG[type];
              const count = sections.filter(s => s.section_type === type).length;
              
              return (
                <div 
                  key={type}
                  className="bg-card rounded-2xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab(type)}
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <cfg.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{cfg.label}</h3>
                  <p className="text-sm text-muted-foreground">{cfg.description}</p>
                  {count > 0 && (
                    <Badge variant="outline">{count} disponible{count > 1 ? 's' : ''}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
