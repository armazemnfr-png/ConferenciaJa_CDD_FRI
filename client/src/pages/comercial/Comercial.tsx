import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

export default function Comercial() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl leading-none" role="img" aria-label="Hang loose">🤙</span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Comercial</h1>
          </div>
          <p className="text-muted-foreground">
            Acesse os formulários e ferramentas do módulo Comercial.
          </p>
        </header>

        <Link
          href="/comercial/cliente-preferencias"
          className="group flex items-center justify-between bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm hover:border-[#0f766e]/50 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0f766e]/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-[#0f766e]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Cliente - Preferências</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Formulário para registrar as preferências dos clientes.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-[#0f766e] transition-all shrink-0" />
        </Link>
      </div>
    </div>
  );
}