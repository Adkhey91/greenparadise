import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Users, TreePine, Sun, Eye } from "lucide-react";

const tables = [
  { id: 1, name: "Table A1", capacity: 4, zone: "Zone Ombragée", available: true },
  { id: 2, name: "Table A2", capacity: 6, zone: "Zone Ombragée", available: true },
  { id: 3, name: "Table B1", capacity: 4, zone: "Zone Panoramique", available: false },
  { id: 4, name: "Table B2", capacity: 8, zone: "Zone Panoramique", available: true },
  { id: 5, name: "Table C1", capacity: 4, zone: "Zone Jardin", available: true },
  { id: 6, name: "Table C2", capacity: 6, zone: "Zone Jardin", available: true },
  { id: 7, name: "Table D1", capacity: 10, zone: "Zone Famille", available: false },
  { id: 8, name: "Table D2", capacity: 8, zone: "Zone Famille", available: true },
];

const zones = [
  {
    name: "Zone Ombragée",
    icon: TreePine,
    description: "Tables sous les arbres, idéales pour les journées chaudes.",
  },
  {
    name: "Zone Panoramique",
    icon: Eye,
    description: "Vue imprenable sur Tlemcen, parfait pour les couchers de soleil.",
  },
  {
    name: "Zone Jardin",
    icon: Sun,
    description: "Au milieu des fleurs et de la verdure.",
  },
  {
    name: "Zone Famille",
    icon: Users,
    description: "Grandes tables pour les groupes et familles.",
  },
];

export default function PlanTablesPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Plan des Tables
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Découvrez nos différentes zones et choisissez l'emplacement idéal pour votre visite.
          </p>
        </div>
      </section>

      {/* Zones */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
            Nos Zones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {zones.map((zone) => (
              <div
                key={zone.name}
                className="bg-card rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl nature-gradient flex items-center justify-center mb-4">
                  <zone.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{zone.name}</h3>
                <p className="text-sm text-muted-foreground">{zone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-16 lg:py-20 bg-muted/50">
        <div className="container mx-auto container-padding">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
            Plan du Parc
          </h2>
          <div className="aspect-[16/9] max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-secondary/30 to-primary/10 flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center space-y-4">
              <MapPin className="w-16 h-16 text-primary/40 mx-auto" />
              <p className="text-muted-foreground">Plan interactif - Placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tables List */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">
            Toutes nos Tables
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`bg-card rounded-2xl p-5 border-2 transition-all ${
                  table.available
                    ? "border-secondary hover:border-primary"
                    : "border-border opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{table.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      table.available
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {table.available ? "Disponible" : "Occupée"}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {table.capacity} personnes
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {table.zone}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="nature" size="lg" asChild>
              <Link to="/reservation">Réserver une table</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
