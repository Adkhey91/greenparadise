import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecuritySettings } from "@/components/admin/SecuritySettings";
import { 
  Globe, 
  Database, 
  Shield, 
  Bell,
  ExternalLink,
  Settings,
  Lock
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre application
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          {/* Site Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informations du site</CardTitle>
                  <CardDescription>Détails de votre application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Nom</span>
                <span className="font-medium">Green Paradise</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Environnement</span>
                <Badge className="bg-green-500/10 text-green-700 border-green-200">
                  Production
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Base de données</CardTitle>
                  <CardDescription>Gestion des données</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium">Lovable Cloud</p>
                  <p className="text-sm text-muted-foreground">
                    Base de données connectée et opérationnelle
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-700">
                  Connecté
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">État de la sécurité</CardTitle>
                  <CardDescription>Paramètres de sécurité</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Authentification</span>
                <Badge className="bg-green-500/10 text-green-700 border-green-200">
                  Activée
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">RLS (Row Level Security)</span>
                <Badge className="bg-green-500/10 text-green-700 border-green-200">
                  Activée
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Accès admin</span>
                <Badge variant="outline">Basé sur les rôles</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Gérer les alertes en temps réel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium">Mises à jour en temps réel</p>
                  <p className="text-sm text-muted-foreground">
                    Les nouvelles réservations et messages apparaissent automatiquement
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-700">
                  Actif
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Green Paradise Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Tableau de bord professionnel pour la gestion de votre jardin
                  </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => window.open("/", "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                  Voir le site
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
