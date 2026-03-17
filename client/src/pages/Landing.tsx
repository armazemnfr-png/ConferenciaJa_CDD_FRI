import { Link } from "wouter";
import { Truck, ShieldCheck, ArrowRight, PlayCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary flex flex-col items-center justify-center p-4">
      
      <div className="max-w-md w-full glass-card rounded-3xl p-8 md:p-10 space-y-10 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Logo Area */}
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Truck className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-accent tracking-tight">
            Confere<span className="text-primary">Já</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Sistema inteligente de conferência de carga e rotas.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link 
            href="/driver/login" 
            className="w-full group flex items-center justify-between bg-accent text-accent-foreground px-6 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-primary" />
              Equipe de Entrega
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            href="/supervisor/matinal" 
            className="w-full group flex items-center justify-between bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <PlayCircle className="w-6 h-6" />
              MatinalPlay (Supervisor)
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            href="/admin/login" 
            className="w-full group flex items-center justify-between bg-card border-2 border-border text-foreground px-6 py-4 rounded-2xl font-bold text-lg hover:border-primary/50 hover:bg-muted/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Administrador
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-transform" />
          </Link>
        </div>
        
      </div>
      
      <p className="mt-8 text-sm text-muted-foreground font-medium">
        © 2024 Logística S.A. Todos os direitos reservados.
      </p>
    </div>
  );
}
