import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  Search,
  CheckCircle,
  XCircle,
  Wallet,
  AlertCircle,
  User,
  Calendar,
  Users,
  Phone,
  Camera,
  CameraOff,
  TreePine,
  UtensilsCrossed
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminContextData {
  reservations: any[];
  refetch: () => Promise<void>;
}

interface FoundReservation {
  id: string;
  reservation_number: string;
  secure_token: string;
  nom: string;
  telephone: string;
  date_reservation: string;
  formule: string;
  nombre_personnes: number | null;
  statut: string | null;
  payment_status: string | null;
  total_price: number | null;
  checked_in_at: string | null;
  venue_id: string | null;
}

export default function CheckInPage() {
  const { refetch } = useOutletContext<AdminContextData>();
  const { toast } = useToast();
  
  const [searchMode, setSearchMode] = useState<"manual" | "camera">("manual");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundReservation, setFoundReservation] = useState<FoundReservation | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSearchMode("camera");
      
      toast({
        title: "Caméra activée",
        description: "Scannez le QR code ou entrez le code manuellement",
      });
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Impossible d'accéder à la caméra");
      toast({
        title: "Erreur caméra",
        description: "Utilisez la saisie manuelle",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSearchMode("manual");
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchInput.trim()) {
      toast({
        title: "Champ requis",
        description: "Entrez un numéro de réservation, téléphone ou token",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setFoundReservation(null);

    let input = searchInput.trim();
    
    // Extract token from URL if pasted
    if (input.includes("/ticket?token=")) {
      const urlMatch = input.match(/token=([^&\s]+)/);
      if (urlMatch) {
        input = urlMatch[1];
      }
    }
    
    const inputUpper = input.toUpperCase();

    // Search by reservation_number, phone, or secure_token
    let query = supabase.from("reservations").select("*");
    
    if (inputUpper.startsWith("GRN-") || inputUpper.startsWith("RPR-")) {
      query = query.eq("reservation_number", inputUpper);
    } else if (input.length > 30) {
      // Likely a secure token
      query = query.eq("secure_token", input);
    } else {
      // Search by phone
      query = query.ilike("telephone", `%${input.replace(/\s/g, '')}%`);
    }

    const { data, error } = await query.limit(1).single();

    setSearching(false);

    if (error || !data) {
      toast({
        title: "Non trouvé",
        description: "Aucune réservation trouvée avec ces informations",
        variant: "destructive",
      });
      return;
    }

    setFoundReservation(data as FoundReservation);
  };

  const handleCheckIn = async () => {
    if (!foundReservation) return;

    if (foundReservation.statut === "checked_in") {
      toast({
        title: "Déjà validé",
        description: "Cette réservation a déjà été validée",
        variant: "destructive",
      });
      return;
    }

    if (foundReservation.statut !== "confirmee") {
      toast({
        title: "Non confirmée",
        description: "Cette réservation n'est pas encore confirmée",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const { error } = await supabase
      .from("reservations")
      .update({ 
        statut: "checked_in",
        checked_in_at: new Date().toISOString()
      })
      .eq("id", foundReservation.id);

    setProcessing(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider l'entrée",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Entrée validée ✓",
      description: `${foundReservation.nom} - ${foundReservation.formule}`,
    });

    setFoundReservation({
      ...foundReservation,
      statut: "checked_in",
      checked_in_at: new Date().toISOString()
    });

    await refetch();
  };

  const handleMarkPaid = async () => {
    if (!foundReservation) return;

    setProcessing(true);

    const { error } = await supabase
      .from("reservations")
      .update({ 
        payment_status: "paid_cash",
        paid_at: new Date().toISOString()
      })
      .eq("id", foundReservation.id);

    setProcessing(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme payé",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Paiement enregistré ✓",
      description: `${foundReservation.total_price?.toLocaleString()} DA reçus`,
    });

    setFoundReservation({
      ...foundReservation,
      payment_status: "paid_cash"
    });

    await refetch();
  };

  const handleClear = () => {
    setFoundReservation(null);
    setSearchInput("");
  };

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case "confirmee":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Confirmée</Badge>;
      case "checked_in":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Entrée validée</Badge>;
      case "annulee":
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Annulée</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">En attente</Badge>;
    }
  };

  // Determine venue type
  const isRestaurant = foundReservation?.reservation_number?.startsWith("RPR-");
  const venueName = isRestaurant ? "Le Repère" : "Jardin";
  const VenueIcon = isRestaurant ? UtensilsCrossed : TreePine;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Check-in Entrée</h1>
        <p className="text-muted-foreground">
          Scanner ou rechercher une réservation pour valider l'entrée
        </p>
      </div>

      {/* Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Recherche manuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                placeholder="N° réservation (GRN-/RPR-), téléphone ou token"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-12 font-mono"
              />
              <Button 
                type="submit" 
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={searching}
              >
                {searching ? "Recherche..." : "Rechercher"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              Vous pouvez coller directement l'URL du QR code
            </p>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Scanner QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchMode === "camera" ? (
              <div className="space-y-4">
                <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg" />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={stopCamera}
                >
                  <CameraOff className="w-4 h-4" />
                  Arrêter la caméra
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Placez le QR code dans le cadre, puis copiez le lien manuellement
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square bg-muted/50 rounded-xl flex flex-col items-center justify-center">
                  <Camera className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  {cameraError && (
                    <p className="text-sm text-red-500 text-center px-4">{cameraError}</p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4" />
                  Activer la caméra
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Found Reservation */}
      {foundReservation && (
        <Card className={`border-2 ${isRestaurant ? "border-amber-300" : "border-green-300"}`}>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header with status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`gap-1 ${isRestaurant ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                      <VenueIcon className="w-3 h-3" />
                      {venueName}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {foundReservation.reservation_number}
                  </p>
                </div>
                {getStatusBadge(foundReservation.statut)}
              </div>

              {/* Already checked in warning */}
              {foundReservation.statut === "checked_in" && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Déjà validée</span>
                  </div>
                  {foundReservation.checked_in_at && (
                    <p className="text-sm text-blue-600 mt-1">
                      Entrée le {format(parseISO(foundReservation.checked_in_at), "dd/MM à HH:mm", { locale: fr })}
                    </p>
                  )}
                </div>
              )}

              {/* Not confirmed warning */}
              {foundReservation.statut !== "confirmee" && foundReservation.statut !== "checked_in" && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Réservation non confirmée</span>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    Cette réservation doit être confirmée avant le check-in
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="font-semibold">{foundReservation.nom}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-semibold">{foundReservation.telephone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {format(parseISO(foundReservation.date_reservation), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Personnes</p>
                    <p className="font-semibold">{foundReservation.nombre_personnes || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Formula & Price */}
              <div className={`p-4 rounded-xl flex items-center justify-between ${
                isRestaurant ? "bg-amber-50" : "bg-green-50"
              }`}>
                <div>
                  <p className="text-sm text-muted-foreground">Formule</p>
                  <p className="font-semibold">{foundReservation.formule}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="text-xl font-bold text-primary">
                    {foundReservation.total_price?.toLocaleString() || "-"} DA
                  </p>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span>Paiement</span>
                </div>
                <Badge variant={foundReservation.payment_status === "paid_cash" ? "default" : "outline"}>
                  {foundReservation.payment_status === "paid_cash" ? "Payé (cash)" : "Non payé"}
                </Badge>
              </div>

              {/* Debug: Show secure token */}
              {process.env.NODE_ENV === 'development' && foundReservation.secure_token && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">Debug - Token:</p>
                  <p className="text-xs font-mono break-all">{foundReservation.secure_token}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {foundReservation.statut === "confirmee" && (
                  <Button
                    className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCheckIn}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Valider l'entrée
                  </Button>
                )}
                
                {foundReservation.payment_status !== "paid_cash" && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleMarkPaid}
                    disabled={processing}
                  >
                    <Wallet className="w-4 h-4" />
                    Marquer payé cash
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={handleClear}
                >
                  Nouvelle recherche
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
