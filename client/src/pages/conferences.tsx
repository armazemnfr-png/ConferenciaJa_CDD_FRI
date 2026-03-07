import { AdminLayout } from "@/components/layout/AdminLayout";
import { useConferences } from "@/hooks/use-conferences";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, AlertTriangle, PackageX, CheckCircle2, Clock } from "lucide-react";

export default function ConferencesHistory() {
  const [filters, setFilters] = useState({
    search: "",
    hasDivergence: "all",
    hasDamage: "all"
  });

  const { data: conferences, isLoading } = useConferences();

  const filteredData = conferences?.filter(conf => {
    const matchesSearch = conf.mapNumber.includes(filters.search) || 
                         (conf.driverId && conf.driverId.includes(filters.search));

    // Aqui simulamos a lógica que vamos refinar no banco
    const matchesDivergence = filters.hasDivergence === "all" ? true : 
                             filters.hasDivergence === "yes" ? conf.status === 'completed' : false; 

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Histórico de Conferências</h1>
          <p className="text-muted-foreground">Rastreabilidade completa de TML e ocorrências.</p>
        </div>

        {/* Barra de Filtros Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Mapa ou Matrícula..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <Select onValueChange={(v) => setFilters({...filters, hasDivergence: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Divergência?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="yes">Com Divergência</SelectItem>
              <SelectItem value="no">Sem Divergência</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setFilters({...filters, hasDamage: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Avarias?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="yes">Com Avaria</SelectItem>
              <SelectItem value="no">Sem Avaria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Mapa</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>TML (Min)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alertas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData?.map((conf) => {
                const duration = conf.endTime && conf.startTime 
                  ? differenceInMinutes(new Date(conf.endTime), new Date(conf.startTime)) 
                  : "-";

                return (
                  <TableRow key={conf.id}>
                    <TableCell className="font-bold">#{conf.mapNumber}</TableCell>
                    <TableCell className="text-sm">{conf.driverId || "N/A"}</TableCell>
                    <TableCell className="text-sm">
                      {conf.startTime ? format(new Date(conf.startTime), "dd/MM HH:mm", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={Number(duration) > 20 ? "text-orange-600 font-bold" : ""}>
                          {duration} min
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={conf.status === 'completed' ? "default" : "secondary"}>
                        {conf.status === 'completed' ? 'Finalizado' : 'Em curso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Mock de ícones - no próximo passo vinculamos ao banco real */}
                        <AlertTriangle className="w-4 h-4 text-orange-400 opacity-20" title="Divergência" />
                        <PackageX className="w-4 h-4 text-red-400 opacity-20" title="Avaria" />
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}