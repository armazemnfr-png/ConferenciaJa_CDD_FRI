import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart2, ArrowLeft, Search, Loader2, AlertCircle } from "lucide-react";

export default function DriverKpi() {
  const [, setLocation] = useLocation();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfClean = cpf.replace(/\D/g, "").trim();
    if (!cpfClean) return;

    setLoading(true);
    setError(null);
    setMensagem(null);

    try {
      const res = await fetch(`/api/kpi/${cpfClean}`);
      if (res.ok) {
        const data = await res.json();
        setMensagem(data.mensagem);
      } else if (res.status === 404) {
        setError("Nenhum resultado encontrado para este CPF. Verifique se digitou corretamente.");
      } else {
        setError("Erro ao buscar resultado. Tente novamente.");
      }
    } catch {
      setError("Sem conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card Principal */}
        <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">

          {/* Cabeçalho */}
          <div className="bg-[#0056b3] px-8 py-10 text-center text-white">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#ffc107] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-4">
                <BarChart2 className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold">Meus Resultados KPIs</h2>
              <p className="opacity-90 mt-1 text-sm">Digite seu CPF para ver seu resultado</p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSearch} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Seu CPF (somente números)</label>
              <input
                type="tel"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => { setCpf(e.target.value); setError(null); setMensagem(null); }}
                placeholder="Ex: 12345678901"
                maxLength={14}
                data-testid="input-cpf"
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#0056b3] focus:outline-none transition-all text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !cpf.replace(/\D/g, "").trim()}
              data-testid="button-buscar-kpi"
              className="w-full flex items-center justify-center gap-2 bg-[#ffc107] hover:bg-[#e0a800] text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Ver Resultado
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/driver/login")}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
            </div>
          </form>
        </div>

        {/* Erro */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {mensagem && (
          <div
            data-testid="card-kpi-resultado"
            className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-md p-5 animate-in fade-in slide-in-from-bottom-2"
          >
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">{mensagem}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
