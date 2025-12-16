import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, ImageIcon } from "lucide-react";

const galleryImages = [
  { id: 1, category: "Vue", alt: "Vue panoramique" },
  { id: 2, category: "Tables", alt: "Espace tables" },
  { id: 3, category: "Nature", alt: "Jardin" },
  { id: 4, category: "Vue", alt: "Coucher de soleil" },
  { id: 5, category: "Tables", alt: "Zone famille" },
  { id: 6, category: "Nature", alt: "Arbres" },
  { id: 7, category: "Vue", alt: "Panorama Tlemcen" },
  { id: 8, category: "Tables", alt: "Zone ombragée" },
  { id: 9, category: "Nature", alt: "Fleurs" },
];

export default function GaleriePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Galerie
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Découvrez Green Paradise en images. Un aperçu de notre cadre exceptionnel.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto container-padding">
          <div className="flex flex-wrap justify-center gap-2">
            {["Tout", "Vue", "Tables", "Nature"].map((filter) => (
              <button
                key={filter}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === "Tout"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/30 to-primary/10 cursor-pointer ${
                  index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
              >
                <div className={`${index === 0 ? "aspect-square" : "aspect-[4/3]"} flex items-center justify-center`}>
                  <div className="text-center space-y-3">
                    <ImageIcon className="w-12 h-12 text-primary/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">{image.alt}</p>
                    <span className="inline-block px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground">
                      {image.category}
                    </span>
                  </div>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary-foreground" />
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
            Envie de découvrir le parc en vrai ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Réservez votre table et venez profiter de ce cadre exceptionnel.
          </p>
          <Button variant="nature" size="lg" asChild>
            <Link to="/reservation">Réserver maintenant</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
