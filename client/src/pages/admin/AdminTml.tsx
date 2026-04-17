import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Calendar, Clock, Users, Filter, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import type { TmlRecord } from "@shared/schema";

function minToHMS(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  const s = Math.round((min - Math.floor(min)) * 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseDisplayDate(dtOper: string): Date | null {
  if (!dtOper) return null;
  const m = dtOper.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const COLORS = {
  matinal: "#3b82f6",
  matinalPatio: "#f59e0b",
  checklist: "#10b981",
  patioPortaria: "#8b5cf6",
};

const METRIC_COLORS = [
  { bg: "bg-blue-600", text: "text-white", label: "TML Total", key: "tmlMin" as const },
  { bg: "bg-blue-500", text: "text-white", label: "Matinal", key: "matinalMin" as const },
  { bg: "bg-amber-500", text: "text-white", label: "Matinal → Pátio", key: "matinalPatioMin" as const },
  { bg: "bg-emerald-500", text: "text-white", label: "Checklist", key: "checklistMin" as const },
  { bg: "bg-violet-500", text: "text-white", label: "Pátio → Portaria", key: "patioPortariaMin" as const },
];

export default function AdminTml() {
  const [filterSala, setFilterSala] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: rawData = [], isLoading } = useQuery<TmlRecord[]>({
    queryKey: ["/api/tml"],
  });

  const salas = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => { if (r.sala && r.sala !== "–") set.add(r.sala.toUpperCase()); });
    return Array.from(set).sort();
  }, [rawData]);

  const filtered = useMemo(() => {
    return rawData.filter(r => {
      if (filterSala !== "all" && r.sala.toUpperCase() !== filterSala) return false;
      const d = parseDisplayDate(r.dtOper);
      if (!d) return true;
      const ds = localDateStr(d);
      if (startDate && ds < startDate) return false;
      if (endDate && ds > endDate) return false;
      return true;
    });
  }, [rawData, filterSala, startDate, endDate]);

  const avg = (key: keyof TmlRecord) =>
    filtered.length > 0
      ? filtered.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) / filtered.length
      : 0;

  const donutData = [
    { name: "Matinal", value: Math.round(avg("matinalMin") * 10) / 10, fill: COLORS.matinal },
    { name: "Matinal→Pátio", value: Math.round(avg("matinalPatioMin") * 10) / 10, fill: COLORS.matinalPatio },
    { name: "Checklist", value: Math.round(avg("checklistMin") * 10) / 10, fill: COLORS.checklist },
    { name: "Pátio→Portaria", value: Math.round(avg("patioPortariaMin") * 10) / 10, fill: COLORS.patioPortaria },
  ].filter(d => d.value > 0);

  const barData = useMemo(() => {
    const byDate = new Map<string, { matinalMin: number; matinalPatioMin: number; checklistMin: number; patioPortariaMin: number; count: number }>();
    filtered.forEach(r => {
      const d = parseDisplayDate(r.dtOper);
      const key = d ? `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}` : r.dtOper;
      const cur = byDate.get(key) || { matinalMin: 0, matinalPatioMin: 0, checklistMin: 0, patioPortariaMin: 0, count: 0 };
      byDate.set(key, {
        matinalMin: cur.matinalMin + r.matinalMin,
        matinalPatioMin: cur.matinalPatioMin + r.matinalPatioMin,
        checklistMin: cur.checklistMin + r.checklistMin,
        patioPortariaMin: cur.patioPortariaMin + r.patioPortariaMin,
        count: cur.count + 1,
      });
    });
    return Array.from(byDate.entries())
      .map(([date, v]) => ({
        date,
        Matinal: Math.round(v.matinalMin / v.count),
        "Matinal→Pátio": Math.round(v.matinalPatioMin / v.count),
        Checklist: Math.round(v.checklistMin / v.count),
        "Pátio→Portaria": Math.round(v.patioPortariaMin / v.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TML — Tempo de Manhã de Loja</h1>
          <p className="text-sm text-gray-500 mt-1">Análise dos tempos de operação matinal por mapa</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {METRIC_COLORS.map(card => (
            <div key={card.key} className={`${card.bg} rounded-xl p-4 flex flex-col gap-1`} data-testid={`tml-card-${card.key}`}>
              <span className="text-xs font-medium text-white/80 uppercase tracking-wide">{card.label}</span>
              <span className="text-2xl font-bold text-white font-mono">
                {isLoading ? "–" : minToHMS(avg(card.key))}
              </span>
              <span className="text-xs text-white/70">{filtered.length} mapas</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterSala} onValueChange={setFilterSala}>
            <SelectTrigger className="w-44" data-testid="filter-sala">
              <SelectValue placeholder="Todas as salas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {salas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input type="date" className="w-36 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="filter-start-date" />
            <span className="text-gray-400 text-sm">–</span>
            <Input type="date" className="w-36 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} data-testid="filter-end-date" />
          </div>
          {(filterSala !== "all" || startDate || endDate) && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => { setFilterSala("all"); setStartDate(""); setEndDate(""); }}>
              Limpar filtros
            </Badge>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Composição média do TML</h2>
            {donutData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${minToHMS(v)}`, ""]} />
                  <Legend iconType="circle" formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar chart stacked */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">TML médio por data (min)</h2>
            {barData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} min`, ""]} />
                  <Legend iconType="circle" formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                  <Bar dataKey="Matinal" stackId="a" fill={COLORS.matinal} />
                  <Bar dataKey="Matinal→Pátio" stackId="a" fill={COLORS.matinalPatio} />
                  <Bar dataKey="Checklist" stackId="a" fill={COLORS.checklist} />
                  <Bar dataKey="Pátio→Portaria" stackId="a" fill={COLORS.patioPortaria} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Detalhamento por mapa</h2>
            <span className="text-xs text-gray-400">{filtered.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Mapa</th>
                  <th className="px-4 py-3 text-left">Motorista</th>
                  <th className="px-4 py-3 text-left">Sala</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Matinal</th>
                  <th className="px-4 py-3 text-right">Mat→Pát</th>
                  <th className="px-4 py-3 text-right">Checklist</th>
                  <th className="px-4 py-3 text-right">Pát→Port</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-700">TML</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Nenhum registro encontrado</td></tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50" data-testid={`tml-row-${i}`}>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{r.mapa}</td>
                      <td className="px-4 py-3 text-gray-600">{r.nome || r.motorista}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{r.sala}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.dtOper}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600">{minToHMS(r.matinalMin)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{minToHMS(r.matinalPatioMin)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{minToHMS(r.checklistMin)}</td>
                      <td className="px-4 py-3 text-right font-mono text-violet-600">{minToHMS(r.patioPortariaMin)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{minToHMS(r.tmlMin)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
