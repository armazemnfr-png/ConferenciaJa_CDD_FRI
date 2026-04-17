import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Search, X, Clock, Loader2, AlertCircle } from "lucide-react";

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

export default function AdminPortaria() {
  const { data, isLoading, error } = usePortariaData();

  const [search, setSearch] = useState("");
  const [filterData, setFilterData] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      const matchSearch =
        !search ||
        row.mapa.toLowerCase().includes(search.toLowerCase()) ||
        row.motorista.toLowerCase().includes(search.toLowerCase()) ||
        row.nome.toLowerCase().includes(search.toLowerCase()) ||
        row.sala.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterData || row.dtOper === filterData;
      return matchSearch && matchDate;
    });
  }, [data, search, filterData]);

  const uniqueDates = useMemo(() => {
    if (!data) return [];
    const dates = [...new Set(data.map(r => r.dtOper).filter(Boolean))].sort();
    return dates;
  }, [data]);

  function clearFilters() {
    setSearch("");
    setFilterData("");
  }

  const hasFilters = search || filterData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saída Portaria</h1>
            <p className="text-sm text-muted-foreground">Horários de saída na portaria (Fase: Saída CDD/Fab)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar mapa, matrícula ou motorista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-portaria-search"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {uniqueDates.length > 0 && (
            <select
              value={filterData}
              onChange={e => setFilterData(e.target.value)}
              data-testid="select-portaria-date"
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todas as datas</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              data-testid="button-portaria-clear"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>

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
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{rows.length} registro{rows.length !== 1 ? "s" : ""} encontrado{rows.length !== 1 ? "s" : ""}</span>
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
