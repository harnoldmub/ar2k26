import { useParams, useSearch } from "wouter";
import logoRA from "@/assets/logo-ra.png";
import headerImg from "@/assets/header.png";

const GOLD        = "#B8943E";
const GOLD_LIGHT  = "#D4A847";
const GOLD_SOFT   = "#C8A96A";
const CREAM       = "#FFFFFF";
const CREAM_DARK  = "#FAF6F0";
const TEXT_DARK   = "#2C2418";
const TEXT_MED    = "#5C4F3D";
const TEXT_LIGHT  = "#8A7D6B";
const DARK_BG     = "#2C2418";
const DARK_BG2    = "#4A3728";

const MARCH_DAYS   = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MARCH_OFFSET = 6;
const MARCH_TOTAL  = 31;

function MiniCalendar() {
  const cells: (number | null)[] = [];
  for (let i = 0; i < MARCH_OFFSET; i++) cells.push(null);
  for (let d = 1; d <= MARCH_TOTAL; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="grid grid-cols-7 mb-1" style={{ gap: "2px" }}>
        {MARCH_DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase"
            style={{ color: TEXT_LIGHT, letterSpacing: "0.05em" }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ gap: "2px" }}>
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: "26px" }}>
            {day !== null && (
              day === 19 ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}
                >
                  {day}
                </div>
              ) : (
                <span
                  className="text-[11px]"
                  style={{ color: TEXT_LIGHT }}
                >
                  {day}
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TornEdgeTop() {
  return (
    <svg
      viewBox="0 0 420 40"
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height: "40px", display: "block", marginBottom: "-1px" }}
    >
      <path
        d="M0,40 
           L0,18 
           C20,22 30,10 50,15 
           C70,20 80,8 100,13 
           C120,18 130,6 150,11 
           C170,16 180,4 200,9 
           C220,14 230,2 250,7 
           C270,12 280,0 300,5 
           C320,10 330,22 350,14 
           C370,6 385,20 400,16 
           C410,13 415,18 420,15 
           L420,40 Z"
        fill={CREAM}
      />
    </svg>
  );
}

