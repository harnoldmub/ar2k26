import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Search, CheckCircle2, Circle, Users, Table2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import logoRA from "@assets/logo-ra.png";

const WEDDING_TABLES: Record<number, string> = {
  1: "Amour Éternel", 2: "Âmes Sœurs", 3: "Promesse Dorée", 4: "Alliance Sacrée",
  5: "Coup de Foudre", 6: "Grâce Divine", 7: "Cœurs Unis", 8: "Passion d'Or",
  9: "Serment Éternel", 10: "Flamme d'Amour", 11: "Harmonie Dorée", 12: "Union Parfaite",
  13: "Destin Doré", 14: "Éclat de Bonheur", 15: "Joyau Précieux", 16: "Couronne d'Amour",
  17: "Lien Sacré", 18: "Origine Divine", 19: "Héritage d'Amour", 20: "Lumière Éternelle",
  21: "Cantique d'Amour", 22: "Main dans la Main", 23: "Promesse Céleste", 24: "Trésor du Cœur",
  25: "Éternelle Allégresse", 26: "Souffle d'Or", 27: "Chemin de Grâce", 28: "Amour Triomphant",
  29: "Scellement Divin", 30: "Rayon de Gloire", 31: "Serment Sacré", 32: "Éternelle Promesse",
  33: "Chemin d'Amour", 34: "Couronne de Gloire", 35: "Union Glorieuse", 36: "Amour Véritable",
  37: "Source de Joie", 38: "Alliance Éternelle", 39: "Horizon d'Amour", 40: "Golden Love",
  41: "Jardin d'Amour", 42: "Promesse Éternelle", 43: "Grâce Infinie", 44: "Lumière d'Amour",
  45: "Alliance de Vie", 46: "Cœur Fidèle", 47: "Chemin d'Éternité", 48: "Étreinte Divine",
  49: "Serment d'Amour", 50: "Gloire d'Amour", 51: "Amour Accompli", 52: "Lumière de Grâce",
};

interface AccueilGuest {
  id: number;
  firstName: string;
  lastName: string;
  partySize: number;
  tableNumber: number | null;
  availability: string;
  checkedInAt: string | null;
}

function getDateParam(): "19" | "21" | null {
  const params = new URLSearchParams(window.location.search);
  const d = params.get("date");
  if (d === "19" || d === "21") return d;
  return null;
}

function matchesDate(guest: AccueilGuest, dateFilter: "19" | "21" | null): boolean {
  if (!dateFilter) return true;
  if (dateFilter === "19") return guest.availability === "19-march" || guest.availability === "both";
  if (dateFilter === "21") return guest.availability === "21-march" || guest.availability === "both";
  return true;
}

