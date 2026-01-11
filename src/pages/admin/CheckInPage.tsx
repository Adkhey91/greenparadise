import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UtensilsCrossed,
  MapPin,
  Bug,
  RefreshCw,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const getBarcodeDetector = () => (window as any).BarcodeDetector as
  | (new (opts: { formats: string[] }) => { detect: (source: any) => Promise<Array<{ rawValue: string }>> })
  | undefined;

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
  table_id: string | null;
  table_number_snapshot: string | null;
}

interface AvailableTable {
  id: string;
  nom_ou_numero: string;
  capacite: number;
  statut: string;
  formule_id: string;
  venue_id: string;
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
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);

      const Detector = getBarcodeDetector();
      if (!Detector) {
        setCameraError("Scan QR non supporté sur cet appareil. Utilisez la saisie manuelle.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setSearchMode("camera");
      scanningRef.current = true;

      // scan loop
      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!scanningRef.current) return;
        try {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes?.length) {
              const value = barcodes[0].rawValue;
              setDebugInfo(prev => prev + `QR détecté: ${value}\n`);
              setSearchInput(value);
              stopCamera();
              // lance la recherche automatiquement
              void handleSearch(undefined, value);
              return;
            }
          }
        } catch (err: any) {
          // ignore transient errors
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);

      toast({
        title: "Caméra activée",
        description: "Visez le QR code (détection automatique)",
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
    scanningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSearchMode("manual");
  };

  const normalizePhone = (value: string) => value.replace(/\D/g, "");

  const handleSearch = async (e?: React.FormEvent, overrideValue?: string) => {
    e?.preventDefault();

    const raw = (overrideValue ?? searchInput).trim();

    if (!raw) {
      toast({
        title: "Champ requis",
        description: "Entrez un N° réservation + code, un téléphone, ou scannez un QR",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setFoundReservation(null);
    setDebugInfo("");

    let input = raw;

    // Extract token from URL if pasted
    if (input.includes("/ticket?token=") || input.includes("token=")) {
      const urlMatch = input.match(/token=([^&\s]+)/);
      if (urlMatch) {
        input = urlMatch[1];
        setDebugInfo(prev => prev + `Token extrait: ${input.substring(0, 20)}...\n`);
      }
    }

    const inputUpper = input.toUpperCase();
    let searchType = "";
    let data: any = null;
    let error: any = null;

    // Support "GRN-1234 0540xxxxxx" (num + code) in one field
    const parts = inputUpper.split(/[\s,;|/]+/).filter(Boolean);
    const looksLikeNumber = (v: string) => v.startsWith("GRN-") || v.startsWith("RPR-");

    try {
      // Strategy 0: reservation_number + code (same input)
      if (parts.length >= 2 && looksLikeNumber(parts[0])) {
        searchType = "reservation_number+code";
        const resNumber = parts[0];
        const code = parts[1];
        setDebugInfo(prev => prev + `Recherche N°: ${resNumber} + code: ${code}\n`);

        const result = await supabase
          .from("reservations")
          .select("*")
          .eq("reservation_number", resNumber)
          .maybeSingle();

        data = result.data;
        error = result.error;

        if (data) {
          const dbLast8 = normalizePhone(data.telephone).slice(-8);
          const inputLast8 = normalizePhone(code).slice(-8);
          setDebugInfo(prev => prev + `Vérif code: input(${inputLast8}) vs db(${dbLast8})\n`);
          if (!inputLast8 || inputLast8 !== dbLast8) {
            data = null;
          }
        }
      }
      // Strategy 1: Search by reservation_number
      else if (looksLikeNumber(inputUpper)) {
        searchType = "reservation_number";
        setDebugInfo(prev => prev + `Recherche par N°: ${inputUpper}\n`);

        const result = await supabase
          .from("reservations")
          .select("*")
          .eq("reservation_number", inputUpper)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }
      // Strategy 2: Search by secure_token (long string)
      else if (input.length > 30) {
        searchType = "secure_token";
        setDebugInfo(prev => prev + `Recherche par token: ${input.substring(0, 20)}...\n`);

        const result = await supabase
          .from("reservations")
          .select("*")
          .eq("secure_token", input)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }
      // Strategy 3: Search by phone (fallback)
      else {
        searchType = "telephone";
        const cleanPhone = normalizePhone(input);
        setDebugInfo(prev => prev + `Recherche par téléphone: ${cleanPhone}\n`);

        const result = await supabase
          .from("reservations")
          .select("*")
          .ilike("telephone", `%${cleanPhone.slice(-8)}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

      setDebugInfo(prev => prev + `Type: ${searchType}\nRésultat: ${data ? "Trouvé ✓" : "Non trouvé ✗"}\n`);
      if (error) {
        setDebugInfo(prev => prev + `Erreur: ${error.message}\n`);
      }

    } catch (err: any) {
      console.error("Search error:", err);
      setDebugInfo(prev => prev + `Exception: ${err.message}\n`);
      error = err;
    }

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
    setSelectedTableId(data.table_id || "");

    // Fetch available tables for this venue
    await fetchAvailableTables(data.reservation_number?.startsWith("RPR-") ? "RESTAURANT" : "GARDEN");
  };

  const fetchAvailableTables = async (venueCode: string) => {
    const { data: venueData } = await supabase
      .from("venues")
      .select("id")
      .eq("code", venueCode)
      .single();
    
    if (!venueData) {
      setDebugInfo(prev => prev + `Venue ${venueCode} non trouvé\n`);
      return;
    }

    const { data: tables } = await supabase
      .from("park_tables")
      .select("*")
      .eq("venue_id", venueData.id)
      .in("statut", ["libre", "reservee"])
      .order("nom_ou_numero");
    
    if (tables) {
      setAvailableTables(tables as AvailableTable[]);
      setDebugInfo(prev => prev + `Tables disponibles: ${tables.length}\n`);
    }
  };

  const handleAssignTable = async (tableId: string) => {
    if (!foundReservation || !tableId) return;

    setProcessing(true);

    // Get table info
    const { data: tableData } = await supabase
      .from("park_tables")
      .select("nom_ou_numero")
      .eq("id", tableId)
      .single();

    const tableNumber = tableData?.nom_ou_numero || tableId;

    // Update reservation with table info
    const { error } = await supabase
      .from("reservations")
      .update({ 
        table_id: tableId,
        table_number_snapshot: tableNumber
      })
      .eq("id", foundReservation.id);

    // Mark table as reserved
    await supabase
      .from("park_tables")
      .update({ statut: "reservee" })
      .eq("id", tableId);

    setProcessing(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner la table",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Table assignée ✓",
      description: `Table ${tableNumber} assignée à ${foundReservation.nom}`,
    });

    setFoundReservation({
      ...foundReservation,
      table_id: tableId,
      table_number_snapshot: tableNumber
    });
    setSelectedTableId(tableId);

    await refetch();
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

    // Update reservation status
    const { error } = await supabase
      .from("reservations")
      .update({ 
        statut: "checked_in",
        checked_in_at: new Date().toISOString()
      })
      .eq("id", foundReservation.id);

    // Mark table as occupied if assigned
    if (foundReservation.table_id) {
      await supabase
        .from("park_tables")
        .update({ statut: "occupee" })
        .eq("id", foundReservation.table_id);
    }

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
      description: `${foundReservation.nom} - Table: ${foundReservation.table_number_snapshot || "non assignée"}`,
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

  const handleReleaseTable = async () => {
    if (!foundReservation?.table_id) return;

    setProcessing(true);

    // Free the table
    await supabase
      .from("park_tables")
      .update({ statut: "libre" })
      .eq("id", foundReservation.table_id);

    setProcessing(false);

    toast({
      title: "Table libérée ✓",
      description: `Table ${foundReservation.table_number_snapshot} est maintenant libre`,
    });

    await refetch();
  };

  const handleClear = () => {
    setFoundReservation(null);
    setSearchInput("");
    setDebugInfo("");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-in Entrée</h1>
          <p className="text-muted-foreground">
            Scanner ou rechercher une réservation pour valider l'entrée
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="gap-2"
        >
          <Bug className="w-4 h-4" />
          {showDebug ? "Masquer debug" : "Debug"}
        </Button>
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
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
            <p className="text-xs text-muted-foreground mt-3">
              Collez directement l'URL du QR code ou le numéro de réservation
            </p>

            {/* Debug panel */}
            {showDebug && debugInfo && (
              <div className="mt-4 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{debugInfo}</pre>
              </div>
            )}
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
                  Scannez le QR puis collez le lien ci-dessus
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

              {/* Table Assignment */}
              <div className={`p-4 rounded-xl border-2 ${
                isRestaurant ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Table assignée</span>
                </div>
                
                {foundReservation.table_number_snapshot ? (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge className={`text-lg px-4 py-2 ${
                      isRestaurant ? "bg-amber-600" : "bg-green-600"
                    } text-white`}>
                      {foundReservation.table_number_snapshot}
                    </Badge>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedTableId} 
                        onValueChange={handleAssignTable}
                        disabled={processing}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Changer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTables.map((table) => (
                            <SelectItem key={table.id} value={table.id}>
                              {table.nom_ou_numero} ({table.capacite}p)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {foundReservation.statut === "checked_in" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReleaseTable}
                          disabled={processing}
                          className="gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Libérer
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Aucune table assignée</p>
                    <Select 
                      value={selectedTableId} 
                      onValueChange={handleAssignTable}
                      disabled={processing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une table..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.nom_ou_numero} ({table.capacite} pers.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
              {showDebug && foundReservation.secure_token && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">Debug - Token:</p>
                  <p className="text-xs font-mono break-all">{foundReservation.secure_token}</p>
                  <p className="text-xs text-gray-500 mt-2">URL QR:</p>
                  <p className="text-xs font-mono break-all text-blue-600">
                    {window.location.origin}/ticket?token={foundReservation.secure_token}
                  </p>
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
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
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
