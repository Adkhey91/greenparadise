import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar, 
  Printer,
  QrCode,
  AlertCircle,
  TreePine,
  Wallet,
  MapPin,
  LogIn,
  UtensilsCrossed
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";

interface Reservation {
  id: string;
  reservation_number: string;
  secure_token: string;
  nom: string;
  telephone: string;
  email: string | null;
  date_reservation: string;
  formule: string;
  nombre_personnes: number | null;
  statut: string | null;
  payment_status: string | null;
  total_price: number | null;
  table_id: string | null;
  table_number_snapshot: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  venue_id: string | null;
}

export default function TicketPage() {
  const { toast } = useToast();
  const [telephone, setTelephone] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!telephone.trim() || !reservationNumber.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez entrer votre téléphone et numéro de réservation",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setNotFound(false);
    setReservation(null);

    const cleanPhone = telephone.replace(/\s/g, "");
    const cleanReservationNumber = reservationNumber.trim().toUpperCase();

    const { data, error: invokeError } = await supabase.functions.invoke("ticket-lookup", {
      body: { reservationNumber: cleanReservationNumber, phone: cleanPhone },
    });

    setSearching(false);

    if (invokeError || !(data as any)?.reservation) {
      setNotFound(true);
      return;
    }

    setReservation(((data as any).reservation as Reservation) || null);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusInfo = (statut: string | null) => {
    switch (statut) {
      case "confirmee":
        return {
          label: "Confirmée",
          icon: CheckCircle,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      case "checked_in":
        return {
          label: "Entrée validée",
          icon: LogIn,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      case "annulee":
        return {
          label: "Annulée",
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "no_show":
        return {
          label: "Non présenté",
          icon: AlertCircle,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
      default:
        return {
          label: "En attente",
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
        };
    }
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 4) + " ** ** " + phone.slice(-2);
  };

  // Determine venue type for theming
  const isRestaurant = reservation?.reservation_number?.startsWith("RPR-");
  const venueName = isRestaurant ? "Le Repère" : "Jardin";
  const VenueIcon = isRestaurant ? UtensilsCrossed : TreePine;

  // Search form view
  if (!reservation) {
    return (
      <Layout>
        <section className="py-24 lg:py-32">
          <div className="container mx-auto container-padding">
            <div className="max-w-md mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl nature-gradient flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Retrouver ma réservation
                </h1>
                <p className="text-muted-foreground">
                  Entrez vos informations pour accéder à votre ticket
                </p>
              </div>

              {/* Search Form */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Numéro de téléphone
                      </label>
                      <Input
                        type="tel"
                        placeholder="0770 XX XX XX"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Numéro de réservation
                      </label>
                      <Input
                        type="text"
                        placeholder="GRN-XXXX ou RPR-XXXX"
                        value={reservationNumber}
                        onChange={(e) => setReservationNumber(e.target.value.toUpperCase())}
                        className="h-12 font-mono uppercase"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 gap-2 nature-gradient text-primary-foreground hover:opacity-90"
                      disabled={searching}
                    >
                      {searching ? (
                        <>
                          <Search className="w-4 h-4 animate-pulse" />
                          Recherche...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Rechercher
                        </>
                      )}
                    </Button>
                  </form>

                  {notFound && (
                    <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700 font-medium">
                        Réservation non trouvée
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Vérifiez vos informations et réessayez
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help */}
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pas encore de réservation ?
                </p>
                <Button variant="outline" asChild>
                  <Link to="/reservation">
                    Faire une réservation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Ticket view
  const statusInfo = getStatusInfo(reservation.statut);
  const StatusIcon = statusInfo.icon;
  const isConfirmed = reservation.statut === "confirmee" || reservation.statut === "checked_in";
  const isCheckedIn = reservation.statut === "checked_in";
  const isPaid = reservation.payment_status === "paid_cash" || reservation.payment_status === "paid";
  
  // QR Code value - encode URL with secure token
  const qrValue = reservation.secure_token 
    ? `${window.location.origin}/ticket?token=${reservation.secure_token}`
    : null;

  return (
    <Layout>
      <section className="py-16 lg:py-24 print:py-4">
        <div className="container mx-auto container-padding">
          <div className="max-w-lg mx-auto">
            {/* Ticket Card */}
            <div className={`rounded-3xl shadow-xl overflow-hidden print:shadow-none print:border ${
              isRestaurant 
                ? "bg-chalet-cream" 
                : "bg-card"
            }`}>
              {/* Header */}
              <div className={`p-6 text-center print:bg-gray-100 print:text-gray-900 ${
                isRestaurant 
                  ? "bg-gradient-to-br from-chalet-charcoal to-chalet-wood text-chalet-cream"
                  : "nature-gradient text-primary-foreground"
              }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <VenueIcon className="w-6 h-6" />
                  <span className="font-bold text-lg">Green Paradise</span>
                </div>
                <h1 className="text-2xl font-bold">Ticket {venueName}</h1>
              </div>

              {/* Status Banner */}
              <div className={`${statusInfo.bg} ${statusInfo.border} border-b px-6 py-4`}>
                <div className="flex items-center justify-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                  <span className={`font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {!isConfirmed && reservation.statut === "en_attente" && (
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    En attente de confirmation par l'équipe
                  </p>
                )}
              </div>

              {/* QR Code - Only if confirmed AND has secure_token */}
              {isConfirmed && qrValue ? (
                <div className={`p-6 flex flex-col items-center border-b border-dashed ${
                  isRestaurant ? "border-chalet-beige" : "border-border"
                }`}>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    isRestaurant 
                      ? "bg-white border-2 border-chalet-gold/30" 
                      : "bg-white"
                  }`}>
                    <QRCodeSVG
                      value={qrValue}
                      size={180}
                      level="H"
                      includeMargin={true}
                      fgColor={"#000000"}
                    />
                  </div>
                  <p className={`text-xs mt-3 text-center ${
                    isRestaurant ? "text-chalet-warm" : "text-muted-foreground"
                  }`}>
                    Présentez ce QR code à l'entrée
                  </p>
                  {/* Debug info - only visible in dev */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-[10px] mt-2 text-gray-400 break-all max-w-[200px] text-center">
                      Debug: {qrValue}
                    </p>
                  )}
                </div>
              ) : isConfirmed && !qrValue ? (
                <div className="p-6 flex flex-col items-center border-b border-dashed">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                  </div>
                  <p className="text-sm mt-3 text-center text-amber-700 font-medium">
                    Ticket invalide - Token manquant
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Contactez l'accueil pour assistance
                  </p>
                </div>
              ) : null}

              {/* Pending status message */}
              {reservation.statut === "en_attente" && (
                <div className="p-6 flex flex-col items-center border-b border-dashed">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                    isRestaurant 
                      ? "bg-chalet-beige" 
                      : "bg-amber-50"
                  }`}>
                    <Clock className={`w-10 h-10 ${
                      isRestaurant ? "text-chalet-gold" : "text-amber-500"
                    }`} />
                  </div>
                  <p className={`text-lg font-semibold text-center ${
                    isRestaurant ? "text-chalet-charcoal" : "text-amber-700"
                  }`}>
                    En attente de confirmation
                  </p>
                  <p className={`text-sm mt-2 text-center max-w-xs ${
                    isRestaurant ? "text-chalet-warm" : "text-amber-600"
                  }`}>
                    Votre demande est en cours de traitement. Le QR code apparaîtra une fois confirmée.
                  </p>
                </div>
              )}

              {/* Reservation Number */}
              <div className={`px-6 py-4 border-b text-center ${
                isRestaurant 
                  ? "bg-chalet-beige/50 border-chalet-beige" 
                  : "bg-muted/30 border-border"
              }`}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Numéro de réservation
                </p>
                <p className={`text-2xl font-black tracking-widest mt-1 ${
                  isRestaurant ? "text-chalet-charcoal" : "text-primary"
                }`}>
                  {reservation.reservation_number}
                </p>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                {/* Venue Badge */}
                <div className="flex justify-center">
                  <Badge className={`gap-2 px-4 py-2 text-sm ${
                    isRestaurant 
                      ? "bg-chalet-charcoal text-chalet-cream" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <VenueIcon className="w-4 h-4" />
                    {venueName}
                  </Badge>
                </div>

                {/* Guest Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Nom</p>
                    <p className={`font-semibold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                      {reservation.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Téléphone</p>
                    <p className={`font-semibold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                      {maskPhone(reservation.telephone)}
                    </p>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className={`w-4 h-4 mt-0.5 ${isRestaurant ? "text-chalet-gold" : "text-primary"}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className={`font-semibold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                        {format(parseISO(reservation.date_reservation), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className={`w-4 h-4 mt-0.5 ${isRestaurant ? "text-chalet-gold" : "text-primary"}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Personnes</p>
                      <p className={`font-semibold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                        {reservation.nombre_personnes || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className={`p-4 rounded-xl border ${
                  isRestaurant 
                    ? "bg-chalet-beige/30 border-chalet-gold/20" 
                    : "bg-primary/5 border-primary/20"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Formule</p>
                      <p className={`font-semibold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                        {reservation.formule}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Prix</p>
                      <p className={`text-xl font-bold ${isRestaurant ? "text-chalet-gold" : "text-primary"}`}>
                        {reservation.total_price?.toLocaleString() || "-"} DA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isRestaurant ? "bg-chalet-beige/30" : "bg-muted/50"
                }`}>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Paiement</span>
                  </div>
                  <Badge variant={isPaid ? "default" : "outline"} className={
                    isPaid && isRestaurant ? "bg-chalet-charcoal text-chalet-cream" : ""
                  }>
                    {isPaid ? "Payé" : "Sur place"}
                  </Badge>
                </div>

                {/* Table assignment */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  isRestaurant 
                    ? "bg-chalet-beige/50 border-chalet-gold/30" 
                    : "bg-primary/5 border-primary/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isRestaurant ? "bg-chalet-charcoal" : "bg-primary"
                    }`}>
                      <MapPin className={`w-5 h-5 ${isRestaurant ? "text-chalet-cream" : "text-primary-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Table</p>
                      <p className={`text-lg font-bold ${isRestaurant ? "text-chalet-charcoal" : "text-foreground"}`}>
                        {reservation.table_number_snapshot || (reservation as any).table_label || "À l'accueil"}
                      </p>
                    </div>
                  </div>
                  {(reservation.table_number_snapshot || (reservation as any).table_label) && (
                    <Badge className={`text-lg px-3 py-1 ${
                      isRestaurant 
                        ? "bg-chalet-gold text-chalet-charcoal" 
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {reservation.table_number_snapshot || (reservation as any).table_label}
                    </Badge>
                  )}
                </div>

                {/* Checked in status */}
                {isCheckedIn && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                    <LogIn className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold text-blue-700">
                      Entrée validée
                    </p>
                    {reservation.checked_in_at && (
                      <p className="text-xs text-blue-600">
                        {format(parseISO(reservation.checked_in_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${
                isRestaurant 
                  ? "bg-chalet-beige/30 border-chalet-beige" 
                  : "bg-muted/30 border-border"
              }`}>
                <p className="text-xs text-center text-muted-foreground">
                  Green Paradise • Plateau Lalla Setti, Tlemcen
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  Tél: 0770 84 00 81
                </p>
              </div>
            </div>

            {/* Actions (not printed) */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
              <Button 
                className={`flex-1 gap-2 ${
                  isRestaurant 
                    ? "bg-chalet-charcoal hover:bg-chalet-wood text-chalet-cream"
                    : "nature-gradient text-primary-foreground hover:opacity-90"
                }`}
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Imprimer / Enregistrer PDF
              </Button>
              <Button 
                variant="outline" 
                className={`flex-1 ${
                  isRestaurant && "border-chalet-beige hover:bg-chalet-beige/50"
                }`}
                onClick={() => setReservation(null)}
              >
                Autre réservation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:py-4,
          .print\\:py-4 * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}
