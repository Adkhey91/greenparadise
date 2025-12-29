import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Download, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmationCode: string;
  tableNumber?: number;
  date: string;
  type: 'jardin' | 'resto';
}

export function PaymentSuccessModal({ 
  isOpen, 
  onClose, 
  confirmationCode, 
  tableNumber,
  date,
  type
}: PaymentSuccessModalProps) {
  const { toast } = useToast();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(confirmationCode);
    toast({ title: "Code copié !", description: "Le code de confirmation a été copié." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Paiement réussi</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Paiement confirmé !</h2>
            <p className="text-muted-foreground">
              Votre réservation {type === 'jardin' ? 'au jardin' : 'au restaurant'} est confirmée.
            </p>
          </div>

          {/* Ticket / Confirmation */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-dashed border-primary/30 space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Ticket className="w-5 h-5" />
              <span className="font-semibold">Votre ticket d'entrée</span>
            </div>

            {/* Code de confirmation */}
            <div className="bg-background rounded-xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Code de confirmation</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-wider text-foreground">
                  {confirmationCode}
                </span>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-8 w-8">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Numéro de table */}
            {tableNumber && (
              <div className="bg-background rounded-xl p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Table réservée</p>
                <p className="text-3xl font-bold text-primary">N° {tableNumber}</p>
              </div>
            )}

            {/* Date */}
            <div className="text-sm text-muted-foreground">
              <p>📅 Date : <span className="font-medium text-foreground">{date}</span></p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">📱 À présenter à l'entrée</p>
            <p className="text-amber-700 dark:text-amber-300">
              Montrez ce code ou une capture d'écran à notre équipe pour accéder à votre espace.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              Télécharger le ticket
            </Button>
            <Button variant="nature" onClick={onClose}>
              Terminé
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
