import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDashboardMetrics, useConferences, useMetricsByRoom } from "@/hooks/use-conferences";
import DashboardFilters from "@/components/DashboardFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, PackageX, FileSpreadsheet, Loader2, BarChart3, Info, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

// Formatação para as métricas (que vêm em minutos decimais)
const formatFullTime = (minutes: number | undefined) => {
  if (!minutes || isNaN(minutes) || minutes === 0) return "00:00";

  // Transformamos o decimal (ex: 1.5 min) em segundos totais (90s)
  const totalSeconds = Math.floor(minutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    driverId: "",
    mapNumber: "",
  });

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(activeFilters);
  const { data: conferences, isLoading: confLoading } = useConferences(activeFilters);
  const { data: roomMetrics } = useMetricsByRoom();

  if (metricsLoading || confLoading) {
    return (
      <AdminLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, description, color }: any) => (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-muted-foreground font-medium text-sm">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm mt-4 text-muted-foreground font-medium">{description}</p>
    </div>
  );

  // Gráfico: uma barra por conferência concluída (últimas 15), com tempo em minutos decimais
  const chartData = conferences
    ?.filter(c => c.status === "completed" && c.startTime && c.endTime)
    .map(c => ({
      name: c.mapNumber,
      time: Number(((new Date(c.endTime!).getTime() - new Date(c.startTime!).getTime()) / 60000).toFixed(2)),
    }))
    .slice(-15) ?? [];

  // Formatador compartilhado para eixo Y e tooltip
  const formatMinutes = (value: number) => formatFullTime(value);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Visão Geral</h1>
            <p className="text-muted-foreground mt-1">Indicadores de performance da operação de conferência.</p>
          </div>
          {metrics?.totalConferences === 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 text-sm">
              <Info className="w-4 h-4" />
              Finalize uma conferência para gerar métricas.
            </div>
          )}
        </header>

        <DashboardFilters onFilter={(newFilters) => setActiveFilters(newFilters)} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Tempo Médio" 
            value={formatFullTime(metrics?.averageTimeMinutes)}
            icon={Clock}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            description="Minutos e Segundos"
          />
          <MetricCard 
            title="Divergências" 
            // Adicionamos o Number().toFixed(1) aqui para garantir a exibição
            value={`${Number(metrics?.divergencePercentage || 0).toFixed(1)}%`}
            icon={AlertTriangle}
            color="bg-orange-100 text-orange-600"
            description="Itens com erro de qtd"
          />
          <MetricCard 
            title="Avarias" 
            // Aplicamos o mesmo para Avarias por segurança
            value={`${Number(metrics?.damagePercentage || 0).toFixed(1)}%`}
            icon={PackageX}
            color="bg-red-100 text-red-600"
            description="Produtos danificados"
          />
          <MetricCard 
            title="Total Mapas" 
            value={metrics?.totalConferences || 0}
            icon={FileSpreadsheet}
            color="bg-green-100 text-green-600"
            description="Total no sistema"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance da Operação
            </h2>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatMinutes} tick={{ fontSize: 11 }} width={48} />
                    <RechartsTooltip
                      formatter={(value: number) => [formatMinutes(value), "Tempo"]}
                      labelFormatter={(label) => `Mapa: ${label}`}
                    />
                    <Bar dataKey="time" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                  Aguardando dados...
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col max-h-[500px]">
            <h2 className="font-display font-bold text-xl mb-6">Status das Cargas</h2>
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {conferences?.map(conf => (
                <div key={conf.id} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-foreground">Mapa {conf.mapNumber}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                      conf.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {conf.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex justify-between font-mono">
                    <span>Mot: {conf.driverId || "539"}</span>
                    <span>{conf.startTime ? format(new Date(conf.startTime), "HH:mm:ss") : '--:--:--'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico por Sala */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="font-display font-bold text-xl mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Tempo Médio de Conferência por Sala
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Média calculada cruzando matrícula do motorista com a base de salas. Apenas conferências finalizadas.
          </p>

          {roomMetrics && roomMetrics.length > 0 ? (
            <div className="space-y-4">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {roomMetrics.map((r) => (
                  <div key={r.room} className="bg-muted/30 rounded-xl p-4 border border-border">
                    <p className="text-xs font-bold uppercase text-muted-foreground truncate">{r.room}</p>
                    <p className="text-2xl font-mono font-bold text-accent mt-1">{formatFullTime(r.avgMinutes)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.count} conferência{r.count !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>

              {/* Gráfico de barras por sala */}
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomMetrics} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="room" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatMinutes} tick={{ fontSize: 11 }} width={52} />
                    <RechartsTooltip
                      formatter={(value: number, _name: string, props: any) => [
                        formatMinutes(value),
                        `Média (${props.payload.count} conf.)`
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="avgMinutes" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed gap-2">
              <Building2 className="w-8 h-8 opacity-30" />
              <p className="text-sm">Faça o upload da Base Matrícula (Motoristas) para ver os dados por sala.</p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}