export default function Accueil() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  const dateParam = getDateParam();

  const { data: guests = [], isLoading } = useQuery<AccueilGuest[]>({
    queryKey: ["/api/accueil/guests"],
    refetchInterval: 15000,
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accueil/guests"] });
      toast({ title: "Arrivée enregistrée", description: "L'invité est marqué comme présent." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'arrivée.", variant: "destructive" });
    },
  });

  const removeCheckInMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accueil/guests"] });
      toast({ title: "Arrivée annulée", description: "L'enregistrement a été supprimé." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'annuler l'arrivée.", variant: "destructive" });
    },
  });

  const dateGuests = useMemo(() => guests.filter(g => matchesDate(g, dateParam)), [guests, dateParam]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return dateGuests.filter(g => {
      const nameMatch = !q || `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        `${g.lastName} ${g.firstName}`.toLowerCase().includes(q);
      if (!nameMatch) return false;
      if (filter === "present") return !!g.checkedInAt;
      if (filter === "absent") return !g.checkedInAt;
      return true;
    }).sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`, "fr"));
  }, [dateGuests, search, filter]);

  const presentCount = dateGuests.filter(g => g.checkedInAt).length;
  const totalPeople = dateGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
  const presentPeople = dateGuests.filter(g => g.checkedInAt).reduce((sum, g) => sum + (g.partySize || 1), 0);

  const dateLabel = dateParam === "19" ? "19 mars" : dateParam === "21" ? "21 mars" : "Tous les invités";

  if (!dateParam) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex flex-col items-center justify-center px-6">
        <img src={logoRA} alt="R&A" className="h-16 w-auto mb-8" />
        <h1 className="text-2xl font-serif font-light tracking-widest text-foreground uppercase mb-2">
          Accueil Invités
        </h1>
        <p className="text-sm text-muted-foreground mb-10 tracking-wide">Choisissez la date de la cérémonie</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button
            className="w-full h-14 text-base font-serif font-light tracking-wide"
            data-testid="button-date-19"
            onClick={() => { window.location.href = "/accueil?date=19"; }}
          >
            Mariage du 19 mars
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base font-serif font-light tracking-wide"
            data-testid="button-date-21"
            onClick={() => { window.location.href = "/accueil?date=21"; }}
          >
            Mariage du 21 mars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <div className="sticky top-0 z-50 bg-[#f9f7f4] border-b border-border/30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={logoRA}
              alt="R&A"
              className="h-7 w-auto cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => { window.location.href = "/accueil"; }}
            />
            <div className="flex-1">
              <h1 className="text-base font-serif font-light tracking-wide leading-tight">Accueil Invités</h1>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{presentPeople} présents</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un invité…"
              className="pl-9 bg-white border-border/40"
              data-testid="input-search-guest"
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {(["all", "absent", "present"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white border-border/40 text-muted-foreground"
                }`}
                data-testid={`filter-${f}`}
              >
                {f === "all"
                  ? `Tous (${dateGuests.length})`
                  : f === "absent"
                  ? `Attendus (${dateGuests.length - presentCount})`
                  : `Arrivés (${presentCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent mb-3" />
            <p className="text-sm">Chargement…</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun invité trouvé</p>
          </div>
        )}

        {filtered.map(guest => {
          const isPresent = !!guest.checkedInAt;
          const isExpanded = expandedId === guest.id;
          const tableName = guest.tableNumber ? (WEDDING_TABLES[guest.tableNumber] ?? null) : null;
          const isPending = checkInMutation.isPending || removeCheckInMutation.isPending;

          return (
            <div
              key={guest.id}
              className={`bg-white rounded-lg border transition-all ${
                isPresent ? "border-green-200 bg-green-50/30" : "border-border/30"
              }`}
              data-testid={`card-guest-${guest.id}`}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : guest.id)}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (!isPending) {
                      isPresent ? removeCheckInMutation.mutate(guest.id) : checkInMutation.mutate(guest.id);
                    }
                  }}
                  disabled={isPending}
                  className="shrink-0 transition-transform active:scale-95"
                  data-testid={`button-checkin-${guest.id}`}
                  title={isPresent ? "Cliquer pour annuler l'arrivée" : "Marquer comme arrivé"}
                >
                  {isPresent
                    ? <CheckCircle2 className="h-7 w-7 text-green-500" />
                    : <Circle className="h-7 w-7 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-base leading-tight ${isPresent ? "text-green-700" : "text-foreground"}`}>
                    {guest.firstName} <span className="uppercase">{guest.lastName}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {guest.tableNumber ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Table2 className="h-3 w-3" />
                        Table {guest.tableNumber}{tableName ? ` — ${tableName}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500/80 italic">Pas de table attribuée</span>
                    )}
                    {guest.partySize > 1 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {guest.partySize}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPresent && (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs py-0">
                      Arrivé
                    </Badge>
                  )}
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border/20">
                  <div className="flex items-center justify-between pt-3 gap-3 flex-wrap">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Groupe :</span>{" "}
                        {guest.partySize} personne{guest.partySize > 1 ? "s" : ""}
                      </p>
                      {isPresent && guest.checkedInAt && (
                        <p>
                          <span className="font-medium text-foreground">Arrivée :</span>{" "}
                          {new Date(guest.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isPresent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCheckInMutation.mutate(guest.id)}
                          disabled={isPending}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          data-testid={`button-remove-checkin-${guest.id}`}
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Supprimer l'arrivée
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate(guest.id)}
                          disabled={isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-checkin-confirm-${guest.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Enregistrer l'arrivée
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
