import React from "react";
import { useConferences } from "@/hooks/use-conferences";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ConferenceHistory() {
  const { data: conferences, isLoading } = useConferences();

  // Calcula a duração exata comparando as strings de data do banco
  const calculateDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return "00:00";
    try {
      const seconds = differenceInSeconds(new Date(end), new Date(start));
      if (isNaN(seconds) || seconds < 0) return "00:00";
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } catch {
      return "00:00";
    }
  };

  if (isLoading) {
    return (
      <div className="h-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-display font-bold text-xl">Histórico de Conferências</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Mapa</TableHead>
            <TableHead>Colaborador</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Tempo de Conferência</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conferences?.map((conf) => (
            <TableRow key={conf.id} className="hover:bg-muted/30">
              <TableCell className="font-bold">#{conf.mapNumber}</TableCell>
              <TableCell>{conf.driverId || "539"}</TableCell>
              <TableCell className="font-mono text-xs">
                {conf.startTime ? format(new Date(conf.startTime), "dd/MM HH:mm:ss", { locale: ptBR }) : "-"}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {conf.endTime ? format(new Date(conf.endTime), "dd/MM HH:mm:ss", { locale: ptBR }) : "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="font-mono font-bold text-blue-600">
                    {calculateDuration(
                      conf.startTime ? new Date(conf.startTime as unknown as string).toISOString() : undefined,
                      conf.endTime ? new Date(conf.endTime as unknown as string).toISOString() : undefined
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${
                  conf.status === 'completed' ? 'bg-[#FBBF24] text-black' : 'bg-blue-100 text-blue-700'
                }`}>
                  {conf.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}