export default function InvitationDot19() {
  const params  = useParams<{ name?: string }>();
  const search  = useSearch();
  const searchParams = new URLSearchParams(search);

  const rawName     = params.name ? decodeURIComponent(params.name) : searchParams.get("nom") || "";
  const displayName = rawName || "Cher(e) invité(e)";

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{
        background: `linear-gradient(160deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)`,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <div className="w-full relative" style={{ maxWidth: "420px", minHeight: "100vh" }}>

        {/* ── HEADER IMAGE + TORN EDGE ── */}
        <div className="w-full relative" style={{ height: "200px" }}>
          <img
            src={headerImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-0 left-0 right-0">
            <TornEdgeTop />
          </div>
        </div>

        {/* ── PAPER BODY ── */}
        <div style={{ backgroundColor: CREAM, padding: "0 32px 0" }}>

          {/* Logo */}
          <div className="flex flex-col items-center pt-8 pb-4">
            <img
              src={logoRA}
              alt="Ruth & Arnold"
              style={{ width: "80px", height: "80px", objectFit: "contain" }}
            />
          </div>

          {/* Civility */}
          <p
            className="text-center text-xs tracking-widest uppercase"
            style={{ color: TEXT_LIGHT, letterSpacing: "0.15em", fontFamily: "'Inter', sans-serif" }}
          >
            Mme, Mlle, M., Couple
          </p>

          {/* Recipient name */}
          <p
            className="text-center font-bold mt-2 mb-5 leading-tight"
            style={{
              color: TEXT_DARK,
              fontSize: "15px",
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: "0.02em",
            }}
          >
            {displayName}
          </p>

          {/* Divider */}
          <div
            className="mx-auto mb-5"
            style={{
              width: "60px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${GOLD_SOFT}, transparent)`,
            }}
          />

          {/* Names */}
          <h1
            className="text-center mb-5"
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: "46px",
              color: TEXT_DARK,
              lineHeight: 1.1,
            }}
          >
            Ruth &amp; Arnold
          </h1>

          {/* Invitation text */}
          <p
            className="text-center text-sm leading-relaxed mb-6"
            style={{ color: TEXT_MED, fontFamily: "'Inter', sans-serif", fontSize: "13px" }}
          >
            ont le réel plaisir de vous convier à la
            <br />
            célébration de leur mariage coutumier
            <br />
            qui aura lieu le <strong style={{ color: TEXT_DARK }}>19 mars 2026</strong>.
          </p>

          {/* ── GOLD BANNER — Save the date ── */}
          <div
            className="mx-auto mb-5 py-3 px-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
              borderRadius: "2px",
              maxWidth: "280px",
            }}
          >
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: "30px",
                color: CREAM,
                lineHeight: 1,
              }}
            >
              Save
            </p>
            <p
              className="text-xs uppercase tracking-[0.3em] font-semibold"
              style={{ color: CREAM, fontFamily: "'Inter', sans-serif", marginTop: "2px", opacity: 0.9 }}
            >
              the date
            </p>
          </div>

          {/* Calendar */}
          <div
            className="mx-auto mb-6 rounded-md p-3"
            style={{
              maxWidth: "280px",
              border: `1px solid ${GOLD}30`,
              backgroundColor: CREAM_DARK,
            }}
          >
            <p
              className="text-center text-xs uppercase tracking-widest mb-3 font-semibold"
              style={{ color: TEXT_DARK, fontFamily: "'Inter', sans-serif" }}
            >
              Mars 2026
            </p>
            <MiniCalendar />
          </div>

          {/* ── VENUE BLOCK ── */}
          <div
            className="rounded-md mb-5 overflow-hidden"
            style={{ border: `1px solid ${GOLD}30` }}
          >
            <div
              className="px-4 py-3 flex items-start gap-3"
              style={{ backgroundColor: CREAM_DARK }}
            >
              <svg width="32" height="36" viewBox="0 0 32 36" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M4 34 L4 18 Q4 6 16 6 Q28 6 28 18 L28 34" stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M2 34 L30 34" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 34 L10 22" stroke={GOLD} strokeWidth="1" strokeLinecap="round"/>
                <path d="M22 34 L22 22" stroke={GOLD} strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <div>
                <p
                  className="text-xs uppercase tracking-widest font-semibold mb-0.5"
                  style={{ color: GOLD, fontFamily: "'Inter', sans-serif" }}
                >
                  Soirée dansante
                </p>
                <p
                  className="font-bold"
                  style={{ color: TEXT_DARK, fontSize: "17px", fontFamily: "'Playfair Display', serif" }}
                >
                  Yeni Yasam
                </p>
                <p
                  className="text-xs leading-relaxed mt-0.5"
                  style={{ color: TEXT_LIGHT, fontFamily: "'Inter', sans-serif" }}
                >
                  Dobbelenbergstraat 107, 1130 Brussel,
                  <br />Belgique
                </p>
              </div>
            </div>

            <div className="px-4 py-3 flex justify-center" style={{ backgroundColor: CREAM }}>
              <a
                href="https://maps.google.com/?q=Yeni+Yasam+Dobbelenbergstraat+107+1130+Bruxelles+Belgique"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center text-xs font-semibold uppercase tracking-wider text-white px-6 py-2.5"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                  borderRadius: "2px",
                }}
              >
                Cliquer ici pour voir le lieu
              </a>
            </div>
          </div>

          {/* ── TIME BLOCK ── */}
          <div className="flex items-center justify-center gap-5 mb-7">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="20" stroke={GOLD} strokeWidth="1.5"/>
              <path d="M22 10 L22 22 L30 22" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: "38px",
                color: TEXT_DARK,
                lineHeight: 1,
              }}
            >
              19H00
            </span>
          </div>

          {/* Divider */}
          <div
            className="mx-auto mb-6"
            style={{
              width: "60px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${GOLD_SOFT}, transparent)`,
            }}
          />

          {/* Closing */}
          <p
            className="text-center italic mb-0"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "16px",
              color: TEXT_MED,
              letterSpacing: "0.02em",
            }}
          >
            Cordiale bienvenue&nbsp;!
          </p>
        </div>

        {/* ── DARK FOOTER BAND ── */}
        <div
          className="w-full flex flex-col items-center justify-center py-8 gap-4"
          style={{ background: `linear-gradient(135deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)` }}
        >
          <div
            style={{
              width: "60px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${GOLD_SOFT}, transparent)`,
            }}
          />
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: "64px",
              height: "64px",
              border: `1.5px solid ${GOLD_SOFT}60`,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <img
              src={logoRA}
              alt="R&A"
              style={{ width: "44px", height: "44px", objectFit: "contain", opacity: 0.9 }}
            />
          </div>
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "10px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: GOLD_SOFT,
              opacity: 0.7,
            }}
          >
            Golden Love 2026
          </p>
        </div>

      </div>
    </div>
  );
}
