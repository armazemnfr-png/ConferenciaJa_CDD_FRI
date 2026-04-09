import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// --- Importações das Páginas ---

// Geral
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

// Roteiro do Motorista (Conferência)
import DriverLogin from "@/pages/driver/DriverLogin";
import ConferenceBays from "@/pages/driver/ConferenceBays";
import BayItemsView from "@/pages/driver/BayItemsView";

// Roteiro do Admin (Gestão)
import Dashboard from "@/pages/admin/Dashboard";
import UploadWms from "@/pages/admin/UploadWms";
import AdminMatinals from "@/pages/admin/AdminMatinals";
import AdminConferences from "@/pages/admin/AdminConferences";
import AdminAdherencia from "@/pages/admin/AdminAdherencia";
import AdminGinfo from "@/pages/admin/AdminGinfo";

// Roteiro do Supervisor
import MatinalPlay from "@/pages/supervisor/MatinalPlay";

function Router() {
  return (
    <Switch>
      {/* Home / Landing */}
      <Route path="/" component={Landing} />

      {/* Fluxo do Motorista */}
      <Route path="/driver/login" component={DriverLogin} />
      <Route path="/driver/bays/:mapNumber" component={ConferenceBays} />
      <Route path="/driver/conference/:mapNumber/:bayNumber" component={BayItemsView} />

      {/* Fluxo do Supervisor */}
      <Route path="/supervisor/matinal" component={MatinalPlay} />

      {/* Fluxo do Administrador */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/upload" component={UploadWms} />
      <Route path="/admin/matinals" component={AdminMatinals} />
      <Route path="/admin/conferences" component={AdminConferences} />
      <Route path="/admin/adherencia" component={AdminAdherencia} />
      <Route path="/admin/ginfo" component={AdminGinfo} />

      {/* Rota 404 - Caso o usuário digite algo inexistente */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}