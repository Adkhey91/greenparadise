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
  Phone, 
  Printer,
  QrCode,
  AlertCircle,
  TreePine,
  Wallet,
  MapPin,
  LogIn
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
  confirmed_at: string | null;
  checked_in_at: string | null;
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

    // Clean phone number (remove spaces)
    const cleanPhone = telephone.replace(/\s/g, '');
    const cleanReservationNumber = reservationNumber.trim().toUpperCase();

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("reservation_number", cleanReservationNumber)
      .single();

    setSearching(false);

    if (error || !data) {
      setNotFound(true);
      return;
    }

    // Verify phone matches (last 8 digits comparison for flexibility)
    const dbPhoneClean = data.telephone.replace(/\s/g, '');
    const inputPhoneLast8 = cleanPhone.slice(-8);
    const dbPhoneLast8 = dbPhoneClean.slice(-8);

    if (inputPhoneLast8 !== dbPhoneLast8) {
      setNotFound(true);
      toast({
        title: "Non trouvé",
        description: "Le numéro de téléphone ne correspond pas",
        variant: "destructive",
      });
      return;
    }

    setReservation(data as Reservation);
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
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800",
        };
      case "checked_in":
        return {
          label: "Entrée validée",
          icon: LogIn,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
        };
      case "annulee":
        return {
          label: "Annulée",
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
        };
      case "no_show":
        return {
          label: "Non présenté",
          icon: AlertCircle,
          color: "text-gray-600",
          bg: "bg-gray-50 dark:bg-gray-900/20",
          border: "border-gray-200 dark:border-gray-800",
        };
      default:
        return {
          label: "En attente",
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
        };
    }
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 4) + " ** ** " + phone.slice(-2);
  };

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
                        placeholder="GRN-XXXX"
                        value={reservationNumber}
                        onChange={(e) => setReservationNumber(e.target.value.toUpperCase())}
                        className="h-12 font-mono uppercase"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="nature" 
                      className="w-full h-12 gap-2"
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
                    <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        Réservation non trouvée
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
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

  return (
    <Layout>
      <section className="py-16 lg:py-24 print:py-4">
        <div className="container mx-auto container-padding">
          <div className="max-w-lg mx-auto">
            {/* Ticket Card */}
            <div className="bg-card rounded-3xl shadow-xl overflow-hidden print:shadow-none print:border">
              {/* Header */}
              <div className="nature-gradient p-6 text-center text-primary-foreground print:bg-gray-100 print:text-gray-900">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TreePine className="w-6 h-6" />
                  <span className="font-bold text-lg">Green Paradise</span>
                </div>
                <h1 className="text-2xl font-bold">Ticket de Réservation</h1>
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

              {/* QR Code (only if confirmed) */}
              {isConfirmed && (
                <div className="p-6 flex flex-col items-center border-b border-dashed">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCodeSVG
                      value={reservation.secure_token}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Présentez ce QR code à l'entrée
                  </p>
                </div>
              )}

              {/* Reservation Number */}
              <div className="px-6 py-4 bg-muted/30 border-b text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Numéro de réservation
                </p>
                <p className="text-2xl font-black tracking-widest text-primary mt-1">
                  {reservation.reservation_number}
                </p>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                {/* Guest Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Nom</p>
                    <p className="font-semibold text-foreground">{reservation.nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Téléphone</p>
                    <p className="font-semibold text-foreground">{maskPhone(reservation.telephone)}</p>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold text-foreground">
                        {format(parseISO(reservation.date_reservation), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Personnes</p>
                      <p className="font-semibold text-foreground">
                        {reservation.nombre_personnes || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Formule</p>
                      <p className="font-semibold text-foreground">{reservation.formule}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Prix</p>
                      <p className="text-xl font-bold text-primary">
                        {reservation.total_price?.toLocaleString() || "-"} DA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Paiement</span>
                  </div>
                  <Badge variant={isPaid ? "default" : "outline"}>
                    {isPaid ? "Payé" : "Sur place"}
                  </Badge>
                </div>

                {/* Table assignment (if any) */}
                {reservation.table_id && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Table assignée</span>
                    </div>
                    <Badge variant="secondary">Oui</Badge>
                  </div>
                )}

                {/* Checked in status */}
                {isCheckedIn && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
                    <LogIn className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold text-blue-700 dark:text-blue-400">
                      Entrée validée
                    </p>
                    {reservation.checked_in_at && (
                      <p className="text-xs text-blue-600 dark:text-blue-500">
                        {format(parseISO(reservation.checked_in_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/30 border-t">
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
                variant="nature" 
                className="flex-1 gap-2"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Imprimer / Enregistrer PDF
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
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
