import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Download } from "lucide-react";

export default function ClientePreferencias() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/comercial"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Comercial
        </Link>

        <header className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0f766e]/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-[#0f766e]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f766e] mb-1">Comercial</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Cliente - Preferências</h1>
            <p className="text-muted-foreground mt-2">
              Formulário de preferências para atualização da base de clientes.
            </p>
          </div>
        </header>

        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col items-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-[#0f766e]/10 flex items-center justify-center mb-5">
              <ClipboardList className="w-8 h-8 text-[#0f766e]" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Formulário em preparação</h2>
            <p className="max-w-xl text-sm text-muted-foreground mt-3 leading-relaxed">
              A estrutura do formulário está pronta. Assim que você enviar a base com as perguntas e opções,
              vamos montar o preenchimento e a exportação para download.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-60 cursor-not-allowed"
              title="Disponível após a configuração das perguntas"
            >
              <Download className="w-4 h-4" />
              Baixar formulário (em breve)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}