import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
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
      
      {/* Driver Routes */}
      <Route path="/driver/login" component={DriverLogin} />
      <Route path="/driver/conference/:mapNumber" component={BayItemsView} />
      
      {/* Supervisor Routes */}
      <Route path="/supervisor/matinal" component={MatinalPlay} />

      {/* Admin Routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/upload" component={UploadWms} />
      <Route path="/admin/matinals" component={AdminMatinals} />
      <Route path="/admin/conferences" component={() => (
        <div className="p-8"><h1 className="text-2xl font-bold">Conferências (Em breve)</h1></div>
      )} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
