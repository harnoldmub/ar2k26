import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Search, Users, Table2, Download, Mail, Edit, Trash2, BarChart3, FileText, Plus, ArrowUp, ArrowDown, X, TrendingUp, ExternalLink, Eye, EyeOff, Send, RefreshCw, ChevronLeft, ChevronRight, Filter, Copy, PartyPopper, Calendar, CalendarDays, Check, Bell, MessageCircle } from "lucide-react";
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
import logoRA from "@assets/logo-ra.png";

// Wedding tables with poetic names - Golden Love theme
const WEDDING_TABLES = [
  { number: 1, name: "Amour Éternel", subtitle: "Un amour scellé pour toujours" },
  { number: 2, name: "Âmes Sœurs", subtitle: "Deux cœurs, une destinée" },
  { number: 3, name: "Promesse Dorée", subtitle: "Une parole donnée devant Dieu" },
  { number: 4, name: "Alliance Sacrée", subtitle: "Ce que Dieu unit, nul ne le sépare" },
  { number: 5, name: "Coup de Foudre", subtitle: "Quand l'amour commence" },
  { number: 6, name: "Grâce Divine", subtitle: "L'amour soutenu par la grâce" },
  { number: 7, name: "Cœurs Unis", subtitle: "Unis dans l'amour et la foi" },
  { number: 8, name: "Passion d'Or", subtitle: "Un amour précieux et ardent" },
  { number: 9, name: "Serment Éternel", subtitle: "Fidélité, respect et engagement" },
  { number: 10, name: "Flamme d'Amour", subtitle: "Un feu qui ne s'éteint jamais" },
  { number: 11, name: "Harmonie Dorée", subtitle: "Marcher ensemble en paix" },
  { number: 12, name: "Union Parfaite", subtitle: "Deux vies, un seul chemin" },
  { number: 13, name: "Destin Doré", subtitle: "Écrits l'un pour l'autre" },
  { number: 14, name: "Éclat de Bonheur", subtitle: "La joie d'aimer et d'être aimé" },
  { number: 15, name: "Joyau Précieux", subtitle: "Un amour de grande valeur" },
  { number: 16, name: "Couronne d'Amour", subtitle: "Un amour honoré et célébré" },
  { number: 17, name: "Lien Sacré", subtitle: "Attachés par l'amour et la foi" },
  { number: 18, name: "Origine Divine", subtitle: "Un amour voulu par Dieu" },
  { number: 19, name: "Héritage d'Amour", subtitle: "Un amour transmis et béni" },
  { number: 20, name: "Lumière Éternelle", subtitle: "Un amour qui éclaire le chemin" },
  { number: 21, name: "Cantique d'Amour", subtitle: "Un amour chanté devant Dieu" },
  { number: 22, name: "Main dans la Main", subtitle: "Marcher ensemble toute une vie" },
  { number: 23, name: "Promesse Céleste", subtitle: "Un engagement venu du ciel" },
  { number: 24, name: "Trésor du Cœur", subtitle: "Là où est ton trésor, là est ton cœur" },
  { number: 25, name: "Éternelle Allégresse", subtitle: "La joie scellée par l'amour" },
  { number: 26, name: "Souffle d'Or", subtitle: "Quand Dieu insuffle l'amour" },
  { number: 27, name: "Chemin de Grâce", subtitle: "Guidés par la foi et l'amour" },
  { number: 28, name: "Amour Triomphant", subtitle: "L'amour qui surmonte tout" },
  { number: 29, name: "Scellement Divin", subtitle: "Une union bénie pour toujours" },
  { number: 30, name: "Rayon de Gloire", subtitle: "Un amour qui reflète la gloire de Dieu" },
  { number: 31, name: "Serment Sacré", subtitle: "Un engagement devant Dieu et les hommes" },
  { number: 32, name: "Éternelle Promesse", subtitle: "Un amour qui traverse le temps" },
  { number: 33, name: "Chemin d'Amour", subtitle: "Marcher ensemble, aujourd'hui et toujours" },
  { number: 34, name: "Couronne de Gloire", subtitle: "Un amour honoré et béni" },
  { number: 35, name: "Union Glorieuse", subtitle: "Deux vies unies par la grâce" },
  { number: 36, name: "Amour Véritable", subtitle: "Patient, fidèle et sincère" },
  { number: 37, name: "Source de Joie", subtitle: "Un amour qui fait fleurir la vie" },
  { number: 38, name: "Alliance Éternelle", subtitle: "Un pacte d'amour indestructible" },
  { number: 39, name: "Horizon d'Amour", subtitle: "Un avenir bâti à deux" },
  { number: 40, name: "Golden Love", subtitle: "L'amour célébré aujourd'hui et pour toujours" },
  { number: 41, name: "Jardin d'Amour", subtitle: "Un amour qui grandit et fleurit chaque jour" },
  { number: 42, name: "Promesse Éternelle", subtitle: "Un engagement fidèle pour toute la vie" },
  { number: 43, name: "Grâce Infinie", subtitle: "Un amour porté par la bénédiction de Dieu" },
  { number: 44, name: "Lumière d'Amour", subtitle: "L'amour qui éclaire chaque pas" },
  { number: 45, name: "Alliance de Vie", subtitle: "Deux cœurs unis pour bâtir l'avenir" },
  { number: 46, name: "Cœur Fidèle", subtitle: "Un amour loyal et sincère" },
  { number: 47, name: "Chemin d'Éternité", subtitle: "Marcher ensemble au-delà du temps" },
  { number: 48, name: "Étreinte Divine", subtitle: "Un amour guidé par la main de Dieu" },
  { number: 49, name: "Serment d'Amour", subtitle: "Une parole donnée pour toujours" },
  { number: 50, name: "Gloire d'Amour", subtitle: "Un amour élevé et célébré" },
  { number: 51, name: "Amour Accompli", subtitle: "L'union parfaite scellée pour la vie" },
  { number: 52, name: "Lumière de Grâce", subtitle: "Un amour rayonnant de bénédiction" },
];

