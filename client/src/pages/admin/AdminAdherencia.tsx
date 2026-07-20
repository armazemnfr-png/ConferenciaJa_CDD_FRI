import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdherencia } from "@/hooks/use-conferences";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, Clock, XCircle, BarChart2, Download, CalendarDays, TrendingUp } from "lucide-react";
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

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

type Preset = { label: string; start: string; end: string };

function getPresets(): Preset[] {
  const today = todayStr();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const firstOfMonth = `${y}-${String(m+1).padStart(2,'0')}-01`;
  const lastOfMonth = new Date(y, m+1, 0);
  const lastOfMonthStr = `${y}-${String(m+1).padStart(2,'0')}-${String(lastOfMonth.getDate()).padStart(2,'0')}`;

  const prevMonth = m === 0 ? 11 : m - 1;
  const prevMonthYear = m === 0 ? y - 1 : y;
  const firstOfPrevMonth = `${prevMonthYear}-${String(prevMonth+1).padStart(2,'0')}-01`;
  const lastOfPrevMonth = new Date(prevMonthYear, prevMonth+1, 0);
  const lastOfPrevMonthStr = `${prevMonthYear}-${String(prevMonth+1).padStart(2,'0')}-${String(lastOfPrevMonth.getDate()).padStart(2,'0')}`;

  const d7ago = new Date(now); d7ago.setDate(d7ago.getDate() - 6);
  const d7agoStr = `${d7ago.getFullYear()}-${String(d7ago.getMonth()+1).padStart(2,'0')}-${String(d7ago.getDate()).padStart(2,'0')}`;

  return [
    { label: "Hoje", start: today, end: today },
    { label: "Últimos 7 dias", start: d7agoStr, end: today },
    { label: "Mês Atual", start: firstOfMonth, end: lastOfMonthStr },
    { label: "Mês Anterior", start: firstOfPrevMonth, end: lastOfPrevMonthStr },
    { label: `Ano ${y}`, start: `${y}-01-01`, end: `${y}-12-31` },
  ];
}

