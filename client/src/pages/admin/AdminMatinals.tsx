import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Play, Filter, CalendarDays, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminMatinals() {
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matinals, isLoading } = useQuery<any[]>({
    queryKey: [api.matinals.list.path],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/matinals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.matinals.list.path] });
      toast({ title: "Registro excluído com sucesso." });
      setConfirmDeleteId(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao excluir registro." });
      setConfirmDeleteId(null);
    },
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
        <div>
          <h1 className="text-3xl font-bold text-accent font-display">Histórico de Matinais</h1>
          <p className="text-muted-foreground">Registros de tempo das salas Corona e Stella.</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-end gap-3">
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
                    <TableHead className="w-12"></TableHead>
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
                      <TableCell>
                        {confirmDeleteId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => deleteMutation.mutate(m.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-confirm-delete-${m.id}`}
                              className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-destructive text-white hover:bg-destructive/90 transition-colors"
                            >
                              {deleteMutation.isPending ? "..." : "Confirmar"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-input text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteId(m.id)}
                            data-testid={`button-delete-matinal-${m.id}`}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMatinals?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
