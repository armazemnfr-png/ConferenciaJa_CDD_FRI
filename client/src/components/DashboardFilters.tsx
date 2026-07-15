import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Search, User, Map as MapIcon, FilterX } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function DashboardFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const today = new Date();
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(today, 6),
    to: today,
  });
  const [open, setOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [mapNumber, setMapNumber] = useState("");

  // Aplica automaticamente ao montar e quando o período muda
  useEffect(() => {
    onFilter({
      startDate: range?.from ? toYMD(range.from) : "",
      endDate: range?.to ? toYMD(range.to) : "",
      driverId,
      mapNumber,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleApply = () => {
    onFilter({
      startDate: range?.from ? toYMD(range.from) : "",
      endDate: range?.to ? toYMD(range.to) : "",
      driverId,
      mapNumber,
    });
  };

  const handleClear = () => {
    setRange({ from: subDays(today, 6), to: today });
    setDriverId("");
    setMapNumber("");
    onFilter({ startDate: toYMD(subDays(today, 6)), endDate: toYMD(today), driverId: "", mapNumber: "" });
  };

  const rangeLabel = () => {
    if (!range?.from) return "Selecionar período";
    if (!range.to) return format(range.from, "dd/MM/yyyy", { locale: ptBR });
    return `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
      {/* Seletor de período com calendário */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <CalendarIcon size={14} /> PERÍODO
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              data-testid="button-period-picker"
              className="w-full bg-gray-50 rounded-lg text-sm h-10 px-3 text-left flex items-center gap-2 text-gray-700 hover:bg-gray-100 transition"
            >
              <CalendarIcon size={14} className="text-gray-400 shrink-0" />
              <span className={range?.from ? "text-gray-800" : "text-gray-400"}>
                {rangeLabel()}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(newRange) => {
                setRange(newRange);
                if (newRange?.from && newRange?.to) setOpen(false);
              }}
              locale={ptBR}
              numberOfMonths={2}
              defaultMonth={range?.from}
              disabled={{ after: today }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Filtro por Motorista */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <User size={14} /> MOTORISTA (MATRÍCULA)
        </label>
        <input
          type="text"
          placeholder="Ex: 539"
          data-testid="input-driver-id"
          className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-3"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
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
          data-testid="input-map-number"
          className="w-full bg-gray-50 border-none rounded-lg text-sm h-10 px-3"
          value={mapNumber}
          onChange={(e) => setMapNumber(e.target.value)}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        <button
          data-testid="button-filter-apply"
          onClick={handleApply}
          className="bg-blue-600 text-white px-6 h-10 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Search size={16} /> FILTRAR
        </button>
        <button
          data-testid="button-filter-clear"
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