export default function AdminAdherencia() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());

  const isSingleDay = startDate === endDate;
  const { data, isLoading } = useAdherencia(startDate, endDate);

  const presets = getPresets();

  function applyPreset(preset: Preset) {
    setStartDate(preset.start);
    setEndDate(preset.end);
    setSearch("");
    setStatusFilter("all");
  }

  function isActivePreset(preset: Preset) {
    return preset.start === startDate && preset.end === endDate;
  }

  const filtered = useMemo(() => {
    if (!data || !isSingleDay) return [];
    return data.maps.filter(m => {
      const matchesSearch =
        m.mapNumber.toLowerCase().includes(search.toLowerCase()) ||
        (m.driverName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (m.driverId ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, isSingleDay, search, statusFilter]);

  const notConferred = isSingleDay ? (data?.maps ?? []).filter(m => m.status === 'not_started').length : 0;
  const inProgress = isSingleDay ? (data?.maps ?? []).filter(m => m.status === 'in_progress').length : 0;
  const conferenced = data?.conferencedMaps ?? 0;
  const total = data?.totalMaps ?? 0;
  const pct = data?.adherencePercentage ?? 0;

  function downloadCsv() {
    if (!data) return;
    if (isSingleDay) {
      const rows = [
        ["Mapa", "Status", "Matrícula", "Motorista", "Sala", "Conferido Em"],
        ...filtered.map(m => [
          m.mapNumber,
          STATUS_LABEL[m.status],
          m.driverId ?? "",
          m.driverName ?? "",
          m.room ?? "",
          m.completedAt ? format(new Date(m.completedAt), "dd/MM/yyyy HH:mm") : "",
        ])
      ];
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adherencia_${startDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [
        ["Data", "Total Mapas", "Conferidos", "Aderência %"],
        ...(data.byDay ?? []).map(d => [
          formatDateBR(d.date),
          String(d.totalMaps),
          String(d.conferencedMaps),
          `${d.adherencePercentage}%`,
        ])
      ];
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adherencia_${startDate}_a_${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const pctColor = pct >= 90 ? "text-emerald-600" : pct >= 70 ? "text-yellow-600" : "text-red-600";
  const barColor = pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-yellow-400" : "bg-red-500";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
            disabled={!data || total === 0}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Filtro de Período */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          {/* Atalhos rápidos */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Período:</span>
            {getPresets().map(preset => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                data-testid={`preset-${preset.label.replace(/\s+/g, '-').toLowerCase()}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isActivePreset(preset)
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Seletor manual de intervalo */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 shrink-0">
              <CalendarDays className="w-4 h-4 text-primary" />
              De
            </div>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              data-testid="input-start-date"
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-sm text-slate-500 shrink-0">até</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              data-testid="input-end-date"
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <p className="text-xs text-slate-400">
            {isSingleDay
              ? `Mostrando mapas do WMS e conferências de ${formatDateBR(startDate)}.`
              : `Período de ${formatDateBR(startDate)} a ${formatDateBR(endDate)}.`}
          </p>
        </div>

        {/* Sem dados */}
        {(!data || total === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhum mapa encontrado.</p>
            <p className="text-sm mt-1">Faça o upload do relatório WMS para este período primeiro.</p>
          </div>
        )}

        {data && total > 0 && (
          <>
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
              {isSingleDay ? (
                <>
                  <div className="bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm p-4">
                    <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold mb-1">Em Andamento</p>
                    <p className="text-3xl font-bold text-yellow-700" data-testid="text-in-progress">{inProgress}</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-4">
                    <p className="text-xs text-red-700 uppercase tracking-wider font-semibold mb-1">Não Conferidos</p>
                    <p className="text-3xl font-bold text-red-700" data-testid="text-not-started">{notConferred}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Dias com Dados</p>
                    <p className="text-3xl font-bold text-slate-700">{data.byDay?.length ?? 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Não Conferidos</p>
                    <p className="text-3xl font-bold text-red-600">{total - conferenced}</p>
                  </div>
                </>
              )}
            </div>

            {/* Barra de Aderência */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">
                  {isSingleDay ? "Aderência do Dia" : "Aderência do Período"}
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

            {/* Aderência por Sala */}
            {data.byRoom && data.byRoom.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.byRoom.map(r => {
                  const roomPctColor = r.adherencePercentage >= 90 ? "text-emerald-600" : r.adherencePercentage >= 70 ? "text-yellow-600" : "text-red-600";
                  const roomBarColor = r.adherencePercentage >= 90 ? "bg-emerald-500" : r.adherencePercentage >= 70 ? "bg-yellow-400" : "bg-red-500";
                  return (
                    <div key={r.room} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" data-testid={`card-room-adherence-${r.room}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Aderência — Sala {r.room}
                        </span>
                        <span className={`text-2xl font-black ${roomPctColor}`} data-testid={`text-room-adherence-pct-${r.room}`}>
                          {r.adherencePercentage}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${roomBarColor} transition-all duration-700`}
                          style={{ width: `${r.adherencePercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{r.conferencedMaps} conferidos</span>
                        <span>{r.totalMaps} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detalhamento por dia */}
            {data.byDay && data.byDay.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-slate-700">Aderência por Dia</span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Data</th>
                        <th className="text-right font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Total</th>
                        <th className="text-right font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Conferidos</th>
                        <th className="text-right font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Não Conferidos</th>
                        <th className="text-right font-bold px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Aderência</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 w-40"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDay.map((d, idx) => {
                        const dayPctColor = d.adherencePercentage >= 90 ? "text-emerald-600" : d.adherencePercentage >= 70 ? "text-yellow-600" : "text-red-600";
                        const dayBarColor = d.adherencePercentage >= 90 ? "bg-emerald-500" : d.adherencePercentage >= 70 ? "bg-yellow-400" : "bg-red-500";
                        return (
                          <tr
                            key={d.date}
                            data-testid={`row-day-${d.date}`}
                            className={`border-b border-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {format(new Date(d.date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{d.totalMaps}</td>
                            <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{d.conferencedMaps}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold">{d.totalMaps - d.conferencedMaps}</td>
                            <td className={`px-4 py-3 text-right font-black ${dayPctColor}`}>{d.adherencePercentage}%</td>
                            <td className="px-4 py-3">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
                                <div
                                  className={`h-full rounded-full ${dayBarColor}`}
                                  style={{ width: `${d.adherencePercentage}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela de mapas detalhada (apenas dia único) */}
            {isSingleDay && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                            ({s === 'completed' ? (data?.maps ?? []).filter(m => m.status === 'completed').length
                              : s === 'in_progress' ? (data?.maps ?? []).filter(m => m.status === 'in_progress').length
                              : (data?.maps ?? []).filter(m => m.status === 'not_started').length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

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
                              {m.driverName
                                ? m.driverName
                                : m.driverId
                                  ? <span className="text-slate-500 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Mat. {m.driverId}</span>
                                  : <span className="text-slate-400 italic text-xs">Não identificado</span>
                              }
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
                  Exibindo {filtered.length} de {total} mapas
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
