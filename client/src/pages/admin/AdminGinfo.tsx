import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ClipboardCheck, Search, Clock, Map, Users, User, Download, CalendarDays, X } from "lucide-react";
import type { GinfoChecklist } from "@shared/schema";

export default function AdminGinfo() {
  const [search, setSearch] = useState("");
  const [filterEquipe, setFilterEquipe] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: items = [], isLoading } = useQuery<GinfoChecklist[]>({
    queryKey: ["/api/ginfo"],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const equipes = Array.from(new Set(items.map((i) => i.equipe).filter(Boolean))).sort();

  const hasDateFilter = dateFrom !== "" || dateTo !== "";

  // Filtro de período — base para métricas e tabela
  const dateFiltered = items.filter((item) => {
    if (!hasDateFilter) return true;
    const importedDate = item.importedAt ? new Date(item.importedAt) : null;
    if (!importedDate) return true;
    // Zera hora para comparar só a data
    const day = new Date(importedDate.getFullYear(), importedDate.getMonth(), importedDate.getDate());
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      if (day < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + "T00:00:00");
      if (day > to) return false;
    }
    return true;
  });

  // Filtro completo — para a tabela
  const filtered = dateFiltered.filter((item) => {
    const matchSearch =
      search === "" ||
      item.mapa.toLowerCase().includes(search.toLowerCase()) ||
      item.realizadoPor.toLowerCase().includes(search.toLowerCase()) ||
      item.equipe.toLowerCase().includes(search.toLowerCase());
    const matchEquipe = filterEquipe === "all" || item.equipe === filterEquipe;
    return matchSearch && matchEquipe;
  });

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setFilterEquipe("all");
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const header = "Realizado Por,Equipe,Mapa,Tempo\n";
    const rows = filtered
      .map((i) => `"${i.realizadoPor}","${i.equipe}","${i.mapa}","${i.tempo}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "checklist_ginfo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Converte "HH:MM:SS" ou "MM:SS" para segundos (inteiro)
  const toSeconds = (tempo: string): number | null => {
    const parts = tempo.trim().split(":").map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
  };

  // Formata segundos para MM:SS
  const toMMSS = (totalSec: number): string => {
    const m = Math.floor(totalSec / 60);
    const s = Math.round(totalSec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Média geral — usa dateFiltered (período selecionado, todas as equipes)
  const allSeconds = dateFiltered.map((i) => toSeconds(i.tempo)).filter((v): v is number => v !== null);
  const globalAvgSec = allSeconds.length > 0
    ? allSeconds.reduce((a, b) => a + b, 0) / allSeconds.length
    : null;

  // Média por equipe — também usa dateFiltered
  const equipesDf = Array.from(new Set(dateFiltered.map((i) => i.equipe).filter(Boolean))).sort();
  const avgByEquipe = equipesDf.map((eq) => {
    const group = dateFiltered.filter((i) => i.equipe === eq);
    const secs = group.map((i) => toSeconds(i.tempo)).filter((v): v is number => v !== null);
    const avgSec = secs.length > 0 ? secs.reduce((a, b) => a + b, 0) / secs.length : null;
    return { equipe: eq, count: group.length, avgSec };
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              Checklist Ginfo — Saída de Veículos
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Acompanhamento do tempo de checklist de saída por mapa, equipe e motorista
            </p>
          </div>
          <button
            onClick={handleExport}
            data-testid="button-export-ginfo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Card de média geral */}
        {globalAvgSec !== null && (
          <div
            data-testid="card-media-geral"
            className="bg-blue-600 rounded-xl shadow p-5 flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Tempo Médio Geral (todas as salas)</p>
              <p className="text-white text-4xl font-bold font-mono tracking-wide">
                {toMMSS(globalAvgSec)}
              </p>
              <p className="text-blue-200 text-xs mt-0.5">{allSeconds.length} registros considerados</p>
            </div>
          </div>
        )}

        {/* Summary cards by equipe */}
        {avgByEquipe.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avgByEquipe.map(({ equipe, count, avgSec }) => (
              <div
                key={equipe}
                data-testid={`card-equipe-${equipe}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700 truncate">{equipe}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-gray-800">
                  {avgSec !== null ? toMMSS(avgSec) : "--"}
                </div>
                <div className="text-xs text-gray-400 mt-1">média · {count} registros</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* Linha de período */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 shrink-0">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Período
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            {(hasDateFilter || search || filterEquipe !== "all") && (
              <button
                onClick={clearFilters}
                data-testid="button-clear-filters"
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" /> Limpar filtros
              </button>
            )}
          </div>

          {/* Linha de busca e equipe */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar mapa, motorista ou equipe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-ginfo"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <select
              value={filterEquipe}
              onChange={(e) => setFilterEquipe(e.target.value)}
              data-testid="select-filter-equipe"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todas as equipes</option>
              {equipes.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">
                {items.length === 0
                  ? "Nenhum checklist importado. Faça upload na aba de importação."
                  : "Nenhum resultado para o filtro atual."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">
                    <span className="flex items-center gap-1"><Map className="w-3 h-3" /> Mapa</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Equipe</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Realizado Por</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    data-testid={`row-ginfo-${item.id}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold text-blue-700">{item.mapa}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.equipe || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.realizadoPor || "—"}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sec = toSeconds(item.tempo || "");
                        const isShort = sec !== null && sec < 240; // < 4 minutos
                        return (
                          <span className={`flex items-center gap-1 font-mono font-medium ${isShort ? "text-red-600" : "text-gray-800"}`}>
                            <Clock className={`w-3.5 h-3.5 ${isShort ? "text-red-400" : "text-gray-400"}`} />
                            {item.tempo || "—"}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 text-right">
          {filtered.length} de {items.length} registros
        </p>
      </div>
    </AdminLayout>
  );
}