// Helper function to get table info by number
const getTableInfo = (tableNumber: number) => {
  return WEDDING_TABLES.find(t => t.number === tableNumber);
};

const ImportGuestForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const parseAvailability = (value: string): string => {
    const lower = value.toLowerCase().trim();
    if (lower.includes('19') && lower.includes('21') || lower === 'both' || lower === 'les deux') return 'both';
    if (lower.includes('19') || lower === '19-march') return '19-march';
    if (lower.includes('21') || lower === '21-march') return '21-march';
    if (lower.includes('non') || lower === 'unavailable' || lower === 'indisponible') return 'unavailable';
    return 'pending';
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const rows = text.split(/\n/).map(row => row.trim()).filter(row => row);
      const guests = rows.map(row => {
        const parts = row.split(/\t/);
        
        const fullName = (parts[0] || "").trim();
        const email = (parts[1] || "").trim();
        const phone = (parts[2] || "").trim();
        const count = parseInt(parts[3]?.trim()) || 1;
        const availability = parseAvailability(parts[4] || "");
        const notes = (parts[5] || "").trim();

        const nameParts = fullName.split(" ");
        let firstName = fullName;
        let lastName = ".";

        if (nameParts.length > 1) {
          lastName = nameParts.pop() || "";
          firstName = nameParts.join(" ");
        }

        return {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          partySize: Math.min(Math.max(count, 1), 5),
          availability,
          notes: notes || null,
        };
      });

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
          placeholder={`Nom\tEmail\tTéléphone\tNombre\tDisponibilité\tCommentaire\nJean Dupont\tjean@email.com\t+33612345678\t2\t21\tAllergies\nAlice Martin\talice@email.com\t\t1\t19-21\t`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
          data-testid="textarea-import"
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Colonnes (séparées par tabulation) :</p>
          <p>1. Nom Complet* | 2. Email | 3. Téléphone | 4. Nb personnes | 5. Disponibilité | 6. Commentaire</p>
          <p className="text-muted-foreground/70">Disponibilité: "19", "21", "19-21" ou "les deux", "non" ou vide (en attente)</p>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" data-testid="button-import-submit">
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPartySize, setFilterPartySize] = useState<string>("all");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterInvitationType, setFilterInvitationType] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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

  // Seating plan toggle mutation (persisted in database)
  const toggleSeatingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/toggle-seating`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le plan de table", variant: "destructive" });
    },
  });

  // Add guest dialog state
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    partySize: 1,
    availability: "21-march",
    notes: "",
  });

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

  const { data: cagnotteSettings } = useQuery<{ visible: boolean }>({
    queryKey: ["/api/settings/cagnotte-visible"],
  });

  const toggleCagnotteMutation = useMutation({
    mutationFn: async (visible: boolean) => {
      return await apiRequest("POST", "/api/settings/cagnotte-visible", { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/cagnotte-visible"] });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<RsvpResponse, 'id' | 'createdAt'>> }) => {
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

  const bulkConfirmMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("POST", "/api/rsvp/bulk-confirm", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Succès",
        description: "Les invités sélectionnés ont été confirmés.",
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la confirmation groupée.",
        variant: "destructive",
      });
    },
  });

  const bulkSendInvitationMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-send-invitation", { ids });
      return await response.json();
    },
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitations envoyées",
        description: `${data.sent} envoyées, ${data.failed} échouées`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi groupé des invitations.",
        variant: "destructive",
      });
    },
  });

  const bulkResendConfirmationMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-resend-confirmation", { ids });
      return await response.json();
    },
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Confirmations envoyées",
        description: `${data.sent} envoyées, ${data.failed} échouées`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi groupé des confirmations.",
        variant: "destructive",
      });
    },
  });

  const updateInvitationTypeMutation = useMutation({
    mutationFn: async ({ id, invitationType }: { id: number; invitationType: number }) => {
      return await apiRequest("PATCH", `/api/rsvp/${id}`, { invitationType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le type d'invitation",
        variant: "destructive",
      });
    },
  });

  const bulkInvitationTypeMutation = useMutation({
    mutationFn: async ({ ids, invitationType }: { ids: number[]; invitationType: number }) => {
      return await apiRequest("POST", "/api/rsvp/bulk-invitation-type", { ids, invitationType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Type d'invitation mis à jour",
        description: `${selectedIds.length} invité(s) modifié(s)`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du type d'invitation.",
        variant: "destructive",
      });
    },
  });

  const whatsappMutation = useMutation({
    mutationFn: async ({ id, firstName, lastName, partySize }: { id: number; firstName: string; lastName: string; partySize: number }) => {
      const [whatsappRes, configRes] = await Promise.all([
        apiRequest("POST", `/api/rsvp/${id}/whatsapp-log`),
        fetch("/api/site-config")
      ]);
      const whatsappData = await whatsappRes.json();
      const configData = await configRes.json();
      return { ...whatsappData, siteUrl: configData.siteUrl, guestId: id, firstName, lastName, partySize };
    },
    onSuccess: (data: { phone?: string; siteUrl: string; guestId: number; firstName: string; lastName: string; partySize: number }) => {
      if (!data.phone) {
        toast({
          title: "Numéro manquant",
          description: "Cet invité n'a pas de numéro de téléphone enregistré.",
          variant: "destructive"
        });
        return;
      }

      const invName = buildInvitationName(data.firstName, data.lastName, data.partySize);
      const greeting = data.partySize >= 2 ? `Bonjour,` : `Bonjour ${data.firstName},`;
      const guestLink = `${data.siteUrl}/guest/${data.guestId}`;
      const message = `${greeting}\n\nVous êtes cordialement invité(e) au mariage de Ruth & Arnold.\n\nDécouvrez votre invitation personnalisée ici :\n${guestLink}\n\nNous avons hâte de célébrer ce moment avec vous !\n\nRuth & Arnold 💍`;
      const url = `https://wa.me/${data.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({ title: "WhatsApp ouvert", description: `Message prêt pour ${invName}` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de préparer WhatsApp", variant: "destructive" });
    }
  });

  const sendInvitationToGuestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/send-invitation`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitation envoyée",
        description: "L'invitation personnalisée a été envoyée par email",
      });
    },
    onError: async (error: any) => {
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
      let errorMessage = "Impossible d'envoyer l'invitation";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {}
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const sendInvitation21Mutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/send-invitation-21`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitation 21 envoyée",
        description: "L'email d'invitation du 21 mars a été envoyé",
      });
    },
    onError: async (error: any) => {
      let errorMessage = "Impossible d'envoyer l'invitation 21";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {}
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const bulkAssignTableMutation = useMutation({
    mutationFn: async ({ ids, tableNumber }: { ids: number[]; tableNumber: number | null }) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-assign-table", { ids, tableNumber });
      return await response.json();
    },
    onSuccess: (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Tables attribuées",
        description: `${data.count} invité(s) mis à jour`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'attribuer les tables.", variant: "destructive" });
    },
  });

  const bulkSendInvitation21Mutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-send-invitation-21", { ids });
      return await response.json();
    },
    onSuccess: (data: { successCount: number; errorCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitations 21 envoyées",
        description: `${data.successCount} envoyées, ${data.errorCount} échouées`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi groupé des invitations 21.",
        variant: "destructive",
      });
    },
  });

  const sendSmartInvitationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/send-smart-invitation`);
    },
    onSuccess: async (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      const data = await res.json().catch(() => ({}));
      const sent: string[] = data.sent || [];
      const desc = sent.length === 0
        ? "Aucune invitation envoyée (disponibilité non définie)"
        : `Invitation${sent.length > 1 ? "s" : ""} ${sent.map((s: string) => s === "19" ? "19 mars" : "21 mars").join(" + ")} envoyée${sent.length > 1 ? "s" : ""}`;
      toast({ title: "Invitation envoyée", description: desc });
    },
    onError: async (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Non autorisé", description: "Vous êtes déconnecté. Reconnexion...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      let msg = "Impossible d'envoyer l'invitation";
      try { const d = await error.json?.(); if (d?.message) msg = d.message; } catch {}
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  const bulkSendSmartInvitationMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-send-smart-invitation", { ids });
      return await response.json();
    },
    onSuccess: (data: { successCount: number; errorCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitations envoyées",
        description: `${data.successCount} envoyée(s), ${data.errorCount} échouée(s)`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de l'envoi groupé.", variant: "destructive" });
    },
  });

  const bulkSendReminderMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-send-reminder", { ids });
      return await response.json();
    },
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Relances envoyées",
        description: `${data.sent} envoyée(s), ${data.failed} échouée(s)`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de l'envoi des relances.", variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/rsvp/${id}/send-reminder`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({ title: "Relance envoyée", description: "L'email de relance a bien été envoyé." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible d'envoyer la relance.", variant: "destructive" });
    },
  });

  const toggleBrunchMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/toggle-brunch`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le brunch", variant: "destructive" });
    },
  });

  const buildInvitationName = (firstName: string, lastName: string, partySize: number): string => {
    const couple = partySize >= 2;
    const alreadyCouple = firstName.toLowerCase().startsWith("couple");
    if (couple && !alreadyCouple) return `Couple ${lastName}`.trim();
    if (couple && alreadyCouple) return firstName;
    return `${firstName} ${lastName}`.trim();
  };

  const getGalaUrl = (response: RsvpResponse) => {
    const name = buildInvitationName(response.firstName, response.lastName, response.partySize || 1);
    const type = response.invitationType || 1;
    const brunch = response.brunchInvited ? "&brunch=1" : "";
    const table = response.tableNumber ? `&table=${response.tableNumber}` : "";
    return `/gala/${encodeURIComponent(name)}?type=${type}${brunch}${table}`;
  };

  const getDot19Url = (response: RsvpResponse) => {
    const name = buildInvitationName(response.firstName, response.lastName, response.partySize || 1);
    return `/dot19/${encodeURIComponent(name)}`;
  };

  const copyGalaLink = async (response: RsvpResponse) => {
    try {
      const configRes = await fetch("/api/site-config");
      const configData = await configRes.json();
      const baseUrl = configData.siteUrl || window.location.origin;
      const link = `${baseUrl}${getGalaUrl(response)}`;
      await navigator.clipboard.writeText(link);
      toast({ title: "Lien copié", description: link });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier le lien", variant: "destructive" });
    }
  };

  const sendGalaInvitationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/send-gala-invitation`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitation Gala envoyée",
        description: "L'invitation gala a été envoyée par email",
      });
    },
    onError: async (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Non autorisé", description: "Reconnexion...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      let errorMessage = "Impossible d'envoyer l'invitation gala";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {}
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/resend-confirmation`);
    },
    onSuccess: () => {
      toast({
        title: "Confirmation envoyée",
        description: "Le mail de confirmation a été renvoyé à l'invité",
      });
    },
    onError: async (error: any) => {
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
      let errorMessage = "Impossible de renvoyer la confirmation";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {}
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Create new guest mutation
  const createGuestMutation = useMutation({
    mutationFn: async (data: typeof newGuest) => {
      return await apiRequest("POST", "/api/rsvp", {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Succès",
        description: "Invité ajouté avec succès",
      });
      setAddGuestDialogOpen(false);
      setNewGuest({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        partySize: 1,
        availability: "21-march",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'invité",
        variant: "destructive",
      });
    },
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResponses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResponses.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterAvailability && filterAvailability !== 'all') params.set('availability', filterAvailability);
    const queryString = params.toString();
    window.open(`/api/rsvp/export/csv${queryString ? '?' + queryString : ''}`, '_blank');
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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAvailability, filterStatus, filterPartySize, filterTable, filterInvitationType]);

  const activeFilterCount = [filterStatus, filterPartySize, filterAvailability, filterTable, filterInvitationType].filter(f => f !== "all").length;

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterPartySize("all");
    setFilterAvailability("all");
    setFilterTable("all");
    setFilterInvitationType("all");
    setSearchQuery("");
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
      filterAvailability === "all" || 
      response.availability === filterAvailability ||
      (filterAvailability === "19-march" && response.availability === "both") ||
      (filterAvailability === "21-march" && response.availability === "both");

    const matchesStatus =
      filterStatus === "all" || response.status === filterStatus;

    const matchesPartySize =
      filterPartySize === "all" || response.partySize === parseInt(filterPartySize);

    const matchesTable =
      filterTable === "all" ||
      (filterTable === "unassigned" && !response.tableNumber) ||
      (filterTable === "assigned" && response.tableNumber !== null) ||
      (filterTable !== "unassigned" && filterTable !== "assigned" && response.tableNumber === parseInt(filterTable));

    const matchesInvitationType =
      filterInvitationType === "all" || response.invitationType === parseInt(filterInvitationType);

    return matchesSearch && matchesAvailability && matchesStatus && matchesPartySize && matchesTable && matchesInvitationType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Clamp current page when data changes (e.g., after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Stats
  const stats = {
    total: responses.length,
    both: responses.filter(r => r.availability === 'both').length,
    march19: responses.filter(r => r.availability === '19-march').length,
    march21: responses.filter(r => r.availability === '21-march').length,
    unavailable: responses.filter(r => r.availability === 'unavailable').length,
    assigned: responses.filter(r => r.tableNumber !== null).length,
    viewed: responses.filter(r => r.invitationViewedAt).length,
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoRA}
              alt="R&A Logo"
              className="h-10 w-auto"
            />
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

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Sections */}
        <div className="space-y-8">
          <DashboardWidgets responses={responses} onFilterChange={setFilterAvailability} />

          {/* Site Settings */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">Montant de la cagnotte</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cagnotteSettings?.visible !== false
                    ? "Le total collecté est affiché sur la page /cagnotte"
                    : "Le total collecté est masqué sur la page /cagnotte"}
                </p>
              </div>
              <Button
                variant={cagnotteSettings?.visible !== false ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCagnotteMutation.mutate(!(cagnotteSettings?.visible !== false))}
                disabled={toggleCagnotteMutation.isPending}
                data-testid="button-toggle-cagnotte"
                className="flex items-center gap-2"
              >
                {cagnotteSettings?.visible !== false ? (
                  <><Eye className="h-4 w-4" /> Affiché</>
                ) : (
                  <><EyeOff className="h-4 w-4" /> Masqué</>
                )}
              </Button>
            </div>
          </Card>

          {/* Guest Management Section */}
          <Card className="flex flex-col">
            <div className="p-6 border-b bg-card">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Gestion des invités</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gérez votre liste d'invités, les réponses et les plans de table</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <Dialog open={addGuestDialogOpen} onOpenChange={setAddGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex-1 sm:flex-none" data-testid="button-add-guest">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter invité
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter un invité</DialogTitle>
                        <DialogDescription>
                          Remplissez les informations pour ajouter un nouvel invité.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="add-firstname">Prénom *</Label>
                            <Input
                              id="add-firstname"
                              value={newGuest.firstName}
                              onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                              placeholder="Prénom de l'invité"
                              data-testid="input-add-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-lastname">Nom *</Label>
                            <Input
                              id="add-lastname"
                              value={newGuest.lastName}
                              onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                              placeholder="Nom de l'invité"
                              data-testid="input-add-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-email">Email</Label>
                          <Input
                            id="add-email"
                            type="email"
                            value={newGuest.email}
                            onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                            placeholder="email@exemple.com"
                            data-testid="input-add-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-phone">Téléphone (pour WhatsApp)</Label>
                          <Input
                            id="add-phone"
                            value={newGuest.phone}
                            onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                            data-testid="input-add-phone"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="add-partysize">Nombre de personnes *</Label>
                            <Select
                              value={newGuest.partySize.toString()}
                              onValueChange={(value) => setNewGuest({ ...newGuest, partySize: parseInt(value) })}
                            >
                              <SelectTrigger data-testid="select-add-partysize">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Solo (1 personne)</SelectItem>
                                <SelectItem value="2">Couple (2 personnes)</SelectItem>
                                <SelectItem value="3">Groupe (3 personnes)</SelectItem>
                                <SelectItem value="4">Groupe (4 personnes)</SelectItem>
                                <SelectItem value="5">Groupe (5 personnes)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-availability">Disponibilité *</Label>
                            <Select
                              value={newGuest.availability}
                              onValueChange={(value) => setNewGuest({ ...newGuest, availability: value })}
                            >
                              <SelectTrigger data-testid="select-add-availability">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="19-march">19 mars seulement</SelectItem>
                                <SelectItem value="21-march">21 mars seulement</SelectItem>
                                <SelectItem value="both">Les deux dates</SelectItem>
                                <SelectItem value="unavailable">Non disponible</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-notes">Commentaire (optionnel)</Label>
                          <Textarea
                            id="add-notes"
                            placeholder="Régime alimentaire, allergies, besoins spéciaux..."
                            value={newGuest.notes}
                            onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                            data-testid="input-add-notes"
                            className="resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddGuestDialogOpen(false);
                            setNewGuest({
                              firstName: "",
                              lastName: "",
                              email: "",
                              phone: "",
                              partySize: 1,
                              availability: "21-march",
                              notes: "",
                            });
                          }}
                          data-testid="button-cancel-add"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => {
                            if (!newGuest.firstName || !newGuest.lastName) {
                              toast({
                                title: "Erreur",
                                description: "Le prénom et le nom sont requis",
                                variant: "destructive",
                              });
                              return;
                            }
                            createGuestMutation.mutate(newGuest);
                          }}
                          disabled={createGuestMutation.isPending}
                          data-testid="button-confirm-add"
                        >
                          {createGuestMutation.isPending ? "Ajout..." : "Ajouter l'invité"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {selectedIds.length > 0 && (
                    <>
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => bulkSendSmartInvitationMutation.mutate(selectedIds)}
                        disabled={bulkSendSmartInvitationMutation.isPending}
                        data-testid="button-bulk-send-invitation"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {bulkSendSmartInvitationMutation.isPending ? "Envoi..." : `Envoyer invitation (${selectedIds.length})`}
                      </Button>
                      <Button
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => bulkSendReminderMutation.mutate(selectedIds)}
                        disabled={bulkSendReminderMutation.isPending}
                        data-testid="button-bulk-send-reminder"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {bulkSendReminderMutation.isPending ? "Envoi..." : `Envoyer relance (${selectedIds.length})`}
                      </Button>
                      <Button
                        variant="default"
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => bulkSendInvitation21Mutation.mutate(selectedIds)}
                        disabled={bulkSendInvitation21Mutation.isPending}
                        data-testid="button-bulk-send-inv21"
                      >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {bulkSendInvitation21Mutation.isPending ? "Envoi..." : `Inv. 21 mars (${selectedIds.length})`}
                      </Button>
                      <Select
                        onValueChange={(value) => {
                          bulkInvitationTypeMutation.mutate({ ids: selectedIds, invitationType: parseInt(value) });
                        }}
                      >
                        <SelectTrigger
                          className="w-[200px] bg-purple-600 text-white border-purple-600"
                          data-testid="select-bulk-invitation-type"
                        >
                          <SelectValue placeholder={`Type invitation (${selectedIds.length})`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Type 1 - Complet</SelectItem>
                          <SelectItem value="2">Type 2 - Bénédiction</SelectItem>
                          <SelectItem value="3">Type 3 - Soirée</SelectItem>
                          <SelectItem value="4">Type 4 - Mairie + Soirée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        onValueChange={(value) => {
                          bulkAssignTableMutation.mutate({ ids: selectedIds, tableNumber: value === "none" ? null : parseInt(value) });
                        }}
                      >
                        <SelectTrigger
                          className="w-[210px] bg-teal-600 text-white border-teal-600"
                          data-testid="select-bulk-assign-table"
                        >
                          <SelectValue placeholder={`Attribuer table (${selectedIds.length})`} />
                        </SelectTrigger>
                        <SelectContent
                          className="!max-h-[400px] overflow-y-auto"
                        >
                          <SelectItem value="none">— Retirer table</SelectItem>
                          {WEDDING_TABLES.map(t => (
                            <SelectItem key={t.number} value={String(t.number)}>
                              Table {t.number} — {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}

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

              <div className="flex flex-col gap-4">
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
                  {activeFilterCount > 0 && (
                    <Button variant="outline" onClick={clearAllFilters} data-testid="button-clear-filters">
                      <X className="h-4 w-4 mr-2" />
                      Effacer les filtres ({activeFilterCount})
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[170px]" data-testid="select-filter-status">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Statut" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPartySize} onValueChange={setFilterPartySize}>
                    <SelectTrigger className="w-[170px]" data-testid="select-filter-party-size">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Personnes" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes tailles</SelectItem>
                      <SelectItem value="1">Solo (1)</SelectItem>
                      <SelectItem value="2">Couple (2)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger className="w-[210px]" data-testid="select-filter-availability">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Disponibilité" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes disponibilités</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="both">Les deux dates</SelectItem>
                      <SelectItem value="19-march">19 mars</SelectItem>
                      <SelectItem value="21-march">21 mars</SelectItem>
                      <SelectItem value="unavailable">Indisponible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterTable} onValueChange={setFilterTable}>
                    <SelectTrigger className="w-[200px]" data-testid="select-filter-table">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Table" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="!max-h-[400px] overflow-y-auto">
                      <SelectItem value="all">Toutes les tables</SelectItem>
                      <SelectItem value="assigned">Avec table</SelectItem>
                      <SelectItem value="unassigned">Sans table</SelectItem>
                      {WEDDING_TABLES.map(t => (
                        <SelectItem key={t.number} value={t.number.toString()}>
                          Table {t.number} - {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterInvitationType} onValueChange={setFilterInvitationType}>
                    <SelectTrigger className="w-[180px]" data-testid="select-filter-invitation-type">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="1">Type 1 - Complet</SelectItem>
                      <SelectItem value="2">Type 2 - Bénédiction</SelectItem>
                      <SelectItem value="3">Type 3 - Soirée</SelectItem>
                      <SelectItem value="4">Type 4 - Mairie + Soirée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={filteredResponses.length > 0 && selectedIds.length === filteredResponses.length}
                        onChange={toggleSelectAll}
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="font-sans">Statut</TableHead>
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
                    <TableHead className="font-sans">Type</TableHead>
                    <TableHead className="font-sans">Inv. 21</TableHead>
                    <TableHead className="font-sans">Vu</TableHead>
                    <TableHead className="font-sans">Brunch</TableHead>
                    <TableHead className="font-sans">Plan</TableHead>
                    <TableHead className="font-sans">Commentaire</TableHead>
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
                      <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
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
                      .slice(startIndex, endIndex)
                      .map((response) => (
                        <TableRow key={response.id} data-testid={`row-guest-${response.id}`} className={selectedIds.includes(response.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(response.id)}
                              onChange={() => toggleSelect(response.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${response.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                              {response.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </span>
                          </TableCell>
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
                                  <div className="flex flex-col gap-0.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                                    <div className="flex items-center gap-1.5">
                                      <Table2 className="h-3.5 w-3.5" />
                                      <span className="font-sans text-xs font-semibold" data-testid={`text-table-${response.id}`}>
                                        Table {response.tableNumber}
                                      </span>
                                    </div>
                                    {getTableInfo(response.tableNumber) && (
                                      <span className="text-[10px] text-orange-600 italic pl-5">
                                        {getTableInfo(response.tableNumber)?.name}
                                      </span>
                                    )}
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
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Attribuer une table</DialogTitle>
                                      <DialogDescription>
                                        Choisissez une table pour {response.firstName} {response.lastName}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Sélectionner une table</Label>
                                        <Select
                                          onValueChange={(value) => {
                                            const tableNumber = parseInt(value);
                                            if (tableNumber > 0) {
                                              updateTableMutation.mutate({ id: response.id, tableNumber });
                                            }
                                          }}
                                        >
                                          <SelectTrigger 
                                            className="w-full mt-2" 
                                            data-testid={`select-table-${response.id}`}
                                          >
                                            <SelectValue placeholder="Choisir une table..." />
                                          </SelectTrigger>
                                          <SelectContent className="!max-h-[400px] overflow-y-auto">
                                            {WEDDING_TABLES.map((table) => (
                                              <SelectItem 
                                                key={table.number} 
                                                value={table.number.toString()}
                                                data-testid={`option-table-${table.number}`}
                                              >
                                                <div className="flex flex-col py-1">
                                                  <span className="font-semibold">
                                                    Table {table.number} - {table.name}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground italic">
                                                    {table.subtitle}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(response.invitationType || 1)}
                              onValueChange={(value) => {
                                updateInvitationTypeMutation.mutate({ id: response.id, invitationType: parseInt(value) });
                              }}
                            >
                              <SelectTrigger className="w-[70px] h-7 text-xs" data-testid={`select-invitation-type-${response.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {response.invitation21SentAt ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium" data-testid={`text-inv21-status-${response.id}`}>
                                <Check className="h-3 w-3" />
                                {new Date(response.invitation21SentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50" data-testid={`text-inv21-status-${response.id}`}>-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {response.invitationViewedAt ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium" data-testid={`text-viewed-status-${response.id}`}>
                                <Eye className="h-3 w-3" />
                                {new Date(response.invitationViewedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50" data-testid={`text-viewed-status-${response.id}`}>-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleBrunchMutation.mutate(response.id)}
                              data-testid={`button-brunch-${response.id}`}
                              title={response.brunchInvited ? "Retirer du brunch" : "Inviter au brunch"}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                response.brunchInvited
                                  ? "bg-orange-400 border-orange-400 text-white"
                                  : "border-muted-foreground/40 hover:border-orange-300"
                              }`}
                            >
                              {response.brunchInvited && <Check className="h-3 w-3" />}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleSeatingMutation.mutate(response.id)}
                              data-testid={`button-seating-check-${response.id}`}
                              title={response.seatingConfirmed ? "Retiré du plan de table" : "Marqué comme placé sur le plan de table"}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                response.seatingConfirmed
                                  ? "bg-amber-500 border-amber-500 text-white"
                                  : "border-muted-foreground/40 hover:border-amber-400"
                              }`}
                            >
                              {response.seatingConfirmed && <Check className="h-3 w-3" />}
                            </button>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {response.notes ? (
                              <span className="text-sm text-muted-foreground truncate block" title={response.notes}>
                                {response.notes.length > 50 ? `${response.notes.substring(0, 50)}...` : response.notes}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">-</span>
                            )}
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
                              {response.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => sendSmartInvitationMutation.mutate(response.id)}
                                  disabled={sendSmartInvitationMutation.isPending}
                                  title="Envoyer invitation"
                                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                  data-testid={`button-send-smart-invitation-${response.id}`}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {response.phone && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => whatsappMutation.mutate({
                                    id: response.id,
                                    firstName: response.firstName,
                                    lastName: response.lastName,
                                    partySize: response.partySize || 1,
                                  })}
                                  disabled={whatsappMutation.isPending}
                                  title={response.whatsappInvitationSentAt
                                    ? `WhatsApp envoyé le ${new Date(response.whatsappInvitationSentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — Renvoyer ?`
                                    : "Envoyer via WhatsApp"}
                                  className={response.whatsappInvitationSentAt
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"}
                                  data-testid={`button-whatsapp-${response.id}`}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {response.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const type = (response.availability === "21-march" || response.availability === "both") ? "21" : "gala";
                                    window.open(`/api/rsvp/${response.id}/email-preview?type=${type}`, '_blank');
                                  }}
                                  title="Aperçu email"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  data-testid={`button-email-preview-${response.id}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {response.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (response.reminderSentAt) {
                                      if (!window.confirm(`Relance déjà envoyée le ${new Date(response.reminderSentAt).toLocaleDateString('fr-BE')}. Renvoyer ?`)) return;
                                    }
                                    sendReminderMutation.mutate(response.id);
                                  }}
                                  title={response.reminderSentAt ? `Relance envoyée le ${new Date(response.reminderSentAt).toLocaleDateString('fr-BE')} — Renvoyer ?` : "Envoyer relance"}
                                  className={response.reminderSentAt ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}
                                  data-testid={`button-send-reminder-${response.id}`}
                                >
                                  <Bell className="h-4 w-4" />
                                </Button>
                              )}
                              {response.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (response.invitation21SentAt) {
                                      if (!window.confirm(`Invitation 21 déjà envoyée le ${new Date(response.invitation21SentAt).toLocaleDateString('fr-BE')}. Renvoyer ?`)) return;
                                    }
                                    sendInvitation21Mutation.mutate(response.id);
                                  }}
                                  title={response.invitation21SentAt ? `Inv. 21 envoyée le ${new Date(response.invitation21SentAt).toLocaleDateString('fr-BE')} — Renvoyer ?` : "Envoyer invitation 21 mars"}
                                  className={response.invitation21SentAt ? "text-violet-500 hover:text-violet-600 hover:bg-violet-50" : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"}
                                  data-testid={`button-send-inv21-${response.id}`}
                                >
                                  <CalendarDays className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/guest/${response.id}`, '_blank')}
                                title="Voir invitation"
                                className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                data-testid={`button-view-invitation-${response.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingResponse(response);
                                  setEditDialogOpen(true);
                                }}
                                title="Modifier"
                                className="text-muted-foreground hover:text-foreground"
                                data-testid={`button-edit-${response.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setDeletingId(response.id);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Supprimer"
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

            {/* Pagination Controls */}
            {filteredResponses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Affichage {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)} sur {filteredResponses.length} invités
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[100px]" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="300">300</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
                        <SelectItem value="3">Groupe (3 personnes)</SelectItem>
                        <SelectItem value="4">Groupe (4 personnes)</SelectItem>
                        <SelectItem value="5">Groupe (5 personnes)</SelectItem>
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
                    <Label htmlFor="edit-phone">Téléphone (pour WhatsApp)</Label>
                    <Input
                      id="edit-phone"
                      placeholder="+33 6 12 34 56 78"
                      value={editingResponse.phone ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, phone: e.target.value })}
                      data-testid="input-edit-phone"
                    />
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
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-notes">Commentaire (optionnel)</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Régime alimentaire, allergies, besoins spéciaux..."
                      value={editingResponse.notes ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, notes: e.target.value })}
                      data-testid="input-edit-notes"
                      className="resize-none"
                      rows={3}
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
                      // Create clean payload with only necessary fields
                      const payload = {
                        firstName: editingResponse.firstName,
                        lastName: editingResponse.lastName,
                        email: editingResponse.email ?? null,
                        phone: editingResponse.phone ?? null,
                        partySize: editingResponse.partySize,
                        availability: editingResponse.availability,
                        status: editingResponse.status ?? 'pending',
                        tableNumber: editingResponse.tableNumber ?? null,
                        notes: editingResponse.notes ?? null,
                      };
                      updateRsvpMutation.mutate({
                        id: editingResponse.id,
                        data: payload
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
