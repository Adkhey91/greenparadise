import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { 
  Leaf, 
  LogOut, 
  Calendar, 
  MessageSquare, 
  Trash2, 
  Loader2,
  Check,
  X,
  Clock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reservation {
  id: string;
  nom: string;
  email: string | null;
  telephone: string;
  date_reservation: string;
  formule: string;
  nombre_personnes: number | null;
  statut: string | null;
  message: string | null;
  created_at: string;
}

interface MessageContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  sujet: string | null;
  message: string;
  lu: boolean | null;
  created_at: string;
}

const AdminDashboardPage = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [messages, setMessages] = useState<MessageContact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [resResult, msgResult] = await Promise.all([
        supabase.from('reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('messages_contact').select('*').order('created_at', { ascending: false })
      ]);

      if (resResult.data) setReservations(resResult.data);
      if (msgResult.data) setMessages(msgResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateReservationStatus = async (id: string, statut: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ statut })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } else {
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, statut } : r)
      );
      toast({
        title: "Statut mis à jour",
        description: `Réservation marquée comme "${statut}"`,
      });
    }
  };

  const deleteReservation = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation",
        variant: "destructive",
      });
    } else {
      setReservations(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Réservation supprimée",
      });
    }
  };

  const toggleMessageRead = async (id: string, lu: boolean) => {
    const { error } = await supabase
      .from('messages_contact')
      .update({ lu: !lu })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le message",
        variant: "destructive",
      });
    } else {
      setMessages(prev => 
        prev.map(m => m.id === id ? { ...m, lu: !lu } : m)
      );
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from('messages_contact')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Message supprimé",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case 'confirmee':
        return <Badge className="bg-green-500/20 text-green-700 border-green-300"><Check className="w-3 h-3 mr-1" />Confirmée</Badge>;
      case 'annulee':
        return <Badge className="bg-red-500/20 text-red-700 border-red-300"><X className="w-3 h-3 mr-1" />Annulée</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.lu).length;
  const pendingCount = reservations.filter(r => r.statut === 'en_attente' || !r.statut).length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Administration</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Réservations totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages non lus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{unreadCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reservations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Réservations
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>Réservations</CardTitle>
                <CardDescription>
                  Gérez toutes les réservations de tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune réservation pour le moment
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Formule</TableHead>
                          <TableHead>Personnes</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell>
                              <div className="font-medium">
                                {format(new Date(reservation.date_reservation), 'dd MMM yyyy', { locale: fr })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(reservation.created_at), 'dd/MM à HH:mm', { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{reservation.nom}</TableCell>
                            <TableCell>
                              <div>{reservation.telephone}</div>
                              {reservation.email && (
                                <div className="text-xs text-muted-foreground">{reservation.email}</div>
                              )}
                            </TableCell>
                            <TableCell>{reservation.formule}</TableCell>
                            <TableCell>{reservation.nombre_personnes || '-'}</TableCell>
                            <TableCell>
                              <Select
                                value={reservation.statut || 'en_attente'}
                                onValueChange={(value) => updateReservationStatus(reservation.id, value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en_attente">En attente</SelectItem>
                                  <SelectItem value="confirmee">Confirmée</SelectItem>
                                  <SelectItem value="annulee">Annulée</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer la réservation ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteReservation(reservation.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages de contact</CardTitle>
                <CardDescription>
                  Consultez les messages reçus via le formulaire de contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun message pour le moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`p-4 rounded-lg border ${
                          message.lu ? 'bg-background' : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{message.nom}</span>
                              {!message.lu && (
                                <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {message.email}
                              {message.telephone && ` • ${message.telephone}`}
                            </div>
                            {message.sujet && (
                              <div className="text-sm font-medium mb-1">
                                Sujet: {message.sujet}
                              </div>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <div className="text-xs text-muted-foreground mt-2">
                              {format(new Date(message.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleMessageRead(message.id, message.lu || false)}
                              title={message.lu ? "Marquer comme non lu" : "Marquer comme lu"}
                            >
                              <Eye className={`h-4 w-4 ${message.lu ? 'text-muted-foreground' : 'text-primary'}`} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le message ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMessage(message.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
