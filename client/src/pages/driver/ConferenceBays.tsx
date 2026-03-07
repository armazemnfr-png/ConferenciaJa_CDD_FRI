import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Truck, CheckCircle, ChevronLeft } from 'lucide-react';

interface Item {
  id: number;
  mapNumber: string;
  bayNumber: string;
  sku: string;
  item: string; // mapped from description
  qtd: number; // mapped from expectedQuantity
  unitOfMeasure: string;
  isChecked: boolean;
  conferido: boolean; // duplicated for legacy compat
  bay_number: string;
  sequence: string;
}

const ConferenceBays = () => {
  const { mapNumber } = useParams();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);

  // 1. Cronômetro
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Busca de Dados
  useEffect(() => {
    const fetchItems = async () => {
      if (!mapNumber) return;
      try {
        setLoading(true);
        const driverCode = sessionStorage.getItem('driverId') || '';
        const response = await fetch(`/api/itens/${mapNumber.trim().toUpperCase()}?driverCode=${driverCode}`);
        if (!response.ok) throw new Error('Mapa não encontrado');
        const data = await response.json();
        setItems(data);
      } catch (error: any) {
        alert(`Erro: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [mapNumber]);

  const toggleItem = (id: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newChecked = !item.isChecked;
        fetch(`/api/wms-items/${id}`, { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isChecked: newChecked, checkedQuantity: newChecked ? item.qtd : 0 }) 
        }).catch(err => console.error("Erro ao salvar:", err));
        return { ...item, isChecked: newChecked, conferido: newChecked };
      }
      return item;
    }));
  };

  // Extrair baias dinamicamente
  const uniqueBays = Array.from(new Set(items.map(i => i.bay_number))).sort();
  const ajudanteBays = uniqueBays.filter(b => b.toUpperCase().includes('A'));
  const motoristaBays = uniqueBays.filter(b => b.toUpperCase().includes('M'));

  if (loading) return <div className="p-8 text-center font-bold text-blue-800">Carregando dados do caminhão...</div>;

  const getBayProgress = (bay: string) => {
    const bayItems = items.filter(i => i.bay_number === bay);
    const done = bayItems.filter(i => i.isChecked).length;
    return { done, total: bayItems.length };
  };

  // View de Itens da Baia
  if (selectedBay) {
    const bayItems = items
      .filter(i => i.bay_number === selectedBay)
      .sort((a, b) => (a.sequence || '').localeCompare(b.sequence || ''));
    
    const allDone = bayItems.every(i => i.isChecked);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-blue-700 text-white p-4 sticky top-0 z-10 flex items-center gap-4 shadow-md">
          <button onClick={() => setSelectedBay(null)} className="p-2 hover:bg-blue-600 rounded-full transition-colors"><ChevronLeft /></button>
          <div className="flex-1">
            <h2 className="font-black text-xl tracking-tight">Baia: {selectedBay}</h2>
            <p className="text-xs font-bold text-blue-200">MAPA: {mapNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-mono font-bold bg-blue-800 px-3 py-1 rounded-lg border border-blue-500">{formatTime(seconds)}</p>
          </div>
        </header>

        <main className="p-4 space-y-4 flex-1 overflow-auto">
          {bayItems.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-5 rounded-2xl shadow-sm border-2 transition-all cursor-pointer ${
                item.isChecked ? 'bg-green-50 border-green-500 shadow-green-100' : 'bg-white border-gray-100 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded border">SEQ: {item.sequence}</span>
                <span className="text-[10px] font-bold text-gray-400">SKU: {item.sku}</span>
              </div>
              <p className={`text-lg font-black leading-tight ${item.isChecked ? 'line-through text-green-700 opacity-60' : 'text-gray-900'}`}>
                {item.item}
              </p>
              <div className="flex justify-between items-end mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-blue-700 font-black text-3xl">{item.qtd}</span>
                  <span className="text-xs font-bold text-blue-400 uppercase">{item.unitOfMeasure}</span>
                </div>
                {item.isChecked && (
                  <div className="bg-green-500 text-white p-1 rounded-full shadow-lg shadow-green-200">
                    <CheckCircle size={24} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>

        {allDone && (
          <div className="p-4 bg-white border-t sticky bottom-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => {
                setSelectedBay(null);
                if (items.every(i => i.isChecked)) {
                  setLocation("/driver/login");
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl shadow-green-100"
            >
              <CheckCircle size={28} /> CONCLUIR BAIA
            </button>
          </div>
        )}
      </div>
    );
  }

  // View de Seleção de Baias (Caminhão)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-blue-800 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-700/30 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-yellow-400 p-1.5 rounded-lg shadow-lg">
                <Truck size={24} className="text-blue-900" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">
                ConfereJá
              </h1>
            </div>
            <p className="text-blue-100 font-bold text-sm bg-blue-700/50 px-3 py-1 rounded-full border border-blue-600 inline-block">
              MAPA: {mapNumber}
            </p>
          </div>
          <div className="bg-blue-900/80 px-4 py-2 rounded-2xl border-2 border-blue-600 shadow-inner">
            <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest text-center">Tempo</p>
            <p className="text-2xl font-mono font-black text-yellow-400">{formatTime(seconds)}</p>
          </div>
        </div>
      </header>

      <main className="p-4 flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* LADO AJUDANTE */}
          <div className="space-y-4">
            <h3 className="text-center font-black text-gray-400 text-[10px] tracking-[0.2em] uppercase border-b-4 border-yellow-400 pb-2">
              Lado Ajudante (A)
            </h3>
            <div className="grid gap-4">
              {ajudanteBays.map(bay => {
                const { done, total } = getBayProgress(bay);
                const isComplete = done === total && total > 0;
                return (
                  <button
                    key={bay}
                    onClick={() => setSelectedBay(bay)}
                    className={`group relative p-5 rounded-[2rem] border-4 text-left transition-all duration-300 ${
                      isComplete 
                        ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100' 
                        : 'bg-white border-gray-100 hover:border-blue-400 shadow-xl shadow-gray-200/50 active:scale-95'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-black text-2xl ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>{bay}</span>
                      {isComplete ? (
                        <div className="bg-green-500 text-white p-1 rounded-full"><CheckCircle size={18} /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ChevronLeft className="rotate-180" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-2">
                      <span className={isComplete ? 'text-green-600' : 'text-gray-400'}>Progresso</span>
                      <span className={isComplete ? 'text-green-600' : 'text-blue-600'}>{done}/{total}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`} 
                        style={{ width: `${(done/total)*100}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LADO MOTORISTA */}
          <div className="space-y-4">
            <h3 className="text-center font-black text-gray-400 text-[10px] tracking-[0.2em] uppercase border-b-4 border-blue-600 pb-2">
              Lado Motorista (M)
            </h3>
            <div className="grid gap-4">
              {motoristaBays.map(bay => {
                const { done, total } = getBayProgress(bay);
                const isComplete = done === total && total > 0;
                return (
                  <button
                    key={bay}
                    onClick={() => setSelectedBay(bay)}
                    className={`group relative p-5 rounded-[2rem] border-4 text-left transition-all duration-300 ${
                      isComplete 
                        ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100' 
                        : 'bg-white border-gray-100 hover:border-blue-400 shadow-xl shadow-gray-200/50 active:scale-95'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-black text-2xl ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>{bay}</span>
                      {isComplete ? (
                        <div className="bg-green-500 text-white p-1 rounded-full"><CheckCircle size={18} /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ChevronLeft className="rotate-180" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-2">
                      <span className={isComplete ? 'text-green-600' : 'text-gray-400'}>Progresso</span>
                      <span className={isComplete ? 'text-green-600' : 'text-blue-600'}>{done}/{total}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`} 
                        style={{ width: `${(done/total)*100}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {items.length > 0 && items.every(i => i.isChecked) && (
        <div className="p-6 bg-white border-t-2 border-blue-50 sticky bottom-0 shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => {
              setLocation("/driver/login");
            }}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 transition-all active:scale-95 uppercase tracking-tighter italic"
          >
            <CheckCircle size={32} strokeWidth={3} /> Finalizar Carga
          </button>
        </div>
      )}
    </div>
  );
};

export default ConferenceBays;
