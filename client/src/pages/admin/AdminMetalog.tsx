import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MessageSquareHeart, TrendingUp, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, AlertTriangle, PenLine } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { MetalogEntry } from "@shared/schema";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  concluida: { label: "Concluída/Eficaz", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  nao_avancou: { label: "Não Avançou", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const BAR_COLORS = ["#7c3aed", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff", "#faf5ff"];

function StatCard({ label, value, total, color, icon: Icon }: { label: string; value: number; total: number; color: string; icon: any }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`bg-card rounded-2xl p-5 border shadow-sm flex flex-col gap-2 ${color}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{pct}% do total</p>
    </div>
  );
}

function EntryCard({ entry }: { entry: MetalogEntry }) {
  const [status, setStatus] = useState(entry.status);
  const [justification, setJustification] = useState(entry.blockerJustification ?? "");
  const [actionTaken, setActionTaken] = useState(entry.actionTaken ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const needsJustification = status === "nao_avancou";

  const hasChanges =
    status !== entry.status ||
    actionTaken.trim() !== (entry.actionTaken ?? "") ||
    (needsJustification && justification.trim() !== (entry.blockerJustification ?? ""));

  async function handleSave() {
    if (needsJustification && !justification.trim()) {
      toast({ title: "Justificativa obrigatória", description: "Preencha a justificativa para 'Não Avançou'.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/metalog/${entry.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          blockerJustification: needsJustification ? justification.trim() : null,
          actionTaken: actionTaken.trim() || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Salvo com sucesso!" });
        queryClient.invalidateQueries({ queryKey: ["/api/metalog"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metalog/stats"] });
      } else {
        const err = await res.json();
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const kpiLabel = entry.kpi === "Outros" && entry.kpiOther ? `Outros: ${entry.kpiOther}` : entry.kpi;
  const statusInfo = STATUS_LABELS[entry.status] ?? STATUS_LABELS.em_andamento;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Cabeçalho do card */}
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-foreground">{entry.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.createdAt ? format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusInfo.color}`}>
            <statusInfo.icon className="w-3 h-3" />
            {statusInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 px-2.5 py-1 rounded-full text-xs font-bold">
            {kpiLabel}
          </span>
        </div>

        {/* Relato do motorista - sempre visível resumido, expande para ver completo */}
        <div className="bg-muted/40 rounded-xl p-3 mb-3 space-y-2">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Sugestão do motorista</p>
            <p className="text-sm text-foreground line-clamp-2">{entry.solution}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Ocultar relato completo" : "Ver relato completo"}
        </button>

        {expanded && (
          <div className="mt-2 space-y-3 border-t border-border pt-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Por que não bate?</p>
              <p className="text-sm text-foreground bg-muted/40 rounded-xl p-3">{entry.reason}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Como resolve?</p>
              <p className="text-sm text-foreground bg-muted/40 rounded-xl p-3">{entry.solution}</p>
            </div>
            {entry.blockerJustification && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Justificativa do Bloqueio
                </p>
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{entry.blockerJustification}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Área da gestão */}
      <div className="bg-muted/30 border-t border-border px-4 py-3 space-y-3">

        {/* Campo: O que foi feito */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5 text-[#7c3aed]" />
            O que foi feito com esta ação?
          </p>
          <textarea
            value={actionTaken}
            onChange={e => setActionTaken(e.target.value)}
            placeholder="Descreva aqui o que a gestão fez a partir desta sugestão..."
            data-testid={`textarea-metalog-action-${entry.id}`}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#7c3aed]/30 focus:border-[#7c3aed] focus:outline-none resize-none bg-white placeholder:text-muted-foreground/50 transition-all"
          />
        </div>

        {/* Status da aderência */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Aderência da Ação</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                data-testid={`button-metalog-status-${key}-${entry.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  status === key
                    ? val.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {needsJustification && (
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Justificativa do bloqueio (obrigatório)..."
            data-testid={`textarea-metalog-justification-${entry.id}`}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-red-300 focus:border-red-500 focus:outline-none resize-none bg-red-50 text-red-900 placeholder:text-red-400"
          />
        )}

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving || (needsJustification && !justification.trim())}
            data-testid={`button-metalog-save-${entry.id}`}
            className="w-full py-2 bg-[#7c3aed] text-white text-sm font-bold rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-all"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminMetalog() {
  const { data: entries = [], isLoading } = useQuery<MetalogEntry[]>({ queryKey: ["/api/metalog"] });
  const { data: stats } = useQuery<{
    kpiRanking: { kpi: string; count: number }[];
    statusCounts: { em_andamento: number; concluida: number; nao_avancou: number };
  }>({ queryKey: ["/api/metalog/stats"] });

  const total = (stats?.statusCounts.em_andamento ?? 0) + (stats?.statusCounts.concluida ?? 0) + (stats?.statusCounts.nao_avancou ?? 0);
  const pctConcluida = total > 0 ? Math.round(((stats?.statusCounts.concluida ?? 0) / total) * 100) : 0;
  const pctNaoAvancou = total > 0 ? Math.round(((stats?.statusCounts.nao_avancou ?? 0) / total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5 text-[#7c3aed]" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Gestão METALOG</h1>
          </div>
          <p className="text-muted-foreground text-sm">Compilado de relatos e acompanhamento de aderência das ações</p>
        </header>

        {/* Contadores de Aderência */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Taxa de Aderência
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Em Andamento" value={stats?.statusCounts.em_andamento ?? 0} total={total} color="border-amber-200 text-amber-900" icon={Clock} />
            <StatCard label="Concluída / Eficaz" value={stats?.statusCounts.concluida ?? 0} total={total} color="border-green-200 text-green-900" icon={CheckCircle2} />
            <StatCard label="Não Avançou" value={stats?.statusCounts.nao_avancou ?? 0} total={total} color="border-red-200 text-red-900" icon={XCircle} />
          </div>

          {total > 0 && (
            <div className="mt-4 bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Aderência geral das ações</p>
                <p className="text-2xl font-bold text-[#7c3aed]">{pctConcluida}%</p>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${pctConcluida}%` }} />
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${100 - pctConcluida - pctNaoAvancou}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${pctNaoAvancou}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Concluída</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Em Andamento</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Não Avançou</span>
              </div>
            </div>
          )}
        </section>

        {/* Ranking de KPIs */}
        {(stats?.kpiRanking?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              Ranking — KPIs mais relatados
            </h2>
            <div className="bg-card rounded-2xl border border-border p-5">
              {(() => {
                const rankingTotal = stats?.kpiRanking.reduce((s, r) => s + r.count, 0) ?? 0;
                const rankingData = stats?.kpiRanking.map(r => ({
                  kpi: r.kpi,
                  pct: rankingTotal > 0 ? Math.round((r.count / rankingTotal) * 100) : 0,
                  count: r.count,
                })) ?? [];
                return (
                  <ResponsiveContainer width="100%" height={Math.max(160, rankingData.length * 44)}>
                    <BarChart data={rankingData} layout="vertical" margin={{ top: 0, right: 50, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="kpi" width={170} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v: number, _: string, props: any) => [
                          `${v}% (${props.payload?.count} relato${props.payload?.count !== 1 ? "s" : ""})`,
                          "Participação"
                        ]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                      />
                      <Bar dataKey="pct" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 12, formatter: (v: number) => `${v}%` }}>
                        {rankingData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </section>
        )}

        {/* Listagem de Relatos */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Histórico de Relatos ({entries.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full mr-3" />
              Carregando relatos...
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <MessageSquareHeart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum relato registrado ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">Os motoristas enviam relatos pelo botão METALOG na tela deles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
