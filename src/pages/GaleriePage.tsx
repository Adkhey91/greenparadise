import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { X } from "lucide-react";

import table500 from "@/assets/table-500.png";
import table1000 from "@/assets/table-1000.png";
import table1500 from "@/assets/table-1500.png";
import table3000 from "@/assets/table-3000.png";
import table5000 from "@/assets/table-5000.png";

const galleryImages = [
  { id: 1, src: table1500, alt: "Table Famille avec balançoire", category: "Tables" },
  { id: 2, src: table1000, alt: "Kiosque décoratif", category: "Espaces" },
  { id: 3, src: table500, alt: "Table avec vue", category: "Tables" },
  { id: 4, src: table3000, alt: "Espace Premium avec transat", category: "Premium" },
  { id: 5, src: table5000, alt: "Grande table VIP", category: "VIP" },
];

const categories = ["Tout", "Tables", "Espaces", "Premium", "VIP"];

export default function GaleriePage() {
  const [selectedCategory, setSelectedCategory] = useState("Tout");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const filteredImages = selectedCategory === "Tout" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
            Galerie
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Découvrez Green Paradise en images. Un aperçu de notre cadre exceptionnel.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto container-padding">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  category === selectedCategory
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                onClick={() => setLightboxImage(image.src)}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                  index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${index === 0 ? "aspect-square" : "aspect-[4/3]"} overflow-hidden`}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-primary-foreground">
                    <p className="font-medium">{image.alt}</p>
                    <span className="text-sm text-primary-foreground/80">{image.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Image agrandie" 
            className="max-w-full max-h-[90vh] rounded-lg object-contain animate-scale-in"
          />
        </div>
      )}

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