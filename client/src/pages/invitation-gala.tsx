import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, UtensilsCrossed } from "lucide-react";
import coupleImg from "@assets/IMG_9449_(1)_1772051281719.jpg";

const GOLD = "#B8943E";
const GOLD_LIGHT = "#D4B062";
const CREAM = "#FAF6F0";
const CREAM_DARK = "#F0E8DA";
const TEXT_DARK = "#2C2418";
const TEXT_MED = "#5C4F3D";
const TEXT_LIGHT = "#8A7D6B";

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
  drift: number;
  phase: number;
}

function GoldPetalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.documentElement);

    const count = Math.floor(window.innerWidth / 25);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.2 + Math.random() * 0.6,
      size: 3 + Math.random() * 5,
      opacity: 0.06 + Math.random() * 0.12,
      delay: Math.random() * 200,
      drift: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        if (frame < p.delay) continue;
        p.y += p.speed;
        p.x += Math.sin(frame * 0.01 + p.phase) * p.drift;
        if (p.y > canvas.height) {
          p.y = -p.size;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(184, 148, 62, ${p.opacity})`;
        ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, (frame * 0.005 + p.phase), 0, Math.PI * 2);
        ctx.fill();
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px flex-1 max-w-[80px]" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: GOLD }} />
      <div className="h-px flex-1 max-w-[80px]" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  );
}

function FadeInSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

const allTimelineEvents = [
  {
    time: "10h30",
    title: "Mairie",
    lines: ["Maison communale de Rhode-Saint-Genèse", "Rue du Village 46, 1640 Rhode-Saint-Genèse"],
    mapsUrl: "https://www.google.com/maps/place/Maison+communale+Rhode-Saint-Gen%C3%A8se/@50.7452532,4.345576,17z/data=!3m1!4b1!4m6!3m5!1s0x47c3cf9f9bc779bd:0x92d7d595bd735847!8m2!3d50.7452532!4d4.345576!16s%2Fg%2F11bzx4s__q?hl=fr",
    visibleForTypes: [1, 4],
    capacityNote: "Cérémonie limitée à 80 personnes",
  },
  {
    time: "12h45",
    title: "Bénédiction",
    lines: ["Avenue du Bois des Collines 3", "1420 Braine-l'Alleud, Belgique"],
    mapsUrl: "https://maps.google.com/?q=Avenue+du+Bois+des+Collines+3+1420+Braine-l'Alleud+Belgique",
    visibleForTypes: [1, 2],
    capacityNote: "Cérémonie limitée à 80 personnes",
  },
  {
    time: "14h00",
    title: "Vin d'honneur",
    lines: ["Avenue du Bois des Collines 3", "1420 Braine-l'Alleud, Belgique"],
    mapsUrl: "https://maps.google.com/?q=Avenue+du+Bois+des+Collines+3+1420+Braine-l'Alleud+Belgique",
    visibleForTypes: [1, 2],
    capacityNote: null,
  },
  {
    time: "19h30",
    title: "Soirée",
    lines: ["Yeni Yasam", "Dobbelenbergstraat 107, 1130 Bruxelles"],
    mapsUrl: "https://maps.google.com/?q=Yeni+Yasam+Dobbelenbergstraat+107+1130+Bruxelles+Belgique",
    visibleForTypes: [1, 2, 3, 4],
    capacityNote: null,
  },
];

export default function InvitationGala() {
  const params = useParams<{ name?: string }>();
  const rawName = params.name ? decodeURIComponent(params.name) : null;

  const searchParams = new URLSearchParams(window.location.search);
  const invitationType = Math.min(4, Math.max(1, parseInt(searchParams.get("type") || "1") || 1));
  const hasBrunch = searchParams.get("brunch") === "1";
  const tableNumber = parseInt(searchParams.get("table") || "0") || null;

  const WEDDING_TABLE_NAMES: Record<number, string> = {
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
  const tableName = tableNumber ? WEDDING_TABLE_NAMES[tableNumber] : null;

  const guestName = rawName || null;

  const timelineEvents = allTimelineEvents.filter(evt =>
    evt.visibleForTypes.includes(invitationType)
  );

  useEffect(() => {
    document.title = guestName
      ? `${guestName} — Invitation Gala`
      : "Ruth & Arnold — Invitation";
  }, [guestName]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: CREAM, fontFamily: "'Lato', sans-serif" }}>
      <GoldPetalCanvas />

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          {guestName && (
            <FadeInSection>
              <p
                className="text-3xl md:text-4xl lg:text-5xl mb-6"
                style={{ color: TEXT_DARK, fontFamily: "'Great Vibes', cursive" }}
                data-testid="text-guest-name"
              >
                {guestName}
              </p>
            </FadeInSection>
          )}

          <FadeInSection>
            <p
              className="text-xs tracking-[0.4em] uppercase mb-8"
              style={{ color: GOLD, fontFamily: "'Lato', sans-serif", fontWeight: 400 }}
              data-testid="text-invite-label"
            >
              {guestName ? "Vous êtes cordialement invité(e)" : "Vous êtes cordialement invités"}
            </p>
          </FadeInSection>

          <FadeInSection>
            <p
              className="text-lg md:text-xl mb-2 italic"
              style={{ color: TEXT_MED, fontFamily: "'Great Vibes', cursive" }}
            >
              au mariage de
            </p>
          </FadeInSection>

          <FadeInSection>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-wide mb-4"
              style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
              data-testid="text-couple-names"
            >
              Ruth <span style={{ color: GOLD }}>&</span> Arnold
            </h1>
          </FadeInSection>

          <FadeInSection>
            <GoldDivider className="my-6" />
          </FadeInSection>

          <FadeInSection>
            <p
              className="text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-10"
              style={{ color: TEXT_MED, fontFamily: "'Lato', sans-serif" }}
              data-testid="text-intro"
            >
              Notre amour s'écrit en lettres d'or…
              <br />
              Nous vous invitons à partager la célébration de notre mariage.
            </p>
          </FadeInSection>

          <FadeInSection>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>
                Samedi
              </p>
              <p
                className="text-6xl md:text-8xl font-bold"
                style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
                data-testid="text-date-day"
              >
                21
              </p>
              <p className="text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>
                Mars 2026
              </p>
            </div>
          </FadeInSection>

          <FadeInSection>
            <div className="mt-12 animate-bounce">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </FadeInSection>
        </section>

        {/* Programme / Timeline */}
        <section className="py-20 px-6">
          <FadeInSection>
            <h2
              className="text-3xl md:text-4xl text-center mb-2 tracking-wide"
              style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
              data-testid="text-programme-title"
            >
              Programme
            </h2>
            <p
              className="text-center text-sm tracking-[0.3em] uppercase mb-12"
              style={{ color: GOLD }}
            >
              de la journée
            </p>
          </FadeInSection>

          {/* Notice capacité restreinte — visible types 1, 2, 4 */}
          {[1, 2, 4].includes(invitationType) && (
            <FadeInSection>
              <div
                className="max-w-lg mx-auto mb-12 px-5 py-4 text-center"
                style={{
                  border: `1px solid ${GOLD}50`,
                  borderRadius: "4px",
                  backgroundColor: `${GOLD}08`,
                }}
                data-testid="notice-capacity-restriction"
              >
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-1"
                  style={{ color: GOLD }}
                >
                  Accès restreint
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: TEXT_DARK, fontFamily: "'Lato', sans-serif" }}
                >
                  {invitationType === 1
                    ? "La Mairie et la Bénédiction se déroulent dans des lieux à capacité limitée. Merci de respecter cela."
                    : invitationType === 2
                    ? "La Bénédiction se déroule dans un lieu à capacité limitée. Nous vous remercions de respecter scrupuleusement votre invitation."
                    : "La Mairie se déroule dans un lieu à capacité limitée. Nous vous remercions de respecter scrupuleusement votre invitation."}
                </p>
              </div>
            </FadeInSection>
          )}

          <div className="max-w-lg mx-auto relative">
            <div
              className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px"
              style={{ backgroundColor: `${GOLD}30` }}
            />

            {timelineEvents.map((evt, i) => (
              <FadeInSection key={i} className="mb-14 last:mb-0">
                <div className="relative flex flex-col items-center text-center">
                  <div
                    className="w-3 h-3 rotate-45 mb-4 relative z-10"
                    style={{ backgroundColor: GOLD, boxShadow: `0 0 12px ${GOLD}40` }}
                  />
                  <p
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}
                    data-testid={`text-event-time-${i}`}
                  >
                    {evt.time}
                  </p>
                  <p
                    className="text-lg md:text-xl tracking-wide uppercase mb-3"
                    style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
                    data-testid={`text-event-title-${i}`}
                  >
                    {evt.title}
                  </p>
                  {evt.lines.map((line, j) => (
                    <p
                      key={j}
                      className="text-sm leading-relaxed"
                      style={{ color: TEXT_LIGHT }}
                    >
                      {line}
                    </p>
                  ))}
                  {evt.capacityNote && (
                    <p
                      className="text-xs mt-2 italic"
                      style={{ color: GOLD, opacity: 0.8 }}
                    >
                      {evt.capacityNote}
                    </p>
                  )}
                  <a
                    href={evt.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs tracking-wider uppercase transition-opacity duration-200"
                    style={{ color: GOLD }}
                    data-testid={`link-maps-${i}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Voir sur Google Maps
                  </a>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        {/* Table Section - shown only if table is assigned */}
        {tableNumber && tableName && (
          <section className="py-12 px-6">
            <FadeInSection>
              <div className="max-w-md mx-auto text-center">
                <GoldDivider className="mb-6" />
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                  Votre place
                </p>
                <div
                  className="rounded-md p-6 text-center"
                  style={{ backgroundColor: "rgba(184,148,62,0.08)", border: "1px solid rgba(184,148,62,0.25)" }}
                  data-testid="section-table-info"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UtensilsCrossed className="w-4 h-4" style={{ color: GOLD }} />
                    <p className="text-xs uppercase tracking-widest" style={{ color: GOLD }}>
                      Plan de table
                    </p>
                  </div>
                  <p
                    className="text-3xl mb-1"
                    style={{ fontFamily: "'Great Vibes', cursive", color: TEXT_DARK }}
                  >
                    {tableName}
                  </p>
                  <p className="text-sm" style={{ color: TEXT_LIGHT }}>
                    Table n°{tableNumber}
                  </p>
                </div>
                <GoldDivider className="mt-6" />
              </div>
            </FadeInSection>
          </section>
        )}

        {/* Brunch Section - shown only if invited */}
        {hasBrunch && (
          <section className="py-12 px-6">
            <FadeInSection>
              <div className="max-w-md mx-auto text-center">
                <GoldDivider className="mb-6" />
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                  Évènement supplémentaire
                </p>
                <h3
                  className="text-3xl mb-4"
                  style={{ fontFamily: "'Great Vibes', cursive", color: TEXT_DARK }}
                >
                  Brunch
                </h3>
                <div
                  className="rounded-md p-6 mb-4 text-center"
                  style={{ backgroundColor: "rgba(184,148,62,0.08)", border: "1px solid rgba(184,148,62,0.25)" }}
                >
                  <p className="text-2xl font-semibold mb-1" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
                    Dimanche 22 mars
                  </p>
                  <p className="text-lg mb-3" style={{ color: TEXT_DARK }}>14h30 – 17h30</p>
                  <div className="flex items-start justify-center gap-2 text-sm" style={{ color: TEXT_LIGHT }}>
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                    <div>
                      <p className="font-medium" style={{ color: TEXT_DARK }}>KAUA</p>
                      <p>Place Saint-Job, Uccle</p>
                      <a
                        href="https://maps.google.com/?q=Kaua+Robusca+Coffee+Uccle"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-2 underline underline-offset-2"
                        style={{ color: GOLD }}
                      >
                        Voir sur Google Maps
                      </a>
                    </div>
                  </div>
                </div>
                <p className="text-base font-semibold mb-1" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
                  25€ par personne
                </p>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                  Places limitées — sur invitation uniquement
                </p>
                <GoldDivider className="mt-6" />
              </div>
            </FadeInSection>
          </section>
        )}

        {/* Ambiance Message */}
        <section className="py-16 px-6">
          <FadeInSection>
            <div className="max-w-xl mx-auto text-center">
              <GoldDivider className="mb-8" />
              <p
                className="text-lg md:text-xl leading-relaxed italic"
                style={{ color: TEXT_MED, fontFamily: "'Playfair Display', serif" }}
                data-testid="text-ambiance"
              >
                Nous nous réjouissons de partager ce moment avec vous.
                <br />
                Apportez votre bonne humeur, préparez vos plus beaux pas de danse.
              </p>
              <GoldDivider className="mt-8" />
            </div>
          </FadeInSection>
        </section>

        {/* Dress Code */}
        <section className="py-16 px-6">
          <FadeInSection>
            <div
              className="max-w-md mx-auto text-center rounded-md p-8"
              style={{ backgroundColor: `${CREAM_DARK}99`, border: `1px solid ${GOLD}20` }}
            >
              <h2
                className="text-2xl md:text-3xl mb-2 tracking-wide"
                style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
                data-testid="text-dresscode-title"
              >
                Dress Code
              </h2>
              <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: GOLD }}>
                Tenue exigée
              </p>
              <p className="text-base" style={{ color: TEXT_MED }}>
                Tenue : Gala (chic & classe)
              </p>
            </div>
          </FadeInSection>
        </section>

        {/* Cadeau / Cagnotte */}
        <section className="py-16 px-6">
          <FadeInSection>
            <div className="max-w-lg mx-auto text-center">
              <h2
                className="text-2xl md:text-3xl mb-2 tracking-wide"
                style={{ color: TEXT_DARK, fontFamily: "'Playfair Display', serif" }}
                data-testid="text-cadeau-title"
              >
                Cadeau de Mariage
              </h2>
              <p className="text-xs tracking-[0.3em] uppercase mb-8" style={{ color: GOLD }}>
                Notre cagnotte
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: TEXT_MED }}>
                Votre présence est notre plus beau cadeau.
                <br />
                Si vous souhaitez nous gâter, nous préférons une participation à notre cagnotte.
              </p>
              <Button
                asChild
                className="rounded-full text-sm font-semibold tracking-wider uppercase"
                style={{
                  backgroundColor: GOLD,
                  color: CREAM,
                  borderColor: GOLD,
                }}
                data-testid="link-cagnotte"
              >
                <a
                  href="https://ar2k26.com/cagnotte"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Participer
                </a>
              </Button>
              <p className="mt-4 text-xs" style={{ color: TEXT_LIGHT }}>
                ar2k26.com/cagnotte
              </p>
            </div>
          </FadeInSection>
        </section>

        {/* Notes */}
        <section className="py-12 px-6">
          <FadeInSection>
            <div className="max-w-md mx-auto text-center">
              <GoldDivider className="mb-6" />
              <p className="text-sm leading-relaxed" style={{ color: TEXT_LIGHT }} data-testid="text-notes">
                Pour des raisons d'organisation, nous vous remercions de ne pas inviter de personnes supplémentaires.
              </p>
              <p className="text-sm leading-relaxed mt-3" style={{ color: TEXT_LIGHT }}>
                Nous vous prions également de bien vouloir respecter l'heure indiquée afin que la cérémonie se déroule dans les meilleures conditions.
              </p>
              <GoldDivider className="mt-6" />
            </div>
          </FadeInSection>
        </section>

        {/* Couple Photo */}
        <section className="relative mt-8 px-4">
          <FadeInSection>
            <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-md">
              <img
                src={coupleImg}
                alt="Ruth & Arnold"
                className="w-full h-auto object-cover"
                data-testid="img-couple"
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-24"
                style={{
                  background: `linear-gradient(to top, ${CREAM} 0%, transparent 100%)`,
                  pointerEvents: "none",
                }}
              />
            </div>
          </FadeInSection>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 text-center">
          <FadeInSection>
            <GoldDivider className="mb-6" />
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: `${GOLD}80` }} data-testid="text-footer">
              &copy; 2026 Ruth & Arnold — Golden Love
            </p>
          </FadeInSection>
        </footer>
      </div>
    </div>
  );
}
