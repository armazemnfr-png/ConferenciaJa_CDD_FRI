import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDashboardMetrics, useConferences } from "@/hooks/use-conferences";
import DashboardFilters from "@/components/DashboardFilters"; // Certifique-se de que o arquivo existe
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, PackageX, FileSpreadsheet, Loader2, BarChart3, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  // Estado para armazenar os filtros selecionados
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    driverId: "",
    mapNumber: "",
  });

  // No seu Dashboard.tsx, altere as chamadas dos hooks para:
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(activeFilters);
  const { data: conferences, isLoading: confLoading } = useConferences(activeFilters);

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

  const chartData = [
    { name: "Média Atual", time: metrics?.averageTimeMinutes || 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Cabeçalho */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Visão Geral</h1>
            <p className="text-muted-foreground mt-1">Indicadores de performance para Gestão de TML.</p>
          </div>
          {metrics?.totalConferences === 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 text-sm">
              <Info className="w-4 h-4" />
              Finalize uma conferência para gerar métricas.
            </div>
          )}
        </header>

        {/* --- BARRA DE FILTROS INTEGRADA --- */}
        <DashboardFilters 
          onFilter={(newFilters) => {
            setActiveFilters(newFilters);
            console.log("Filtros ativos para busca:", newFilters);
            // Aqui o React Query detectará a mudança de estado e recarregará os dados
          }} 
        />

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Tempo Médio" 
            value={`${metrics?.averageTimeMinutes || 0} min`}
            icon={Clock}
            color="bg-blue-100 text-blue-600"
            description="Conferências finalizadas"
          />
          <MetricCard 
            title="Divergências" 
            value={`${metrics?.divergencePercentage || 0}%`}
            icon={AlertTriangle}
            color="bg-orange-100 text-orange-600"
            description="Itens com erro de qtd"
          />
          <MetricCard 
            title="Avarias" 
            value={`${metrics?.damagePercentage || 0}%`}
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
          {/* Gráfico */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance da Operação
            </h2>
            <div className="h-[300px] w-full">
              {metrics?.totalConferences && metrics.totalConferences > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="time" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                  Aguardando dados filtrados...
                </div>
              )}
            </div>
          </div>

          {/* Lista Lateral */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col max-h-[500px]">
            <h2 className="font-display font-bold text-xl mb-6">Status das Cargas</h2>
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {conferences && conferences.length > 0 ? (
                conferences.map(conf => (
                  <div key={conf.id} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-foreground">Mapa {conf.mapNumber}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                        conf.status === 'completed' ? 'bg-green-100 text-green-700' :
                        conf.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                      }`}>
                        {conf.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>Mot: {conf.driverId || "N/A"}</span>
                      <span>
                        {conf.startTime ? format(new Date(conf.startTime), "HH:mm", { locale: ptBR }) : '--:--'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">Nenhuma carga encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}