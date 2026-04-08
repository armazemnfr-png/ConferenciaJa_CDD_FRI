import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@shared/routes";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Play, Filter, CalendarDays, X } from "lucide-react";
import { useState } from "react";

export default function AdminMatinals() {
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: matinals, isLoading } = useQuery<any[]>({
    queryKey: [api.matinals.list.path],
  });

  const filteredMatinals = matinals?.filter((m) => {
    if (roomFilter !== "all" && !m.roomName.includes(roomFilter)) return false;

    if (startDate || endDate) {
      const recordDate = new Date(m.date);
      if (startDate && endDate) {
        return isWithinInterval(recordDate, {
          start: startOfDay(parseISO(startDate)),
          end: endOfDay(parseISO(endDate)),
        });
      }
      if (startDate) return recordDate >= startOfDay(parseISO(startDate));
      if (endDate)   return recordDate <= endOfDay(parseISO(endDate));
    }

    return true;
  });

  function clearFilters() {
    setRoomFilter("all");
    setStartDate("");
    setEndDate("");
  }

  const hasActiveFilters = roomFilter !== "all" || startDate || endDate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-accent font-display">Histórico de Matinais</h1>
            <p className="text-muted-foreground">Registros de tempo das salas Corona e Stella.</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-end gap-3">
              {/* Filtro por Sala */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Sala
                </label>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="h-9" data-testid="select-room-filter">
                    <SelectValue placeholder="Todas as Salas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Salas</SelectItem>
                    <SelectItem value="Corona">Sala Corona</SelectItem>
                    <SelectItem value="Stella">Sala Stella</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data início */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Data início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Data fim */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Data fim
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                  min={startDate || undefined}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Limpar filtros */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                  className="h-9 px-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive border border-input rounded-md hover:border-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </button>
              )}

              {/* Contador de resultados */}
              <div className="ml-auto text-sm text-muted-foreground self-end pb-1">
                {isLoading ? "Carregando…" : `${filteredMatinals?.length ?? 0} registro(s)`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Início Fixo</TableHead>
                    <TableHead>Finalizado Em</TableHead>
                    <TableHead>Duração (Min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatinals?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {format(new Date(m.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{m.roomName}</TableCell>
                      <TableCell>{m.fixedStartTime}</TableCell>
                      <TableCell className="font-mono">
                        {format(new Date(m.actualEndTime), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>{m.durationMinutes} min</TableCell>
                    </TableRow>
                  ))}
                  {filteredMatinals?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado para o período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
