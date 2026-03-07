import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Importações das Páginas
import Landing from "@/pages/Landing";
import DriverLogin from "@/pages/driver/DriverLogin";
import ConferenceBays from "@/pages/driver/ConferenceBays";
import BayItemsView from "@/pages/driver/BayItemsView";
import Dashboard from "@/pages/admin/Dashboard";
import UploadWms from "@/pages/admin/UploadWms";
import AdminMatinals from "@/pages/admin/AdminMatinals"; 
import MatinalPlay from "@/pages/supervisor/MatinalPlay";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      {/* Roteiro do Motorista */}
      <Route path="/driver/login" component={DriverLogin} />
      <Route path="/driver/bays/:mapNumber" component={ConferenceBays} />
      <Route path="/driver/conference/:mapNumber/:bayNumber" component={BayItemsView} />

      {/* Roteiro do Supervisor */}
      <Route path="/supervisor/matinal" component={MatinalPlay} />

      {/* Roteiro do Admin */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/upload" component={UploadWms} />
      <Route path="/admin/matinals" component={AdminMatinals} />
      

      {/* 404 - Sempre por último */}
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