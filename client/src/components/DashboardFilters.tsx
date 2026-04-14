import React, { useState, useEffect } from "react";
import { Search, Calendar, User, Map as MapIcon, FilterX } from "lucide-react";

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export default function DashboardFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const [filters, setFilters] = useState({
    startDate: todayStr(),
    endDate: todayStr(),
    driverId: "",
    mapNumber: "",
  });

  // Aplica o filtro de hoje automaticamente ao montar
  useEffect(() => {
    onFilter(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    const cleared = { startDate: "", endDate: "", driverId: "", mapNumber: "" };
    setFilters(cleared);
    onFilter(cleared);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
      {/* Filtro por Período */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Calendar size={14} /> PERÍODO
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-2"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-2"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Filtro por Motorista */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <User size={14} /> MOTORISTA (MATRÍCULA)
        </label>
        <input
          type="text"
          placeholder="Ex: 539"
          className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-3"
          value={filters.driverId}
          onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
        />
      </div>

      {/* Filtro por Mapa */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <MapIcon size={14} /> NÚMERO DO MAPA
        </label>
        <input
          type="text"
          placeholder="Ex: 222999"
          className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-3"
          value={filters.mapNumber}
          onChange={(e) => setFilters({ ...filters, mapNumber: e.target.value })}
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="bg-blue-600 text-white px-6 h-10 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Search size={16} /> FILTRAR
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-100 text-gray-600 px-3 h-10 rounded-lg font-bold text-sm hover:bg-gray-200 transition"
          title="Limpar Filtros"
        >
          <FilterX size={16} />
        </button>
      </div>
    </div>
  );
}