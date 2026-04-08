import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Upload, LogOut, Truck, Play, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Upload Dados (WMS)", href: "/admin/upload", icon: Upload },
    { name: "Conferências", href: "/admin/conferences", icon: Truck },
    { name: "MatinalPlay (Histórico)", href: "/admin/matinals", icon: Play },
  ];

  // Determina destino e label do botão voltar
  const isRoot = location === "/admin";
  const backHref = isRoot ? "/" : "/admin";
  const backLabel = isRoot ? "Início" : "Painel Admin";

  function handleBack() {
    window.history.back();
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar — desktop */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-accent font-bold text-xl font-display">
            <Truck className="h-6 w-6 text-primary" />
            <span>ConfereJá</span>
          </div>
        </div>

        {/* Botão Voltar — sidebar */}
        <div className="px-4 pt-4">
          <Link
            href={backHref}
            data-testid="link-admin-back"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group w-full"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            {isRoot ? (
              <>
                <Home className="h-4 w-4" />
                Voltar ao Início
              </>
            ) : (
              "Voltar ao Painel"
            )}
          </Link>
        </div>

        <div className="flex-1 py-3 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? "bg-primary/10 text-accent font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
              {user?.firstName?.charAt(0) || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header — mobile e desktop */}
        <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4">
          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            data-testid="button-back"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar</span>
          </button>

          {/* Divisor */}
          <div className="h-5 w-px bg-border" />

          {/* Logo — visível em mobile */}
          <div className="flex items-center gap-2 text-accent font-bold text-base font-display md:hidden">
            <Truck className="h-5 w-5 text-primary" />
            <span>ConfereJá</span>
          </div>

          {/* Título da página atual — visível em desktop */}
          <p className="hidden md:block text-sm text-muted-foreground">
            {navigation.find(n => n.href === location)?.name ?? "Administrador"}
          </p>

          <div className="flex-1" />

          {/* Logout — mobile */}
          <button
            onClick={() => logout()}
            className="md:hidden p-2 text-muted-foreground hover:text-destructive transition-colors"
            data-testid="button-logout-mobile"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
