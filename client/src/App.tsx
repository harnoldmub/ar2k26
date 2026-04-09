import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Invitation from "@/pages/invitation";
import CheckIn from "@/pages/checkin";
import CagnottePage from "@/pages/cagnotte";
import ContributionMerci from "@/pages/contribution-merci";
import LiveContributions from "@/pages/live-contributions";
import GuestInvitation from "@/pages/dot-invitation";
import InvitationGala from "@/pages/invitation-gala";
import InvitationDot19 from "@/pages/invitation-dot19";
import DeclineConfirmed from "@/pages/decline-confirmed";
import RsvpConfirmed from "@/pages/rsvp-confirmed";
import RsvpConfirmChoice from "@/pages/rsvp-confirm-choice";
import GiftListSignup from "@/pages/gift-list-signup";
import GiftListMC from "@/pages/gift-list-mc";
import Programme from "@/pages/programme";
import Accueil from "@/pages/accueil";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Auto-redirect to login if trying to access /admin without auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location === "/admin") {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/checkin" component={CheckIn} />
      <Route path="/invitation/:id" component={Invitation} />
      <Route path="/cagnotte" component={CagnottePage} />
      <Route path="/cagnotte/live" component={LiveContributions} />
      <Route path="/contribution/merci" component={ContributionMerci} />
      <Route path="/guest/:guestId" component={GuestInvitation} />
      <Route path="/gala/:name?" component={InvitationGala} />
      <Route path="/dot19/:name?" component={InvitationDot19} />
      <Route path="/decline-confirmed" component={DeclineConfirmed} />
      <Route path="/rsvp-confirmed" component={RsvpConfirmed} />
      <Route path="/rsvp-confirm-choice" component={RsvpConfirmChoice} />
      <Route path="/liste-cadeaux" component={GiftListSignup} />
      <Route path="/liste-cadeaux/mc" component={GiftListMC} />
      <Route path="/programme" component={Programme} />
      <Route path="/accueil" component={Accueil} />
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
        ) : null}
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
