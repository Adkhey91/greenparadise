import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreePine, MapPin, Calendar, Users, ArrowRight, Leaf, Sun, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

import heroImage from "@/assets/table-1500.png";

const features = [
  {
    icon: TreePine,
    title: "Nature Préservée",
    description: "Un cadre verdoyant au cœur du plateau Lalla Setti.",
  },
  {
    icon: Sun,
    title: "Vue Panoramique",
    description: "Une vue imprenable sur la ville de Tlemcen.",
  },
  {
    icon: Users,
    title: "Espace Familial",
    description: "Idéal pour les familles et groupes d'amis.",
  },
  {
    icon: Leaf,
    title: "Détente Absolue",
    description: "Échappez au stress de la vie quotidienne.",
  },
];

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 nature-gradient opacity-10" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-secondary-foreground text-sm font-medium animate-fade-in">
              <MapPin className="w-4 h-4" />
              Plateau Lalla Setti, Tlemcen
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Bienvenue à{" "}
              <span className="text-primary">Green Paradise</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Un havre de paix au cœur de la nature. Découvrez notre espace de détente avec vue panoramique sur Tlemcen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button variant="nature" size="lg" asChild>
                <Link to="/reservation">
                  <Calendar className="w-5 h-5" />
                  Réserver maintenant
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/reservation">
                  Voir nos formules
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Quick Contact */}
            <a 
              href="tel:+213770840081"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Phone className="w-4 h-4" />
              <span>0770 84 00 81</span>
            </a>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Pourquoi choisir Green Paradise ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un lieu unique qui allie nature, confort et tranquillité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-card rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl nature-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto container-padding">
          <div className="nature-gradient rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                Prêt à vivre l'expérience Green Paradise ?
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Réservez votre table dès maintenant et profitez d'un moment inoubliable en famille ou entre amis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  asChild
                >
                  <Link to="/reservation">
                    <Calendar className="w-5 h-5" />
                    Réserver une table
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href="tel:+213770840081">
                    <Phone className="w-5 h-5" />
                    0770 84 00 81
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Un espace pensé pour votre bien-être
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Green Paradise vous offre un cadre exceptionnel sur le plateau Lalla Setti. 
                Profitez de nos espaces aménagés, de notre vue panoramique et de notre 
                ambiance chaleureuse pour des moments de détente inoubliables.
              </p>
              <ul className="space-y-3">
                {["Tables spacieuses en plein air", "Zone ombragée et ventilée", "Barbecue disponible", "Jeux pour enfants", "Parking gratuit"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-3 h-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild>
                <Link to="/contact">
                  Nous contacter
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            
            {/* Image */}
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <img 
                src={heroImage} 
                alt="Espace détente Green Paradise" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}