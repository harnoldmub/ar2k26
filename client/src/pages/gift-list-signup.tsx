import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Gift, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoRA from "@assets/logo-ra.png";

export default function GiftListSignup() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/gift-list", { name });
    },
    onSuccess: () => {
      setSubmittedName(name.trim());
      setSubmitted(true);
      setName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate(name.trim());
  };

  const GOLD = "#B8943E";
  const CREAM = "#FAF6F0";
  const DARK = "#2C2418";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: CREAM, fontFamily: "'Lato', sans-serif" }}
    >
      <div className="w-full max-w-sm text-center">
        <img
          src={logoRA}
          alt="Ruth & Arnold"
          className="h-16 w-auto mx-auto mb-8 opacity-80"
          data-testid="img-logo"
        />

        <div className="mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}40` }}
          >
            <Gift className="w-6 h-6" style={{ color: GOLD }} />
          </div>
          <h1
            className="text-3xl mb-2"
            style={{ color: DARK, fontFamily: "'Playfair Display', serif" }}
          >
            Liste de cadeaux
          </h1>
          <p className="text-sm" style={{ color: `${DARK}99` }}>
            Inscrivez-vous pour participer à la liste de cadeaux
          </p>
        </div>

        {submitted ? (
          <div
            className="p-6 text-center"
            style={{ border: `1px solid ${GOLD}40`, borderRadius: "4px", backgroundColor: `${GOLD}08` }}
            data-testid="success-message"
          >
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ backgroundColor: `${GOLD}20` }}
            >
              <Check className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <p
              className="text-lg font-medium mb-1"
              style={{ color: DARK, fontFamily: "'Playfair Display', serif" }}
            >
              Merci {submittedName} !
            </p>
            <p className="text-sm" style={{ color: `${DARK}80` }}>
              Votre inscription a bien été enregistrée.
            </p>
            <Button
              variant="ghost"
              className="mt-4 text-sm"
              style={{ color: GOLD }}
              onClick={() => setSubmitted(false)}
              data-testid="button-add-another"
            >
              Inscrire une autre personne
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre prénom et nom"
                autoFocus
                disabled={mutation.isPending}
                style={{
                  borderColor: `${GOLD}50`,
                  backgroundColor: "white",
                  color: DARK,
                  textAlign: "center",
                  fontSize: "1rem",
                }}
                data-testid="input-name"
              />
            </div>
            <Button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="w-full"
              style={{
                backgroundColor: GOLD,
                color: "white",
                border: "none",
              }}
              data-testid="button-submit"
            >
              {mutation.isPending ? "Inscription en cours…" : "S'inscrire"}
            </Button>
            {mutation.isError && (
              <p className="text-sm text-red-500 text-center" data-testid="error-message">
                Une erreur s'est produite, veuillez réessayer.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
