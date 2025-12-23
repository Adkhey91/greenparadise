import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Trash2, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Copy,
  Check,
  Filter,
  Inbox
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdminContextData {
  reservations: any[];
  messages: any[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export default function MessagesPage() {
  const { messages, refetch } = useOutletContext<AdminContextData>();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleRead = async (id: string, currentLu: boolean) => {
    const { error } = await supabase
      .from("messages_contact")
      .update({ lu: !currentLu })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le message",
        variant: "destructive",
      });
    } else {
      await refetch();
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages_contact").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    } else {
      await refetch();
      setSelectedMessage(null);
      toast({ title: "Message supprimé" });
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copié dans le presse-papiers" });
  };

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.nom.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.sujet && m.sujet.toLowerCase().includes(search.toLowerCase())) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !m.lu) ||
      (filter === "read" && m.lu);

    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter((m) => !m.lu).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">
          {unreadCount} message(s) non lu(s) sur {messages.length}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les messages</SelectItem>
                  <SelectItem value="unread">Non lus</SelectItem>
                  <SelectItem value="read">Lus</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun message trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((msg) => (
                <Card
                  key={msg.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !msg.lu && "border-primary/30 bg-primary/5",
                    selectedMessage?.id === msg.id && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.lu) toggleRead(msg.id, false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{msg.nom}</span>
                          {!msg.lu && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {msg.sujet || "Sans sujet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(msg.created_at), "dd MMM 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="sticky top-6">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedMessage.nom}</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedMessage.created_at), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRead(selectedMessage.id, selectedMessage.lu || false)}
                    >
                      {selectedMessage.lu ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Non lu
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Lu
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMessage(selectedMessage.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyToClipboard(selectedMessage.email, "email")}
                  >
                    {copiedField === "email" ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    {selectedMessage.email}
                    <Copy className="h-3 w-3 opacity-50" />
                  </Button>
                  {selectedMessage.telephone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => copyToClipboard(selectedMessage.telephone, "phone")}
                    >
                      {copiedField === "phone" ? <Check className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      {selectedMessage.telephone}
                      <Copy className="h-3 w-3 opacity-50" />
                    </Button>
                  )}
                </div>

                {/* Subject */}
                {selectedMessage.sujet && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Sujet</h3>
                    <p className="font-medium">{selectedMessage.sujet}</p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Message</h3>
                  <div className="p-4 bg-background rounded-xl border">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  Sélectionnez un message
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur un message pour voir les détails
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
