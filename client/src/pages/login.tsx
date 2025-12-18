import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import logoRA from "@assets/logo-ra.png";

const loginSchema = z.object({
  username: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Invalidate auth query to trigger re-fetch and redirect
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        toast({
          title: "Connexion réussie",
          description: "Redirection vers le dashboard...",
        });
        setTimeout(() => {
          setLocation("/admin");
        }, 500);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur de connexion",
          description: error.message || "Identifiants incorrects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src={logoRA}
              alt="R&A Logo"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-serif font-light text-foreground mb-2">
            Administration
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Golden Love 2026
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-sans">Identifiant</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Votre identifiant"
                      className="border-2 focus:border-primary transition-colors"
                      data-testid="input-username"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-sans">Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Votre mot de passe"
                      className="border-2 focus:border-primary transition-colors"
                      data-testid="input-password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full text-base font-sans"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans"
            data-testid="link-back-home"
          >
            ← Retour au site
          </button>
        </div>
      </Card>
    </div>
  );
}
