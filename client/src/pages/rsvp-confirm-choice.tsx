import logoRA from "@assets/logo-ra.png";

export default function RsvpConfirmChoice() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token") || "";
  const name   = params.get("name")  || "cher(e) invité(e)";

  const base = `/api/rsvp/confirm-choice/${encodeURIComponent(token)}`;

  const options = [
    {
      choice: "both",
      label: "Les deux dates",
      sub: "19 mars (mariage coutumier) + 21 mars (cérémonie & soirée)",
      icon: "✦✦",
    },
    {
      choice: "19-march",
      label: "Seulement le 19 mars",
      sub: "Mariage coutumier — Yeni Yasam, 19h00",
      icon: "✦",
    },
    {
      choice: "21-march",
      label: "Seulement le 21 mars",
      sub: "Cérémonie & grande soirée",
      icon: "✦",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(180deg, #FAF6F0 0%, #F0E8DA 100%)" }}
      data-testid="page-rsvp-confirm-choice"
    >
      <div className="max-w-md w-full text-center">
        <img src={logoRA} alt="Ruth & Arnold" className="h-14 w-auto mx-auto mb-7 opacity-80" />

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.70)", border: "1px solid #E8DCC8" }}
        >
          {/* Header */}
          <div
            className="mb-6 py-3 px-5 rounded-lg"
            style={{ background: "linear-gradient(135deg, #B8943E, #D4A847)" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: "rgba(255,255,255,0.85)", letterSpacing: "0.15em" }}
            >
              Golden Love 2026
            </p>
          </div>

          <h1
            className="text-2xl font-serif mb-2"
            style={{ color: "#2C2418", fontWeight: 400 }}
          >
            Merci, {name} !
          </h1>
          <p className="text-sm mb-7" style={{ color: "#8A7D6B", lineHeight: 1.8 }}>
            Vous étiez invité(e) aux deux célébrations.<br />
            Pouvez-vous préciser à laquelle vous serez présent(e) ?
          </p>

          {/* Divider */}
          <div
            className="mx-auto mb-7"
            style={{
              width: "60px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #C8A96A, transparent)",
            }}
          />

          {/* Options */}
          <div className="flex flex-col gap-3">
            {options.map((opt) => (
              <a
                key={opt.choice}
                href={`${base}?choice=${opt.choice}`}
                data-testid={`button-choice-${opt.choice}`}
                className="block text-left rounded-lg px-5 py-4 transition-all"
                style={{
                  border: "1px solid rgba(184,148,62,0.25)",
                  background: "rgba(250,246,240,0.8)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(184,148,62,0.08)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(184,148,62,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(250,246,240,0.8)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(184,148,62,0.25)";
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-xs mt-0.5 flex-shrink-0"
                    style={{ color: "#B8943E" }}
                  >
                    {opt.icon}
                  </span>
                  <div>
                    <p
                      className="font-semibold text-sm mb-0.5"
                      style={{ color: "#2C2418", fontFamily: "'Playfair Display', serif" }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs" style={{ color: "#8A7D6B", lineHeight: 1.6 }}>
                      {opt.sub}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Footer note */}
          <p
            className="text-xs mt-7"
            style={{ color: "#A89880", fontStyle: "italic", lineHeight: 1.7 }}
          >
            Votre choix sera enregistré immédiatement.<br />
            Avec tout notre amour,{" "}
            <span style={{ color: "#B8943E", fontStyle: "normal", fontWeight: 600 }}>
              Ruth &amp; Arnold
            </span>
          </p>
        </div>

        <p className="text-xs mt-5" style={{ color: "#A89880" }}>
          Golden Love 2026
        </p>
      </div>
    </div>
  );
}
