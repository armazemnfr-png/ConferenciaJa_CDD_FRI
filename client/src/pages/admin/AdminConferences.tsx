import { AdminLayout } from "@/components/layout/AdminLayout";
import { useConferences, useDrivers } from "@/hooks/use-conferences";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, AlertTriangle, PackageX, CheckCircle2, Clock, Filter, Trash2 } from "lucide-react"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ConferencesHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const d0 = new Date();
  const todayStr = `${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`;

  // Estado dos campos
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("all");
  const [dmgFilter, setDmgFilter] = useState("all");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Estado dos filtros ATIVOS — já inicializa com hoje
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    div: "all",
    dmg: "all",
    start: todayStr,
    end: todayStr
  });

  const { data: conferences } = useConferences();
  const { data: drivers } = useDrivers();

  // Mapa rápido: matrícula → { nome, sala }
  const driverMap = useMemo(() => {
    const m = new Map<string, { name: string; room: string }>();
    drivers?.forEach(d => m.set(d.registration.trim(), { name: d.name, room: d.room }));
    return m;
  }, [drivers]);

  // Lógica de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conferences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-metrics"] });
      toast({
        title: "Sucesso",
        description: "Mapa removido do histórico.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o mapa.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (id: number, mapNumber: string) => {
    if (confirm(`Deseja realmente excluir o Mapa #${mapNumber}? Isso limpará os dados do Dashboard.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilter = () => {
    setAppliedFilters({
      search: search,
      div: divFilter,
      dmg: dmgFilter,
      start: startDate,
      end: endDate
    });
  };

  const filteredData = useMemo(() => {
    if (!conferences) return [];

    return conferences.filter(conf => {
      const matchesSearch = conf.mapNumber.toLowerCase().includes(appliedFilters.search.toLowerCase()) || 
                           (conf.driverId && conf.driverId.toLowerCase().includes(appliedFilters.search.toLowerCase()));

      const hasDiv = conf.hasDivergence === true || conf.hasDivergence === 1;
      const matchesDiv = appliedFilters.div === "all" ? true : 
                        appliedFilters.div === "yes" ? hasDiv : !hasDiv;

      const hasDmg = conf.hasDamage === true || conf.hasDamage === 1;
      const matchesDmg = appliedFilters.dmg === "all" ? true : 
                        appliedFilters.dmg === "yes" ? hasDmg : !hasDmg;

      const confDate = (() => {
        if (!conf.startTime) return null;
        const d = new Date(conf.startTime);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })();
      const matchesStart = !appliedFilters.start || (confDate && confDate >= appliedFilters.start);
      const matchesEnd = !appliedFilters.end || (confDate && confDate <= appliedFilters.end);

      return matchesSearch && matchesDiv && matchesDmg && matchesStart && matchesEnd;
    });
  }, [conferences, appliedFilters]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Histórico de Conferências</h1>
          <p className="text-slate-500">Consulte conferências finalizadas e ocorrências.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm items-end">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1">Mapa ou Matrícula</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Ex: 12345..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1">Início</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1">Fim</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1">Divergência</label>
            <Select value={divFilter} onValueChange={setDivFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="yes">Com Erro</SelectItem>
                <SelectItem value="no">Sem Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1">Avaria</label>
            <Select value={dmgFilter} onValueChange={setDmgFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="yes">Com Avaria</SelectItem>
                <SelectItem value="no">Sem Avaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter} className="flex-1 gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={() => {
              setSearch(""); setDivFilter("all"); setDmgFilter("all");
              setStartDate(""); setEndDate("");
              setAppliedFilters({ search: "", div: "all", dmg: "all", start: "", end: "" });
            }} className="px-3" title="Limpar filtros">
              <Trash2 className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Mapa</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-center">Ocorrências</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 opacity-30" />
                      <p className="font-semibold">Nenhuma conferência encontrada</p>
                      <p className="text-sm">Ajuste o período ou limpe os filtros para ver o histórico completo.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filteredData.map((conf) => {
                const hasDiv = conf.hasDivergence === true || conf.hasDivergence === 1;
                const hasDmg = conf.hasDamage === true || conf.hasDamage === 1;
                const isClean = conf.status === 'completed' && !hasDiv && !hasDmg;

                const startTime = conf.startTime ? new Date(conf.startTime) : null;
                const endTime = conf.endTime ? new Date(conf.endTime) : null;
                let durationText = "-";
                if (startTime && endTime) {
                  const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
                  durationText = `${Math.floor(diff/60)}m ${diff%60}s`;
                }

                return (
                  <TableRow key={conf.id}>
                    <TableCell className="font-bold">#{conf.mapNumber}</TableCell>
                    <TableCell>
                      {(() => {
                        const info = driverMap.get(conf.driverId?.trim() ?? "");
                        return info ? (
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{info.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{conf.driverId} · {info.room}</p>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500 text-sm">{conf.driverId || "---"}</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {conf.startTime ? format(new Date(conf.startTime), "dd/MM/yy HH:mm", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        {durationText}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-6">
                        <AlertTriangle className={`w-5 h-5 ${hasDiv ? "text-orange-500" : "opacity-10"}`} />
                        <PackageX className={`w-5 h-5 ${hasDmg ? "text-red-500" : "opacity-10"}`} />
                        <CheckCircle2 className={`w-5 h-5 ${isClean ? "text-green-500" : "opacity-10"}`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(conf.id, conf.mapNumber)}
                        className="text-slate-300 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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