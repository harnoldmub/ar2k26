import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Calendar, Heart, Users, Clock, Gift, ExternalLink, UtensilsCrossed } from "lucide-react";
import logoRA from "@/assets/logo-ra.png";

interface GuestData {
  id: number;
  firstName: string;
  lastName: string;
  availability: string;
  partySize: number;
  invitationType: number;
  tableNumber: number | null;
  brunchInvited: boolean;
  pdfUrl: string | null;
}

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

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 justify-center items-center">
      {[
        { value: timeLeft.days, label: "J" },
        { value: timeLeft.hours, label: "H" },
        { value: timeLeft.minutes, label: "M" },
        { value: timeLeft.seconds, label: "S" },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-lg font-bold text-amber-400">
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-amber-200/50 mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GuestInvitationPage() {
  const { guestId } = useParams<{ guestId: string }>();

  const { data: guest, isLoading, error } = useQuery<GuestData>({
    queryKey: ["/api/invitation/guest", guestId],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}`);
      if (!res.ok) throw new Error("Invité non trouvé");
      return res.json();
    },
    enabled: !!guestId,
  });

  useEffect(() => {
    if (guestId) {
      fetch(`/api/invitation/guest/${guestId}/track-view`, { method: "POST" }).catch(() => {});
    }
  }, [guestId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-amber-200 text-lg">Invitation non trouvée</p>
        </div>
      </div>
    );
  }

  const showMarch19 = guest.availability === "19-march" || guest.availability === "both";
  const showMarch21 = guest.availability === "21-march" || guest.availability === "both";
  const isCouple = guest.partySize >= 2;

  const buildInvitationName = (firstName: string, lastName: string, partySize: number) => {
    const couple = partySize >= 2;
    const alreadyCouple = firstName.toLowerCase().startsWith("couple");
    if (couple && !alreadyCouple) return `Couple ${lastName}`.trim();
    if (couple && alreadyCouple) return firstName;
    return `${firstName} ${lastName}`.trim();
  };

  const displayName = buildInvitationName(guest.firstName, guest.lastName, guest.partySize);
  const invitationName = encodeURIComponent(displayName);

  // Determine the countdown target date based on availability
  const getCountdownDate = () => {
    if (guest.availability === "19-march") {
      return new Date("2026-03-19T00:00:00");
    } else if (guest.availability === "21-march") {
      return new Date("2026-03-21T00:00:00");
    } else {
      // For "both", show countdown to the first date (19 March)
      return new Date("2026-03-19T00:00:00");
    }
  };

  const countdownDate = getCountdownDate();
  const countdownLabel = guest.availability === "21-march" ? "21 Mars 2026" : "19 Mars 2026";

  const handleDownloadDot = () => {
    if (guest.pdfUrl) {
      window.open(guest.pdfUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-300/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 2}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Gold border effect */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-amber-400 via-amber-500/50 to-amber-400 rounded-2xl" />
        
        <div className="relative bg-[#0d0d18] rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src={logoRA}
              alt="Ruth & Arnold"
              className="w-24 h-24 mx-auto"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-serif text-amber-400 mb-1">
            Ruth & Arnold
          </h1>
          <p className="text-amber-200/60 text-sm tracking-[0.3em] uppercase mb-8">
            Vos Invitations
          </p>

          {/* Guest info box */}
          <div className="bg-[#151520] rounded-xl p-5 mb-6 border border-amber-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCouple ? (
                <Users className="w-4 h-4 text-amber-400" />
              ) : (
                <Heart className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-amber-200/70 text-xs uppercase tracking-wider">
                {isCouple ? "Invitation Couple" : "Invitation Personnelle"}
              </span>
            </div>
            
            <h2 className="text-2xl font-serif text-white">
              {displayName}
            </h2>
            <p className="text-amber-200/50 text-sm mt-1">
              {isCouple ? "2 personnes" : "1 personne"}
            </p>

            {guest.tableNumber && (
              <div className="mt-3 pt-3 border-t border-amber-500/15">
                <div className="flex items-center justify-center gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 text-xs uppercase tracking-wider">
                    Table {guest.tableNumber}{WEDDING_TABLES[guest.tableNumber] ? ` — ${WEDDING_TABLES[guest.tableNumber]}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="mb-8">
            <p className="text-amber-200/60 text-xs uppercase tracking-widest mb-3">
              <Clock className="w-3 h-3 inline mr-1" />
              Compte à rebours - {countdownLabel}
            </p>
            <Countdown targetDate={countdownDate} />
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            {showMarch19 && (
              <div>
                <p className="text-amber-300/80 text-xs mb-2 uppercase tracking-widest">
                  Soirée de la DOT
                </p>
                {guest.pdfUrl ? (
                  <Button
                    onClick={handleDownloadDot}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-14 text-base rounded-xl"
                    data-testid="button-download-19"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    19 Mars 2026
                    <Download className="w-4 h-4 ml-3" />
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-14 text-base rounded-xl"
                    data-testid="button-dot19-invitation"
                  >
                    <a
                      href={`/dot19/${invitationName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Calendar className="w-5 h-5 mr-3" />
                      19 Mars 2026
                      <ExternalLink className="w-4 h-4 ml-3" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {showMarch21 && (
              <div>
                <p className="text-amber-300/80 text-xs mb-2 uppercase tracking-widest">
                  Mariage Civil & Religieux
                </p>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-14 text-base rounded-xl"
                  data-testid="button-invitation-21"
                >
                  <a
                    href={`/gala/${invitationName}?type=${guest.invitationType || 1}${guest.brunchInvited ? "&brunch=1" : ""}${guest.tableNumber ? `&table=${guest.tableNumber}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    21 Mars 2026
                    <ExternalLink className="w-4 h-4 ml-3" />
                  </a>
                </Button>
              </div>
            )}

            {guest.brunchInvited && (
              <div>
                <p className="text-amber-300/80 text-xs mb-2 uppercase tracking-widest">
                  Brunch du lendemain
                </p>
                <div
                  className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left"
                  data-testid="section-brunch-info"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-amber-300 font-semibold text-sm">Dimanche 22 mars — 14h30 – 17h30</span>
                  </div>
                  <p className="text-amber-200/70 text-xs leading-relaxed">
                    <span className="font-medium text-amber-200/90">KAUA</span>
                    <br />Place Saint-Job, Uccle
                  </p>
                  <p className="text-amber-300 text-sm font-semibold mt-2">
                    25€ par personne
                  </p>
                  <p className="text-amber-200/50 text-xs mt-1">
                    Places limitées — sur invitation uniquement
                  </p>
                </div>
              </div>
            )}

            {!showMarch19 && !showMarch21 && (
              <div className="text-amber-200/60 text-sm py-4">
                Aucune invitation disponible pour le moment
              </div>
            )}
          </div>

          {/* Cagnotte section */}
          <div className="mt-8 pt-6 border-t border-amber-500/10">
            <div className="bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-xs uppercase tracking-wider font-medium">
                  Cadeau de Mariage
                </span>
              </div>
              <p className="text-amber-200/70 text-xs mb-3 leading-relaxed">
                Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, nous préférons une participation à notre cagnotte.
              </p>
              <a
                href="https://ar2k26.com/cagnotte"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                data-testid="link-cagnotte"
              >
                <Heart className="w-3 h-3" />
                Contribuer à la cagnotte
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-amber-500/10">
            <p className="text-amber-200/40 text-xs">
              Téléchargez vos invitations personnalisées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
