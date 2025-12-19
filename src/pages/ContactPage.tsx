import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Instagram, Facebook, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.message) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.from("messages_contact").insert({
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone || null,
      sujet: formData.sujet || null,
      message: formData.message,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    setIsSuccess(true);
    setFormData({
      nom: "",
      email: "",
      telephone: "",
      sujet: "",
      message: "",
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto container-padding text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-fade-in">
            Contact
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Une question ? N'hésitez pas à nous contacter. Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Informations de contact
                </h2>
                <p className="text-muted-foreground mb-8">
                  Venez nous rendre visite ou contactez-nous directement par téléphone ou via nos réseaux sociaux.
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Adresse</h3>
                    <p className="text-sm text-muted-foreground">
                      Plateau Lalla Setti<br />
                      Tlemcen, Algérie
                    </p>
                  </div>
                </div>

                <a 
                  href="tel:+213770840081"
                  className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-secondary/30 transition-colors block group"
                >
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Téléphone</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">0770 84 00 81</p>
                  </div>
                </a>

                <div className="bg-muted/50 rounded-2xl p-5 flex items-start gap-4 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl nature-gradient flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Horaires</h3>
                    <p className="text-sm text-muted-foreground">
                      Tous les jours<br />
                      9h00 - 20h00
                    </p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-4">Suivez-nous sur les réseaux</h3>
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/greenparadisetlemcen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary hover:scale-110"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61571202361668"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-primary hover:scale-110"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* CTA */}
              <Button variant="nature" size="lg" className="w-full" asChild>
                <a href="tel:+213770840081">
                  <Phone className="w-5 h-5" />
                  Appeler maintenant
                </a>
              </Button>
            </div>

            {/* Contact Form + Map */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {/* Contact Form */}
              {isSuccess ? (
                <div className="bg-card rounded-3xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full nature-gradient flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Message envoyé !</h3>
                  <p className="text-muted-foreground">Merci, nous vous répondrons très bientôt.</p>
                  <Button variant="nature-outline" onClick={() => setIsSuccess(false)}>
                    Envoyer un autre message
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Envoyez-nous un message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Nom *</label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          placeholder="Votre nom"
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="votre@email.com"
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Téléphone (optionnel)</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="0770 XX XX XX"
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Sujet</label>
                      <select
                        name="sujet"
                        value={formData.sujet}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Sélectionner un sujet</option>
                        <option value="reservation">Réservation</option>
                        <option value="information">Demande d'information</option>
                        <option value="evenement">Événement privé</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Votre message..."
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="nature" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Envoi..." : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Map */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">Notre emplacement</h3>
                <div className="aspect-video rounded-3xl overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3253.0!2d-1.3147!3d34.8833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd78c8a3c8f0c0c1%3A0x0!2sLalla%20Setti%2C%20Tlemcen!5e0!3m2!1sfr!2sdz!4v1702000000000!5m2!1sfr!2sdz"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Emplacement Green Paradise"
                    className="grayscale-[30%] hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}