import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Link } from "wouter";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { login, loginPending, isAuthenticated, isLoading } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Já autenticado → redireciona direto para o painel
  if (!isLoading && isAuthenticated) {
    navigate("/admin");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login({ username, password });
      navigate("/admin");
    } catch (err: any) {
      const msg =
        err?.message || "Usuário ou senha incorretos. Tente novamente.";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full glass-card rounded-3xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/25">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-accent">Área do Administrador</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesso restrito. Insira suas credenciais.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="username">
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="username"
                data-testid="input-admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="Usuário"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                data-testid="input-admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="Senha"
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              data-testid="text-login-error"
              className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            data-testid="button-admin-login"
            disabled={loginPending}
            className="w-full bg-accent text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loginPending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            data-testid="link-back-home"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar à tela inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
