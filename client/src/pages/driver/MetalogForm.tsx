import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquareHeart, ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const KPI_OPTIONS = [
  "TML",
  "Devolução PDV",
  "Aderência ao Raio",
  "Notificação > 2 min",
  "Tempo Interno",
  "Rating",
  "Jornada",
  "Caixa Viagem",
  "TME",
  "Outros",
];

export default function MetalogForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [kpi, setKpi] = useState("");
  const [kpiOther, setKpiOther] = useState("");
  const [reason, setReason] = useState("");
  const [solution, setSolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = name.trim() && kpi && (kpi !== "Outros" || kpiOther.trim()) && reason.trim() && solution.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/metalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          kpi,
          kpiOther: kpi === "Outros" ? kpiOther.trim() : null,
          reason: reason.trim(),
          solution: solution.trim(),
          status: "em_andamento",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Sem conexão", description: "Verifique sua internet.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border overflow-hidden text-center p-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Relato enviado!</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Obrigado por compartilhar. Sua contribuição é importante para melhorarmos juntos!
            </p>
          </div>
          <button
            onClick={() => setLocation("/driver/login")}
            data-testid="button-metalog-voltar"
            className="w-full py-4 bg-[#0056b3] text-white rounded-xl font-bold text-lg"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">

          {/* Cabeçalho */}
          <div className="bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] px-8 py-8 text-center text-white">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-white/30">
                <MessageSquareHeart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">METALOG</h2>
              <p className="opacity-90 mt-1 text-sm">Comente do seu resultado</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Pergunta 1 - Nome */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                data-testid="input-metalog-name"
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#7c3aed] focus:outline-none transition-all"
                required
              />
            </div>

            {/* Pergunta 2 - KPI em cards */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                Qual indicador (KPI) você não bate?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KPI_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setKpi(opt); if (opt !== "Outros") setKpiOther(""); }}
                    data-testid={`card-kpi-${opt}`}
                    className={`px-3 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all leading-tight ${
                      kpi === opt
                        ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed] shadow-sm"
                        : "border-border bg-background text-foreground hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5"
                    }`}
                  >
                    {opt === "TME" ? "TME\n(Tempo médio entrega)" : opt}
                  </button>
                ))}
              </div>
              {kpi === "Outros" && (
                <input
                  type="text"
                  value={kpiOther}
                  onChange={e => setKpiOther(e.target.value)}
                  placeholder="Qual indicador?"
                  data-testid="input-metalog-kpi-other"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#7c3aed]/50 focus:border-[#7c3aed] focus:outline-none transition-all"
                />
              )}
            </div>

            {/* Pergunta 3 - Por quê */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                Por que você acha que não bate?
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Escreva aqui sua visão..."
                data-testid="textarea-metalog-reason"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#7c3aed] focus:outline-none transition-all resize-none"
                required
              />
            </div>

            {/* Pergunta 4 - Como resolve */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                Como você acha que resolve isso?
              </label>
              <textarea
                value={solution}
                onChange={e => setSolution(e.target.value)}
                placeholder="Sua sugestão de melhoria..."
                data-testid="textarea-metalog-solution"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#7c3aed] focus:outline-none transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isValid}
              data-testid="button-metalog-submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Relato
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLocation("/driver/login")}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
