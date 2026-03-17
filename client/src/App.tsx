import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminAuth } from "@/hooks/use-admin-auth";

// --- Importações das Páginas ---

// Geral
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

// Roteiro do Motorista (Conferência)
import DriverLogin from "@/pages/driver/DriverLogin";
import ConferenceBays from "@/pages/driver/ConferenceBays";
import BayItemsView from "@/pages/driver/BayItemsView";

// Roteiro do Admin (Gestão)
import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import UploadWms from "@/pages/admin/UploadWms";
import AdminMatinals from "@/pages/admin/AdminMatinals";
import AdminConferences from "@/pages/admin/AdminConferences";

// Roteiro do Supervisor
import MatinalPlay from "@/pages/supervisor/MatinalPlay";

// Guarda de rota: redireciona para login se não estiver autenticado como admin
function AdminRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return <Component />;
}

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

      {/* Login do Administrador (página pública) */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Fluxo do Administrador (protegido) */}
      <Route path="/admin">{() => <AdminRoute component={Dashboard} />}</Route>
      <Route path="/admin/upload">{() => <AdminRoute component={UploadWms} />}</Route>
      <Route path="/admin/matinals">{() => <AdminRoute component={AdminMatinals} />}</Route>
      <Route path="/admin/conferences">{() => <AdminRoute component={AdminConferences} />}</Route>

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