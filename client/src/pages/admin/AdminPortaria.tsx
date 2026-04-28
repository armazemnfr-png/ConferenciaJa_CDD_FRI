import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Search, X, Clock, Loader2, AlertCircle, CalendarRange, Building2, User } from "lucide-react";

type PortariaRow = {
  mapa: string;
  motorista: string;
  nome: string;
  sala: string;
  dtOper: string;
  hrOper: string;
};

function usePortariaData() {
  return useQuery<PortariaRow[]>({
    queryKey: ["/api/portaria"],
    queryFn: async () => {
      const res = await fetch("/api/portaria", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar dados da portaria");
      return res.json();
    },
  });
}

// Converte "DD/MM/YYYY" → Date (ou tenta outros formatos)
function parseDtOper(dtOper: string): Date | null {
  if (!dtOper) return null;
  // Formato DD/MM/YYYY
  const dmyMatch = dtOper.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // Formato YYYY-MM-DD
  const ymdMatch = dtOper.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}

export default function AdminPortaria() {
  const { data, isLoading, error } = usePortariaData();

  const [search, setSearch] = useState("");
  const [filterMotorista, setFilterMotorista] = useState("");
  const [filterSala, setFilterSala] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const uniqueSalas = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map(r => r.sala).filter(s => s && s !== "–"))).sort();
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;

    return data.filter(row => {
      const matchSearch =
        !search ||
        row.mapa.toLowerCase().includes(search.toLowerCase());

      const matchMotorista =
        !filterMotorista ||
        row.motorista.toLowerCase().includes(filterMotorista.toLowerCase()) ||
        row.nome.toLowerCase().includes(filterMotorista.toLowerCase());

      const matchSala =
        !filterSala || row.sala === filterSala;

      let matchDate = true;
      if (start || end) {
        const dt = parseDtOper(row.dtOper);
        if (dt) {
          if (start && dt < start) matchDate = false;
          if (end && dt > end) matchDate = false;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchMotorista && matchSala && matchDate;
    });
  }, [data, search, filterMotorista, filterSala, startDate, endDate]);

  function clearFilters() {
    setSearch("");
    setFilterMotorista("");
    setFilterSala("");
    setStartDate("");
    setEndDate("");
  }

  const hasFilters = search || filterMotorista || filterSala || startDate || endDate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saída Portaria</h1>
            <p className="text-sm text-muted-foreground">Horários de saída — mapas de rota (Fase: Saída CDD/Fab)</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Mapa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar mapa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-portaria-search"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Motorista */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Motorista ou matrícula..."
                value={filterMotorista}
                onChange={e => setFilterMotorista(e.target.value)}
                data-testid="input-portaria-motorista"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Sala */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={filterSala}
                onChange={e => setFilterSala(e.target.value)}
                data-testid="select-portaria-sala"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                <option value="">Todas as salas</option>
                {uniqueSalas.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Limpar */}
            {hasFilters ? (
              <button
                onClick={clearFilters}
                data-testid="button-portaria-clear"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Período */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <CalendarRange className="h-4 w-4" />
              <span>Período:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                data-testid="input-portaria-start"
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                data-testid="input-portaria-end"
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">Erro ao carregar dados. Verifique se o relatório PW foi importado.</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3 text-muted-foreground">
            <DoorOpen className="h-12 w-12 opacity-20" />
            <p className="text-base font-medium">
              {data && data.length === 0
                ? "Nenhum dado encontrado. Certifique-se de que o relatório PW (Promax) e o relatório WMS foram importados."
                : "Nenhum resultado para os filtros selecionados."}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {rows.length} registro{rows.length !== 1 ? "s" : ""} encontrado{rows.length !== 1 ? "s" : ""}
                  {data && data.length !== rows.length && (
                    <span className="ml-1 text-xs">de {data.length} total</span>
                  )}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Mapa</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Matrícula</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Motorista</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Sala</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Data</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Hora de Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.mapa}-${idx}`}
                      data-testid={`row-portaria-${idx}`}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono font-semibold text-accent" data-testid={`text-mapa-${idx}`}>
                        {row.mapa || "–"}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted-foreground" data-testid={`text-matricula-${idx}`}>
                        {row.motorista || "–"}
                      </td>
                      <td className="px-5 py-3 font-medium" data-testid={`text-nome-${idx}`}>
                        {row.nome}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground" data-testid={`text-sala-${idx}`}>
                        {row.sala}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground" data-testid={`text-dtoper-${idx}`}>
                        {row.dtOper || "–"}
                      </td>
                      <td className="px-5 py-3" data-testid={`text-hroper-${idx}`}>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                          <Clock className="h-3.5 w-3.5" />
                          {row.hrOper || "–"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
