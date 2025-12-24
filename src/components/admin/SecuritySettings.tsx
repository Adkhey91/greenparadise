import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(8, "Minimum 8 caractères").max(72);

export function SecuritySettings() {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(newEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success("Email de confirmation envoyé", {
        description: "Vérifiez votre nouvelle adresse email pour confirmer le changement.",
      });
      setNewEmail("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error("Erreur lors du changement d'email", {
        description: error.message,
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoadingPassword(true);
    try {
      // D'abord vérifier l'ancien mot de passe en se reconnectant
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        throw new Error("Utilisateur non connecté");
      }

      // Vérifier l'ancien mot de passe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Mot de passe actuel incorrect");
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Erreur lors du changement de mot de passe", {
        description: error.message,
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Modifier l'email</CardTitle>
              <CardDescription>
                Un email de confirmation sera envoyé à la nouvelle adresse
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Nouvelle adresse email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="nouveau@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="max-w-md"
              />
            </div>
            <Button type="submit" disabled={loadingEmail || !newEmail}>
              {loadingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Modifier l'email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Lock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Modifier le mot de passe</CardTitle>
              <CardDescription>
                Choisissez un mot de passe fort d'au moins 8 caractères
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="max-w-md"
              />
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loadingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {loadingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Modifier le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
