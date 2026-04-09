import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Upload, LogOut, Truck, Play, ArrowLeft, Home, BarChart2, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
}

const SESSION_KEY = "confere_admin_ok";

function isUnlocked() {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}
function setUnlocked() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* noop */ }
}
function clearUnlocked() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

function AdminPasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setUnlocked();
        onSuccess();
        return;
      }
      // Senha errada
      setError("Senha incorreta. Tente novamente.");
      setPassword("");
    } catch {
      setError("Servidor indisponível. Aguarde alguns segundos e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">ConfereJá</h1>
          <p className="text-slate-400 text-sm mt-1">Painel Administrativo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Acesso restrito</h2>
              <p className="text-xs text-slate-400">Informe a senha de administrador</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                autoFocus
                data-testid="input-admin-password"
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="text-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              data-testid="button-admin-login"
              className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar no Painel"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Apenas administradores autorizados têm acesso.
        </p>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [unlocked, setUnlocked_] = useState(isUnlocked);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Upload Dados", href: "/admin/upload", icon: Upload },
    { name: "Conferências", href: "/admin/conferences", icon: Truck },
    { name: "MatinalPlay (Histórico)", href: "/admin/matinals", icon: Play },
    { name: "Aderência de Mapas", href: "/admin/adherencia", icon: BarChart2 },
  ];

  const isRoot = location === "/admin";
  const backHref = isRoot ? "/" : "/admin";

  function handleBack() {
    window.history.back();
  }

  function handleLogout() {
    clearUnlocked();
    setUnlocked_(false);
    logout();
  }

  if (!unlocked) {
    return <AdminPasswordGate onSuccess={() => setUnlocked_(true)} />;
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
            onClick={handleLogout}
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
          <button
            onClick={handleBack}
            data-testid="button-back"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar</span>
          </button>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2 text-accent font-bold text-base font-display md:hidden">
            <Truck className="h-5 w-5 text-primary" />
            <span>ConfereJá</span>
          </div>

          <p className="hidden md:block text-sm text-muted-foreground">
            {navigation.find(n => n.href === location)?.name ?? "Administrador"}
          </p>

          <div className="flex-1" />

          <button
            onClick={handleLogout}
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
