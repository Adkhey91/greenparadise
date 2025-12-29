import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (confirmationCode: string) => void;
  reservationData: {
    id: string;
    type: 'jardin' | 'resto';
    amount: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    tableNumber?: number;
    date: string;
    formule?: string;
  };
}

export function PaymentModal({ isOpen, onClose, onSuccess, reservationData }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'dahabia' | 'cib'>('dahabia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('process-payment', {
        body: {
          reservation_id: reservationData.id,
          reservation_type: reservationData.type,
          amount: reservationData.amount,
          payment_method: paymentMethod,
          customer_name: reservationData.customerName,
          customer_phone: reservationData.customerPhone,
          customer_email: reservationData.customerEmail
        }
      });

      if (fnError) throw fnError;

      if (data.success) {
        toast({
          title: "Paiement initié",
          description: data.message || "Vous allez être redirigé vers la page de paiement."
        });
        
        if (data.payment_url) {
          // Redirect to payment gateway
          window.location.href = data.payment_url;
        } else {
          // API not configured yet - show confirmation code for now
          onSuccess(data.confirmation_code);
        }
      } else {
        if (data.code === 'API_NOT_CONFIGURED') {
          setError("Le système de paiement est en cours de configuration. Veuillez nous contacter par téléphone pour finaliser votre réservation.");
        } else {
          setError(data.error || "Erreur lors du paiement");
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Paiement de la réservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Récapitulatif
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">
                  {reservationData.type === 'jardin' ? 'Jardin' : 'Restaurant'}
                </Badge>
              </div>
              {reservationData.formule && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="font-medium">{reservationData.formule}</span>
                </div>
              )}
              {reservationData.tableNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Table</span>
                  <span className="font-medium">N° {reservationData.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{reservationData.date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total à payer</span>
                <span className="text-xl font-bold text-primary">
                  {reservationData.amount.toLocaleString()} DA
                </span>
              </div>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Méthode de paiement
            </h3>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(v) => setPaymentMethod(v as 'dahabia' | 'cib')}
              className="grid grid-cols-2 gap-3"
            >
              <Label 
                htmlFor="dahabia"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'dahabia' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="dahabia" id="dahabia" className="sr-only" />
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-amber-600" />
                </div>
                <span className="font-semibold">Dahabia</span>
                <span className="text-xs text-muted-foreground">Carte Dahabia</span>
              </Label>

              <Label 
                htmlFor="cib"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cib' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="cib" id="cib" className="sr-only" />
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-semibold">CIB</span>
                <span className="text-xs text-muted-foreground">Carte CIB</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handlePayment} className="flex-1 gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Payer {reservationData.amount.toLocaleString()} DA
                </>
              )}
            </Button>
          </div>

          {/* Info sécurité */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Paiement sécurisé • Vos données sont protégées
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
