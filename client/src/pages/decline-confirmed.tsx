import { useLocation } from "wouter";
import logoRA from "@assets/logo-ra.png";

export default function DeclineConfirmed() {
  const [location] = useLocation();
  const params   = new URLSearchParams(window.location.search);
  const name     = params.get("name");
  const status   = params.get("status");
  const isError   = status === "error";
  const isAlready = status === "already";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(180deg, #FAF6F0 0%, #F0E8DA 100%)" }}
      data-testid="page-decline-confirmed"
    >
      <div className="max-w-md w-full text-center">
        <img src={logoRA} alt="Ruth & Arnold" className="h-16 w-auto mx-auto mb-8 opacity-80" />

        <div
          className="rounded-2xl p-10"
          style={{ background: "rgba(255,255,255,0.65)", border: "1px solid #E8DCC8" }}
        >
          <div className="text-5xl mb-6" style={{ color: "#C8A96A" }}>✦</div>

          {isError ? (
            <>
              <h1 className="text-2xl font-serif mb-4" style={{ color: "#2C2418", fontWeight: 400 }}>
                Lien invalide
              </h1>
              <p className="text-base" style={{ color: "#5C4F3D", lineHeight: 1.8 }}>
                Ce lien est invalide ou a expiré.<br />
                Veuillez contacter Ruth &amp; Arnold directement.
              </p>
            </>
          ) : isAlready ? (
            <>
              <h1 className="text-2xl font-serif mb-4" style={{ color: "#2C2418", fontWeight: 400 }}>
                Déjà enregistré{name ? `, ${name}` : ""}
              </h1>
              <p className="text-base mb-6" style={{ color: "#5C4F3D", lineHeight: 1.9 }}>
                Nous avions déjà bien reçu votre réponse.<br />
                Merci de nous avoir informés.
              </p>
              <div
                className="py-4 px-6 rounded-xl"
                style={{ background: "rgba(184,148,62,0.08)", border: "1px solid rgba(184,148,62,0.2)" }}
              >
                <p className="text-sm" style={{ color: "#8A7D6B", fontStyle: "italic" }}>
                  Avec tout notre amour,<br />
                  <span className="font-semibold not-italic" style={{ color: "#B8943E" }}>
                    Ruth &amp; Arnold
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-serif mb-4" style={{ color: "#2C2418", fontWeight: 400 }}>
                Message bien reçu{name ? `, ${name}` : ""}
              </h1>
              <p className="text-base mb-6" style={{ color: "#5C4F3D", lineHeight: 1.9 }}>
                Nous sommes désolés de ne pas pouvoir compter sur votre présence.<br />
                Votre réponse a bien été enregistrée.
              </p>
              <div
                className="py-4 px-6 rounded-xl"
                style={{ background: "rgba(184,148,62,0.08)", border: "1px solid rgba(184,148,62,0.2)" }}
              >
                <p className="text-sm" style={{ color: "#8A7D6B", fontStyle: "italic" }}>
                  Avec tout notre amour,<br />
                  <span className="font-semibold not-italic" style={{ color: "#B8943E" }}>
                    Ruth &amp; Arnold
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-xs mt-6" style={{ color: "#A89880" }}>
          Golden Love 2026
        </p>
      </div>
    </div>
  );
}
