import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdherencia } from "@/hooks/use-conferences";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, Clock, XCircle, BarChart2, Download, CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'not_started';

const STATUS_LABEL: Record<string, string> = {
  completed: 'Conferido',
  in_progress: 'Em Andamento',
  not_started: 'Não Conferido',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  not_started: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICON: Record<string, JSX.Element> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  in_progress: <Clock className="h-3.5 w-3.5" />,
  not_started: <XCircle className="h-3.5 w-3.5" />,
};

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export default function AdminAdherencia() {
  const { data, isLoading } = useAdherencia();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const hasDateFilter = dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Filtro de período aplicado a completedAt
  // Mapas não iniciados/em andamento são sempre incluídos (representam o plano do dia)
  const dateFiltered = useMemo(() => {
    if (!data) return [];
    if (!hasDateFilter) return data.maps;
    return data.maps.filter(m => {
      if (!m.completedAt) return true; // pendentes: sempre visíveis
      const d = new Date(m.completedAt);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (dateFrom && day < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo && day > new Date(dateTo + "T00:00:00")) return false;
      return true;
    });
  }, [data, dateFrom, dateTo, hasDateFilter]);

  // Filtro completo para a tabela
  const filtered = useMemo(() => {
    return dateFiltered.filter(m => {
      const matchesSearch =
        m.mapNumber.toLowerCase().includes(search.toLowerCase()) ||
        (m.driverName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (m.driverId ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dateFiltered, search, statusFilter]);

  // Métricas refletem o período selecionado
  const notConferred = dateFiltered.filter(m => m.status === 'not_started').length;
  const inProgress = dateFiltered.filter(m => m.status === 'in_progress').length;
  const conferenced = dateFiltered.filter(m => m.status === 'completed').length;
  const totalFiltered = dateFiltered.length;
  const adherencePct = totalFiltered > 0 ? Math.round((conferenced / totalFiltered) * 100) : 0;

  function downloadCsv() {
    if (!data) return;
    const rows = [
      ["Mapa", "Status", "Matrícula", "Motorista", "Conferido Em"],
      ...filtered.map(m => [
        m.mapNumber,
        STATUS_LABEL[m.status],
        m.driverId ?? "",
        m.driverName ?? "",
        m.completedAt ? format(new Date(m.completedAt), "dd/MM/yyyy HH:mm") : "",
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adherencia_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!data || data.totalMaps === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-muted-foreground">
          <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum mapa encontrado.</p>
          <p className="text-sm mt-1">Faça o upload do relatório WMS primeiro.</p>
        </div>
      </AdminLayout>
    );
  }

  const pct = hasDateFilter ? adherencePct : data.adherencePercentage;
  const total = hasDateFilter ? totalFiltered : data.totalMaps;
  const pctColor = pct >= 90 ? "text-emerald-600" : pct >= 70 ? "text-yellow-600" : "text-red-600";
  const barColor = pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-yellow-400" : "bg-red-500";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              Aderência de Mapas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cruzamento entre mapas do WMS (esperados) e conferências realizadas
            </p>
          </div>
          <button
            onClick={downloadCsv}
            data-testid="button-download-csv"
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Filtro de Período */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 shrink-0">
              <CalendarDays className="w-4 h-4 text-primary" />
              Período
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-slate-400 text-sm shrink-0">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {(hasDateFilter || search || statusFilter !== "all") && (
              <button
                onClick={clearFilters}
                data-testid="button-clear-filters"
                className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-xl transition"
              >
                <X className="w-3.5 h-3.5" /> Limpar filtros
              </button>
            )}
          </div>
          {hasDateFilter && (
            <p className="text-xs text-slate-400 mt-2 ml-1">
              Filtrando por data de conclusão da conferência. Mapas sem data (não conferidos) não aparecem neste modo.
            </p>
          )}
        </div>

        {/* Cartões de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total de Mapas</p>
            <p className="text-3xl font-bold text-slate-800" data-testid="text-total-maps">{total}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm p-4">
            <p className="text-xs text-emerald-700 uppercase tracking-wider font-semibold mb-1">Conferidos</p>
            <p className="text-3xl font-bold text-emerald-700" data-testid="text-conferenced">{conferenced}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm p-4">
            <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold mb-1">Em Andamento</p>
            <p className="text-3xl font-bold text-yellow-700" data-testid="text-in-progress">{inProgress}</p>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-4">
            <p className="text-xs text-red-700 uppercase tracking-wider font-semibold mb-1">Não Conferidos</p>
            <p className="text-3xl font-bold text-red-700" data-testid="text-not-started">{notConferred}</p>
          </div>
        </div>

        {/* Barra de Aderência */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              Aderência {hasDateFilter ? "no Período" : "Geral"}
            </span>
            <span className={`text-3xl font-black ${pctColor}`} data-testid="text-adherence-pct">{pct}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{conferenced} conferidos</span>
            <span>{total} total</span>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mapa ou motorista..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-9 text-sm"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "not_started", "in_progress", "completed"] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  data-testid={`filter-${s}`}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    statusFilter === s
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-slate-600 border-slate-200 hover:border-accent/40"
                  }`}
                >
                  {s === "all" ? "Todos" : STATUS_LABEL[s]}
                  {s !== "all" && (
                    <span className="ml-1.5 opacity-70">
                      ({s === 'completed' ? conferenced : s === 'in_progress' ? inProgress : notConferred})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de mapas */}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Mapa</th>
                  <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Motorista</th>
                  <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Matrícula</th>
                  <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Conferido Em</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      Nenhum mapa encontrado para este filtro.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, idx) => (
                    <tr
                      key={m.mapNumber}
                      data-testid={`row-map-${m.mapNumber}`}
                      className={`border-b border-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30 transition-colors`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{m.mapNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[m.status]}`}>
                          {STATUS_ICON[m.status]}
                          {STATUS_LABEL[m.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {m.driverName ?? <span className="text-slate-400 italic text-xs">Não identificado</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                        {m.driverId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {m.completedAt
                          ? format(new Date(m.completedAt), "dd/MM/yy HH:mm", { locale: ptBR })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 text-xs text-muted-foreground">
            Exibindo {filtered.length} de {total} mapas{hasDateFilter ? " no período" : ""}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
