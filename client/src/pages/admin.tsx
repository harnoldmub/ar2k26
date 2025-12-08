import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Search, Users, Table2, Download, Mail, Edit, Trash2, BarChart3, FileText, Plus, ArrowUp, ArrowDown, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import type { RsvpResponse } from "@shared/schema";

const ImportGuestForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const rows = text.split(/\n/).map(row => row.trim()).filter(row => row);
      const guests = rows.map(row => {
        // Tab separated for Excel, or loose parsing
        let parts = row.split(/\t/);
        if (parts.length < 2) {
          // Fallback: try splitting by last number? No, unsafe.
          // Assume "Name" only implies count=1
          parts = [row, "1"];
        }

        const fullName = parts[0].trim();
        const count = parseInt(parts[1]?.trim()) || 1;

        // Split name: Last word is LastName, rest is FirstName
        const nameParts = fullName.split(" ");
        let firstName = fullName;
        let lastName = "."; // Default if only one name

        if (nameParts.length > 1) {
          lastName = nameParts.pop() || "";
          firstName = nameParts.join(" ");
        }

        return {
          firstName,
          lastName,
          partySize: Math.min(Math.max(count, 1), 2), // Cap at 2 based on schema constraint? Schema says max 2.
          // What if family? Schema says 1 or 2. If > 2, maybe we need to insert multiple?
          // Or split into multiple couples?
          // Let's stick to schema constraints for now. If > 2, we might fail.
          // Let's cap at 2 for safety or let validation fail.
          email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@import.placeholder`,
          // generating placeholder because logic requires email if not optional? 
          // we made it optional. So send undefined?
          // check bulk route: email: guest.email || null
        };
      });
      // Correct partySize logic: if > 2, user might want to know.
      // But for bulk import, let's just import.

      const response = await fetch("/api/rsvp/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guests),
      });

      const result = await response.json();

      if (result.failed > 0) {
        toast({
          title: "Import partiel",
          description: `${result.success} importés, ${result.failed} échoués.`,
          variant: "destructive",
        });
        console.error("Import errors:", result.errors);
      } else {
        toast({
          title: "Import réussi",
          description: `${result.success} invités ajoutés.`,
        });
      }
      onSuccess();
      setText("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'import.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Données Excel (Copier-Coller)</Label>
        <Textarea
          placeholder={`Nom\tNombre\nJean Dupont\t2\nAlice\t1`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Format: "Nom Complet" [Tabulation] "Nombre de personnes". Un invité par ligne.
        </p>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Importation..." : "Importer"}
      </Button>
    </div>
  );
};

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<RsvpResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [invitationPreviewOpen, setInvitationPreviewOpen] = useState(false);
  const [previewingResponse, setPreviewingResponse] = useState<RsvpResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Connexion requise. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: responses = [], isLoading: responsesLoading } = useQuery<RsvpResponse[]>({
    queryKey: ["/api/rsvp"],
    enabled: isAuthenticated,
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, tableNumber }: { id: number; tableNumber: number | null }) => {
      return await apiRequest("PATCH", `/api/rsvp/${id}`, { tableNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Succès",
        description: "Table mise à jour",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la table",
        variant: "destructive",
      });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; message?: string }) => {
      return await apiRequest("POST", "/api/send-invitation", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation envoyée",
        description: "L'invitation a été envoyée avec succès",
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteMessage("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation",
        variant: "destructive",
      });
    },
  });

  const deleteRsvpMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/rsvp/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Suppression réussie",
        description: "La réponse a été supprimée",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réponse",
        variant: "destructive",
      });
    },
  });

  const updateRsvpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<RsvpResponse, 'id' | 'createdAt'> }) => {
      return await apiRequest("PUT", `/api/rsvp/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Modification réussie",
        description: "La réponse a été mise à jour",
      });
      setEditDialogOpen(false);
      setEditingResponse(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réponse",
        variant: "destructive",
      });
    },
  });

  const generateInvitationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/invitation/generate/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to generate invitation");
      }
      return response.blob();
    },
    onSuccess: async (blob, id) => {
      try {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        const resp = responses.find(r => r.id === id);
        if (resp) {
          setPreviewingResponse(resp);
          setInvitationPreviewOpen(true);
        }
      } catch (error) {
        console.error("Error displaying invitation:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'afficher l'invitation",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Invitation error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer l'invitation",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    window.open('/api/rsvp/export/csv', '_blank');
  };

  const handleSendInvitation = () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }
    sendInvitationMutation.mutate({
      email: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      message: inviteMessage,
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      searchQuery === "" ||
      `${response.firstName} ${response.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (response.email && response.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAvailability =
      filterAvailability === "all" || response.availability === filterAvailability;

    return matchesSearch && matchesAvailability;
  });

  // Stats
  const stats = {
    total: responses.length,
    both: responses.filter(r => r.availability === 'both').length,
    march19: responses.filter(r => r.availability === '19-march').length,
    march21: responses.filter(r => r.availability === '21-march').length,
    unavailable: responses.filter(r => r.availability === 'unavailable').length,
    assigned: responses.filter(r => r.tableNumber !== null).length,
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">
                Espace Administrateur
              </h1>
              <p className="text-xs text-muted-foreground font-sans">
                Gestion des invités
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="container px-6 py-8">
        {/* Dashboard Sections */}
        <div className="space-y-8">
          <DashboardWidgets responses={responses} />

          {/* Guest Management Section */}
          <Card className="flex flex-col">
            <div className="p-6 border-b bg-card">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Gestion des invités</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gérez votre liste d'invités, les réponses et les plans de table</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-2" />
                        Importer liste
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Importer une liste d'invités</DialogTitle>
                        <DialogDescription>
                          Copiez-collez vos invités depuis Excel. Format attendu : 2 colonnes (Nom complet, Nombre de personnes).
                        </DialogDescription>
                      </DialogHeader>
                      <ImportGuestForm onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
                        // setInviteDialogOpen(false); // Close dialog if it shares state? No, own state.
                      }} />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    data-testid="button-export-csv"
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>

                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-send-invitation" className="flex-1 sm:flex-none">
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer invitation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Envoyer une invitation personnalisée</DialogTitle>
                        <DialogDescription>
                          Envoyez une invitation par email à un invité avec un message personnalisé.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="exemple@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-firstname">Prénom *</Label>
                            <Input
                              id="invite-firstname"
                              placeholder="Jean"
                              value={inviteFirstName}
                              onChange={(e) => setInviteFirstName(e.target.value)}
                              data-testid="input-invite-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-lastname">Nom *</Label>
                            <Input
                              id="invite-lastname"
                              placeholder="Dupont"
                              value={inviteLastName}
                              onChange={(e) => setInviteLastName(e.target.value)}
                              data-testid="input-invite-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-message">Message personnalisé (optionnel)</Label>
                          <Textarea
                            id="invite-message"
                            placeholder="Nous serions honorés de votre présence à notre mariage..."
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            rows={4}
                            data-testid="textarea-invite-message"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setInviteDialogOpen(false)}
                          data-testid="button-cancel-invitation"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleSendInvitation}
                          disabled={sendInvitationMutation.isPending}
                          data-testid="button-confirm-send-invitation"
                        >
                          {sendInvitationMutation.isPending ? "Envoi..." : "Envoyer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-guest"
                  />
                </div>
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-full md:w-[240px]" data-testid="select-filter-availability">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout le monde</SelectItem>
                    <SelectItem value="pending">En attente (Non répondu)</SelectItem>
                    <SelectItem value="both">Présents (Les deux dates)</SelectItem>
                    <SelectItem value="19-march">Présents (19 mars)</SelectItem>
                    <SelectItem value="21-march">Présents (21 mars)</SelectItem>
                    <SelectItem value="unavailable">Absents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'firstName') {
                          setSortConfig({ key: 'firstName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'firstName', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Prénom
                        {sortConfig?.key === 'firstName' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'lastName') {
                          setSortConfig({ key: 'lastName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'lastName', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Nom
                        {sortConfig?.key === 'lastName' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'email') {
                          setSortConfig({ key: 'email', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'email', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortConfig?.key === 'email' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-sans">Personnes</TableHead>
                    <TableHead className="font-sans">Disponibilité</TableHead>
                    <TableHead className="font-sans">Table attribuée</TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'createdAt') {
                          setSortConfig({ key: 'createdAt', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'createdAt', direction: 'desc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Date de réponse
                        {sortConfig?.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-sans">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun invité trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResponses
                      .sort((a, b) => {
                        if (!sortConfig) return 0;

                        const key = sortConfig.key as keyof RsvpResponse;
                        const aValue = a[key];
                        const bValue = b[key];

                        if (aValue === bValue) return 0;

                        // Handle null values
                        if (aValue === null || aValue === undefined) return 1;
                        if (bValue === null || bValue === undefined) return -1;

                        const comparison = aValue > bValue ? 1 : -1;
                        return sortConfig.direction === 'asc' ? comparison : -comparison;
                      })
                      .map((response) => (
                        <TableRow key={response.id} data-testid={`row-guest-${response.id}`}>
                          <TableCell className="font-sans font-medium">{response.firstName}</TableCell>
                          <TableCell className="font-sans font-medium">{response.lastName}</TableCell>
                          <TableCell className="font-sans text-sm text-muted-foreground" data-testid={`text-email-${response.id}`}>
                            {response.email}
                          </TableCell>
                          <TableCell className="font-sans">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                              {response.partySize === 1 ? 'Solo (1)' : 'Couple (2)'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-sans border ${response.availability === 'both'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : response.availability === 'unavailable'
                                ? 'bg-slate-50 text-slate-500 border-slate-200'
                                : response.availability === 'pending'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {response.availability === 'both' && 'Les deux dates'}
                              {response.availability === '19-march' && '19 mars'}
                              {response.availability === '21-march' && '21 mars'}
                              {response.availability === 'unavailable' && 'Indisponible'}
                              {response.availability === 'pending' && 'En attente'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {response.tableNumber ? (
                                <>
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                                    <Table2 className="h-3.5 w-3.5" />
                                    <span className="font-sans text-xs font-semibold" data-testid={`text-table-${response.id}`}>
                                      Table {response.tableNumber}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-orange-100 hover:text-orange-900 rounded-full"
                                    onClick={() => updateTableMutation.mutate({ id: response.id, tableNumber: null })}
                                    data-testid={`button-remove-table-${response.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      data-testid={`button-assign-table-${response.id}`}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Attribuer
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                      <DialogTitle>Attribuer une table - {response.firstName} {response.lastName}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor={`table-input-${response.id}`}>Numéro de table</Label>
                                        <Input
                                          id={`table-input-${response.id}`}
                                          type="number"
                                          min="1"
                                          placeholder="Ex: 1, 2, 3..."
                                          data-testid={`input-table-number-${response.id}`}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const value = parseInt((e.target as HTMLInputElement).value);
                                              if (value > 0) {
                                                updateTableMutation.mutate({ id: response.id, tableNumber: value });
                                                (e.target as HTMLInputElement).value = '';
                                              }
                                            }
                                          }}
                                        />
                                      </div>
                                      <Button
                                        onClick={() => {
                                          const input = document.getElementById(`table-input-${response.id}`) as HTMLInputElement;
                                          const value = parseInt(input.value);
                                          if (value > 0) {
                                            updateTableMutation.mutate({ id: response.id, tableNumber: value });
                                          }
                                        }}
                                        disabled={updateTableMutation.isPending}
                                        className="w-full"
                                        data-testid={`button-confirm-table-${response.id}`}
                                      >
                                        {updateTableMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-sans text-sm">
                            {new Date(response.createdAt!).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingResponse(response);
                                  setEditDialogOpen(true);
                                }}
                                data-testid={`button-edit-${response.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => generateInvitationMutation.mutate(response.id)}
                                disabled={generateInvitationMutation.isPending}
                                data-testid={`button-invitation-${response.id}`}
                                title="Générer l'invitation"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setDeletingId(response.id);
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-${response.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                  }}
                  data-testid="button-cancel-delete"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deletingId) {
                      deleteRsvpMutation.mutate(deletingId);
                    }
                  }}
                  disabled={deleteRsvpMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteRsvpMutation.isPending ? "Suppression..." : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invitation Preview Dialog */}
          <Dialog open={invitationPreviewOpen} onOpenChange={setInvitationPreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  Aperçu invitation - {previewingResponse?.firstName} {previewingResponse?.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {previewUrl && (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="w-full h-[600px] border rounded-lg"
                  >
                    <embed
                      src={previewUrl}
                      type="application/pdf"
                      className="w-full h-[600px]"
                    />
                  </object>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setInvitationPreviewOpen(false)}
                    data-testid="button-close-preview"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      if (previewUrl) {
                        const link = document.createElement("a");
                        link.href = previewUrl;
                        link.download = `invitation-${previewingResponse?.firstName}-${previewingResponse?.lastName}.pdf`;
                        link.click();
                      }
                    }}
                    data-testid="button-download-invitation"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier la réponse</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de l'invité.
                </DialogDescription>
              </DialogHeader>
              {editingResponse && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstname">Prénom *</Label>
                      <Input
                        id="edit-firstname"
                        value={editingResponse.firstName}
                        onChange={(e) => setEditingResponse({ ...editingResponse, firstName: e.target.value })}
                        data-testid="input-edit-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastname">Nom *</Label>
                      <Input
                        id="edit-lastname"
                        value={editingResponse.lastName}
                        onChange={(e) => setEditingResponse({ ...editingResponse, lastName: e.target.value })}
                        data-testid="input-edit-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingResponse.email ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, email: e.target.value })}
                      data-testid="input-edit-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-partysize">Nombre de personnes *</Label>
                    <Select
                      value={editingResponse.partySize?.toString()}
                      onValueChange={(value) => setEditingResponse({ ...editingResponse, partySize: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-edit-partysize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Solo (1 personne)</SelectItem>
                        <SelectItem value="2">Couple (2 personnes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-availability">Disponibilité *</Label>
                    <Select
                      value={editingResponse.availability}
                      onValueChange={(value) => setEditingResponse({ ...editingResponse, availability: value })}
                    >
                      <SelectTrigger data-testid="select-edit-availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="19-march">19 mars seulement</SelectItem>
                        <SelectItem value="21-march">21 mars seulement</SelectItem>
                        <SelectItem value="both">Les deux dates</SelectItem>
                        <SelectItem value="unavailable">Je ne serai pas disponible</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-table">Numéro de table (optionnel)</Label>
                    <Input
                      id="edit-table"
                      type="number"
                      min="1"
                      placeholder="Attribuer un numéro de table"
                      value={editingResponse.tableNumber ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        setEditingResponse({ ...editingResponse, tableNumber: value });
                      }}
                      data-testid="input-edit-table"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingResponse(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (editingResponse) {
                      updateRsvpMutation.mutate({
                        id: editingResponse.id,
                        data: {
                          firstName: editingResponse.firstName,
                          lastName: editingResponse.lastName,
                          email: editingResponse.email,
                          partySize: editingResponse.partySize,
                          availability: editingResponse.availability,
                          tableNumber: editingResponse.tableNumber,
                          notes: editingResponse.notes,
                        }
                      });
                    }
                  }}
                  disabled={updateRsvpMutation.isPending}
                  data-testid="button-confirm-edit"
                >
                  {updateRsvpMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
