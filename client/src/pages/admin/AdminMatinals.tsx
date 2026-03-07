import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@shared/routes";
import { format } from "date-fns";
import { Play, Filter } from "lucide-react";
import { useState } from "react";

export default function AdminMatinals() {
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const { data: matinals, isLoading } = useQuery<any[]>({
    queryKey: [api.matinals.list.path],
  });

  const filteredMatinals = matinals?.filter(m => 
    roomFilter === "all" || m.roomName.includes(roomFilter)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-accent font-display">Histórico de Matinais</h1>
            <p className="text-muted-foreground">Registros de tempo das salas Corona e Stella.</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Salas</SelectItem>
                <SelectItem value="Corona">Sala Corona</SelectItem>
                <SelectItem value="Stella">Sala Stella</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Registros Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sala</TableHead>
                    <TableHead>Início Fixo</TableHead>
                    <TableHead>Finalizado Em</TableHead>
                    <TableHead>Duração (Min)</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatinals?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.roomName}</TableCell>
                      <TableCell>{m.fixedStartTime}</TableCell>
                      <TableCell className="font-mono">{format(new Date(m.actualEndTime), "HH:mm:ss")}</TableCell>
                      <TableCell>{m.durationMinutes} min</TableCell>
                      <TableCell>{format(new Date(m.date), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {filteredMatinals?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado.
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
