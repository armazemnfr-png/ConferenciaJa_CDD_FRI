import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MessageSquareHeart, TrendingUp, CheckCircle2, Clock, XCircle, AlertTriangle, PenLine, Save, Users, UserCheck, UserX, Search, Trash2, Paperclip, FileText, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { MetalogEntrySummary } from "@shared/schema";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  concluida: { label: "Concluída/Eficaz", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  nao_avancou: { label: "Não Avançou", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const ASSESSMENT_OPTIONS = [
  { value: "aplicavel", label: "Aplicável", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "nao_aplicavel", label: "Não aplicável", color: "bg-red-100 text-red-800 border-red-200" },
] as const;

const BAR_COLORS = ["#7c3aed", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff", "#faf5ff"];
const MAX_EVIDENCE_SIZE = 3 * 1024 * 1024;
const EVIDENCE_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("Não foi possível ler o arquivo."));
      else resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number | null | undefined): string {
  if (!size) return "";
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

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

function EntryRow({ entry }: { entry: MetalogEntrySummary }) {
  const [status, setStatus] = useState(entry.status);
  const [justification, setJustification] = useState(entry.blockerJustification ?? "");
  const [actionTaken, setActionTaken] = useState(entry.actionTaken ?? "");
  const [rootCauseAssessment, setRootCauseAssessment] = useState<string | null>(entry.rootCauseAssessment ?? null);
  const [actionAssessment, setActionAssessment] = useState<string | null>(entry.actionAssessment ?? null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [removeEvidence, setRemoveEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const needsJustification = status === "nao_avancou";
  const hasChanges =
    status !== entry.status ||
    actionTaken.trim() !== (entry.actionTaken ?? "") ||
    rootCauseAssessment !== (entry.rootCauseAssessment ?? null) ||
    actionAssessment !== (entry.actionAssessment ?? null) ||
    (needsJustification && justification.trim() !== (entry.blockerJustification ?? "")) ||
    evidenceFile !== null ||
    removeEvidence;

  function handleEvidenceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast({ title: "Formato não permitido", description: "Anexe um PDF, PNG, JPG ou WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_EVIDENCE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "A evidência deve ter no máximo 3 MB.", variant: "destructive" });
      return;
    }
    setEvidenceFile(file);
    setRemoveEvidence(false);
  }

  async function handleSave() {
    if (needsJustification && !justification.trim()) {
      toast({ title: "Justificativa obrigatória", description: "Preencha a justificativa para 'Não Avançou'.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let evidence: { fileName: string; mimeType: string; size: number; data: string } | null | undefined;
      if (evidenceFile) {
        evidence = {
          fileName: evidenceFile.name,
          mimeType: evidenceFile.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp",
          size: evidenceFile.size,
          data: await fileToBase64(evidenceFile),
        };
      } else if (removeEvidence) {
        evidence = null;
      }

      const res = await fetch(`/api/metalog/${entry.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          blockerJustification: needsJustification ? justification.trim() : null,
          actionTaken: actionTaken.trim() || null,
          rootCauseAssessment,
          actionAssessment,
          ...(evidenceFile || removeEvidence ? { evidence } : {}),
        }),
      });
      if (res.ok) {
        toast({ title: "Salvo!" });
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/metalog/${entry.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Relato excluído com sucesso!" });
        queryClient.invalidateQueries({ queryKey: ["/api/metalog"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metalog/stats"] });
      } else {
        toast({ title: "Erro ao excluir relato", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const kpiLabel = entry.kpi === "Outros" && entry.kpiOther ? `Outros: ${entry.kpiOther}` : entry.kpi;
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.em_andamento;

  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors align-top">
      {/* Data + Nome */}
      <td className="px-4 py-3 min-w-[140px]">
        <p className="font-semibold text-sm text-foreground">{entry.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entry.createdAt ? format(new Date(entry.createdAt), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
        </p>
      </td>

      {/* KPI */}
      <td className="px-4 py-3 min-w-[130px]">
        <span className="inline-block bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
          {kpiLabel}
        </span>
      </td>

      {/* Por que não bate? */}
      <td className="px-4 py-3 min-w-[200px] max-w-[260px]">
        <p className="text-sm text-foreground leading-snug">{entry.reason}</p>
      </td>

      {/* Como resolve? */}
      <td className="px-4 py-3 min-w-[200px] max-w-[260px]">
        <p className="text-sm text-foreground leading-snug">{entry.solution}</p>
      </td>

      {/* Avaliação de procedência */}
      <td className="px-4 py-3 min-w-[220px]">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
              Causa raiz
            </p>
            <div className="flex flex-wrap gap-1">
              {ASSESSMENT_OPTIONS.map(option => (
                <button
                  key={`cause-${option.value}`}
                  onClick={() => setRootCauseAssessment(option.value)}
                  data-testid={`button-metalog-cause-${option.value}-${entry.id}`}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    rootCauseAssessment === option.value
                      ? option.color + " ring-1 ring-offset-1 ring-current"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
              Ação proposta
            </p>
            <div className="flex flex-wrap gap-1">
              {ASSESSMENT_OPTIONS.map(option => (
                <button
                  key={`action-${option.value}`}
                  onClick={() => setActionAssessment(option.value)}
                  data-testid={`button-metalog-action-${option.value}-${entry.id}`}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    actionAssessment === option.value
                      ? option.color + " ring-1 ring-offset-1 ring-current"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </td>

      {/* O que foi feito (gestão) */}
      <td className="px-4 py-3 min-w-[200px]">
        <textarea
          value={actionTaken}
          onChange={e => setActionTaken(e.target.value)}
          placeholder="O que foi feito..."
          data-testid={`textarea-metalog-action-${entry.id}`}
          rows={2}
          className="w-full px-2.5 py-2 text-sm rounded-lg border-2 border-[#7c3aed]/25 focus:border-[#7c3aed] focus:outline-none resize-none bg-white placeholder:text-muted-foreground/40 transition-all min-w-[180px]"
        />
        <div className="mt-2 space-y-1.5">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#7c3aed]/25 text-xs font-semibold text-[#7c3aed] hover:bg-[#7c3aed]/5 cursor-pointer transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
            {evidenceFile ? "Trocar evidência" : "Anexar evidência"}
            <input
              type="file"
              accept={EVIDENCE_ACCEPT}
              onChange={handleEvidenceChange}
              className="hidden"
              data-testid={`input-metalog-evidence-${entry.id}`}
            />
          </label>
          {evidenceFile && (
            <div className="flex items-center gap-1.5 text-xs text-foreground">
              <FileText className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
              <span className="truncate" title={evidenceFile.name}>{evidenceFile.name}</span>
              <span className="text-muted-foreground shrink-0">({formatFileSize(evidenceFile.size)})</span>
              <button
                type="button"
                onClick={() => setEvidenceFile(null)}
                className="p-0.5 text-muted-foreground hover:text-red-600"
                title="Remover arquivo selecionado"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {entry.evidenceName && !evidenceFile && !removeEvidence && (
            <div className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <a
                href={`/api/metalog/${entry.id}/evidence`}
                target="_blank"
                rel="noreferrer"
                className="truncate text-green-700 hover:underline"
                title={`Abrir ${entry.evidenceName}`}
              >
                {entry.evidenceName}
              </a>
              <span className="text-muted-foreground shrink-0">({formatFileSize(entry.evidenceSize)})</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              <button
                type="button"
                onClick={() => setRemoveEvidence(true)}
                className="p-0.5 text-muted-foreground hover:text-red-600"
                title="Remover evidência ao salvar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {removeEvidence && (
            <p className="text-xs text-red-600">A evidência será removida ao salvar.</p>
          )}
        </div>
      </td>

      {/* Status + Ações */}
      <td className="px-4 py-3 min-w-[200px]">
        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
            <statusInfo.icon className="w-3 h-3" />
            {statusInfo.label}
          </span>
          <div className="flex flex-col gap-1">
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                data-testid={`button-metalog-status-${key}-${entry.id}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all text-left ${
                  status === key
                    ? val.color + " ring-1 ring-offset-1 ring-current"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>

          {needsJustification && (
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Justificativa (obrigatório)..."
              data-testid={`textarea-metalog-justification-${entry.id}`}
              rows={2}
              className="w-full px-2.5 py-2 text-xs rounded-lg border-2 border-red-300 focus:border-red-500 focus:outline-none resize-none bg-red-50 text-red-900 placeholder:text-red-400"
            />
          )}

          {entry.blockerJustification && !needsJustification && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              {entry.blockerJustification}
            </p>
          )}

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving || (needsJustification && !justification.trim())}
              data-testid={`button-metalog-save-${entry.id}`}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#7c3aed] text-white text-xs font-bold rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
        </div>
      </td>

      {/* Excluir relato */}
      <td className="px-4 py-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-red-600 font-semibold whitespace-nowrap">Excluir?</p>
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "..." : "Sim"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-lg hover:bg-muted/80 transition-colors"
              >
                Não
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Excluir relato"
            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminMetalog() {
  const { data: entries = [], isLoading } = useQuery<MetalogEntrySummary[]>({ queryKey: ["/api/metalog"] });
  const { data: stats } = useQuery<{
    kpiRanking: { kpi: string; count: number }[];
    statusCounts: { em_andamento: number; concluida: number; nao_avancou: number };
    rootCauseCounts: { aplicavel: number; nao_aplicavel: number; pendente: number };
    actionCounts: { aplicavel: number; nao_aplicavel: number; pendente: number };
  }>({ queryKey: ["/api/metalog/stats"] });
  const { data: allDrivers = [] } = useQuery<{ name: string }[]>({ queryKey: ["/api/drivers"] });

  const [monitorSearch, setMonitorSearch] = useState("");

  // Nomes únicos que já comentaram (normalizado para comparação)
  const commentedNames = new Set(
    entries.map(e => e.name.trim().toUpperCase())
  );

  // Filtrar colaboradores por busca
  const driversFiltered = allDrivers.filter(d =>
    monitorSearch.trim() === "" ||
    d.name.toLowerCase().includes(monitorSearch.toLowerCase())
  );

  const commented = driversFiltered.filter(d => commentedNames.has(d.name.trim().toUpperCase()));
  const notCommented = driversFiltered.filter(d => !commentedNames.has(d.name.trim().toUpperCase()));

  const total = (stats?.statusCounts.em_andamento ?? 0) + (stats?.statusCounts.concluida ?? 0) + (stats?.statusCounts.nao_avancou ?? 0);
  const pctConcluida = total > 0 ? Math.round(((stats?.statusCounts.concluida ?? 0) / total) * 100) : 0;
  const pctNaoAvancou = total > 0 ? Math.round(((stats?.statusCounts.nao_avancou ?? 0) / total) * 100) : 0;
  const rootCauseCounts = stats?.rootCauseCounts ?? { aplicavel: 0, nao_aplicavel: 0, pendente: 0 };
  const actionCounts = stats?.actionCounts ?? { aplicavel: 0, nao_aplicavel: 0, pendente: 0 };
  const rootCauseEvaluated = rootCauseCounts.aplicavel + rootCauseCounts.nao_aplicavel;
  const actionEvaluated = actionCounts.aplicavel + actionCounts.nao_aplicavel;
  const rootCausePct = rootCauseEvaluated > 0 ? Math.round((rootCauseCounts.aplicavel / rootCauseEvaluated) * 100) : 0;
  const actionPct = actionEvaluated > 0 ? Math.round((actionCounts.aplicavel / actionEvaluated) * 100) : 0;

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

        {/* Monitoramento de Participação */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Monitoramento de Participação
          </h2>

          {/* Barra de progresso geral */}
          {allDrivers.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Colaboradores que já comentaram</p>
                <p className="text-2xl font-bold text-[#7c3aed]">
                  {commentedNames.size}/{allDrivers.length}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({allDrivers.length > 0 ? Math.round((commentedNames.size / allDrivers.length) * 100) : 0}%)
                  </span>
                </p>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[#7c3aed] transition-all rounded-full"
                  style={{ width: `${allDrivers.length > 0 ? (commentedNames.size / allDrivers.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Campo de busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={monitorSearch}
              onChange={e => setMonitorSearch(e.target.value)}
              placeholder="Buscar colaborador..."
              data-testid="input-monitor-search"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Duas colunas: comentaram / não comentaram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Não comentaram */}
            <div className="bg-card rounded-2xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-red-700">Ainda não comentaram</span>
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                  {notCommented.length}
                </span>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                {notCommented.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                    {monitorSearch ? "Nenhum resultado" : "Todos comentaram! 🎉"}
                  </li>
                ) : (
                  notCommented.map(d => (
                    <li key={d.name} className="px-4 py-2.5 text-sm text-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {d.name}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Comentaram */}
            <div className="bg-card rounded-2xl border border-green-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700">Já comentaram</span>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                  {commented.length}
                </span>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                {commented.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                    Nenhum ainda
                  </li>
                ) : (
                  commented.map(d => (
                    <li key={d.name} className="px-4 py-2.5 text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {d.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>

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

        {/* Avaliação de procedência */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Maturidade dos relatos
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            A avaliação considera apenas os relatos já classificados. Os pendentes não entram no percentual.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                title: "Identificação da causa raiz",
                counts: rootCauseCounts,
                evaluated: rootCauseEvaluated,
                percentage: rootCausePct,
              },
              {
                title: "Ação proposta",
                counts: actionCounts,
                evaluated: actionEvaluated,
                percentage: actionPct,
              },
            ].map(card => (
              <div key={card.title} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.evaluated} de {entries.length} avaliados
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-[#7c3aed]">
                    {card.evaluated > 0 ? `${card.percentage}%` : "—"}
                  </p>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex mb-3">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${card.evaluated > 0 ? (card.counts.aplicavel / card.evaluated) * 100 : 0}%` }} />
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${card.evaluated > 0 ? (card.counts.nao_aplicavel / card.evaluated) * 100 : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    Aplicável / procedente: {card.counts.aplicavel}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    Não aplicável: {card.counts.nao_aplicavel}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" />
                    Pendente: {card.counts.pendente}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

        {/* Listagem de Relatos — tabela horizontal */}
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Nome / Data</th>
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">KPI</th>
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Por que não bate?</th>
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Como resolve?</th>
                       <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Procedência</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#7c3aed] uppercase tracking-wide whitespace-nowrap flex items-center gap-1">
                        <PenLine className="w-3.5 h-3.5" />
                        O que foi feito (gestão)
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Aderência</th>
                      <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-center">Excluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

