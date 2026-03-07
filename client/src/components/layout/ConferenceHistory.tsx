import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDashboardMetrics, useConferences } from "@/hooks/use-conferences";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, PackageX, FileSpreadsheet, Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
// AJUSTADO: Caminho exato para a nova pasta que você criou
import ConferenceHistory from "@/components/layout/ConferenceHistory";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: conferences, isLoading: confLoading } = useConferences();

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
    { name: "Seg", time: metrics?.averageTimeMinutes || 45 },
    { name: "Ter", time: (metrics?.averageTimeMinutes || 45) * 1.1 },
    { name: "Qua", time: (metrics?.averageTimeMinutes || 45) * 0.9 },
    { name: "Qui", time: (metrics?.averageTimeMinutes || 45) * 1.2 },
    { name: "Sex", time: (metrics?.averageTimeMinutes || 45) * 0.8 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">

        <header>
          <h1 className="text-3xl font-display font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Acompanhe os indicadores de performance da equipe.</p>
        </header>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Tempo Médio" 
            value={`${Math.round(metrics?.averageTimeMinutes || 0)} min`}
            icon={Clock}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            description="Por conferência de mapa"
          />
          <MetricCard 
            title="Divergências" 
            value={`${metrics?.divergencePercentage || 0}%`}
            icon={AlertTriangle}
            color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            description="Contagens parciais vs esperado"
          />
          <MetricCard 
            title="Avarias" 
            value={`${metrics?.damagePercentage || 0}%`}
            icon={PackageX}
            color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            description="Itens reportados com dano"
          />
          <MetricCard 
            title="Total Mapas" 
            value={metrics?.totalConferences || 0}
            icon={FileSpreadsheet}
            color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            description="Conferências finalizadas hoje"
          />
        </div>

        {/* Charts & History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Chart */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Tempo de Conferência (Semana)
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                  <RechartsTooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="time" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Histórico detalhado ocupando a largura total */}
          <div className="lg:col-span-3">
             <ConferenceHistory />
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}