import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Flame, Gamepad2, TreePine, Armchair, Star } from "lucide-react";

import table500 from "@/assets/table-500.png";
import table1000 from "@/assets/table-1000.png";
import table1500 from "@/assets/table-1500.png";
import table3000 from "@/assets/table-3000.png";
import table5000 from "@/assets/table-5000.png";

const formules = [
  {
    id: 1,
    name: "Formule Essentielle",
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

export default function PlanTablesPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
            Nos Formules
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
                      <Button variant="nature" size="sm" asChild className="group-hover:scale-105 transition-transform">
                        <Link to="/reservation">Réserver</Link>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="nature" size="lg" asChild>
              <a href="tel:+213770840081">Appeler : 0770 84 00 81</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}