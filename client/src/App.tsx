import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/admin">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : isAuthenticated ? (
          <Admin />
        ) : (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
                Accès administrateur
              </h1>
              <p className="text-muted-foreground font-sans mb-8">
                Vous devez être connecté pour accéder à cet espace.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/login";
                }}
                data-testid="button-admin-login"
              >
                Se connecter
              </Button>
            </div>
          </div>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
