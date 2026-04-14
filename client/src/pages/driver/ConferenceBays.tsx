import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Truck, CheckCircle, ChevronLeft, User, ChevronRight, AlertTriangle, Hash, Box, Clock, Map } from 'lucide-react';

interface Item {
  id: number;
  mapNumber: string;
  bayNumber: string;
  item: string;
  qtd: number;
  unitOfMeasure: string;
  isChecked: boolean;
  conferido: boolean;
  bay_number: string;
  sequence: string;
  qtd_contada?: number; 
  temAvaria?: boolean;   
}

const ConferenceBays = () => {
  const { mapNumber } = useParams();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [tempQuantity, setTempQuantity] = useState('');

  // Timer de conferência
  useEffect(() => {
    if (showSuccessScreen) return;
    const timer = setInterval(() => setSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [showSuccessScreen]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchItems = async () => {
      if (!mapNumber) return;
      try {
        setLoading(true);
        const driverCode = sessionStorage.getItem('driverId') || '';
        const response = await fetch(`/api/itens/${mapNumber.trim().toUpperCase()}?driverCode=${driverCode}`);
        if (!response.ok) throw new Error('Mapa não encontrado');
        const data = await response.json();
        setItems(data || []);
      } catch (error: any) {
        console.error("Erro ao buscar itens:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [mapNumber]);

  const saveToDatabase = async (id: number, data: any) => {
    try {
      await fetch(`/api/wms-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    }
  };

  const toggleItem = (id: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newChecked = !item.isChecked;
        const hasExplicitPartialCount = item.qtd_contada !== undefined && item.qtd_contada !== null && item.qtd_contada > 0;
        const finalQty = newChecked
          ? (hasExplicitPartialCount ? item.qtd_contada : item.qtd)
          : undefined;
        saveToDatabase(id, { isChecked: newChecked, checkedQuantity: finalQty });
        return { ...item, isChecked: newChecked, conferido: newChecked, qtd_contada: newChecked ? finalQty : undefined };
      }
      return item;
    }));
  };

  const openPartialContagem = (item: Item) => {
    setActiveItem(item);
    setTempQuantity(item.qtd_contada?.toString() || ''); 
    setIsPartialModalOpen(true);
  };

  const savePartialCount = () => {
    if (!activeItem) return;
    const qty = tempQuantity === '' ? 0 : parseInt(tempQuantity);
    setItems(prev => prev.map(i => {
      if (i.id === activeItem.id) {
        saveToDatabase(i.id, { checkedQuantity: qty, isChecked: true });
        return { ...i, isChecked: true, conferido: true, qtd_contada: qty };
      }
      return i;
    }));
    setIsPartialModalOpen(false);
    setActiveItem(null);
  };

  const toggleAvaria = (id: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newAvaria = !item.temAvaria;
        saveToDatabase(id, { hasDamage: newAvaria });
        return { ...item, temAvaria: newAvaria };
      }
      return item;
    }));
  };

  const getSmartLabel = (rawName: string) => {
    if (!rawName) return '';
    const parts = rawName.split('_');
    return `${parts[1] || ''}${(parts[0] || '').replace('P', '').padStart(2, '0')}`;
  };

  const uniqueBays = Array.from(new Set(items.map(i => i.bay_number))).sort();
  const ajudanteBays = uniqueBays.filter(b => b && b.split('_')[1] === 'A');
  const motoristaBays = uniqueBays.filter(b => b && b.split('_')[1] === 'M');

  const getBayProgress = (bay: string) => {
    const bayItems = items.filter(i => i.bay_number === bay);
    return { done: bayItems.filter(i => i.isChecked).length, total: bayItems.length };
  };

  const totalDone = items.filter(i => i.isChecked).length;
  const totalItems = items.length;
  const globalPercent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Lógica corrigida para finalizar a carga no Banco de Dados e no Dashboard
  const handleFinalizeCarga = async () => {
    try {
      // 1. Buscamos a conferência atual para este mapa
      // Como o motorista entrou pelo mapa, precisamos avisar ao servidor que ESSE mapa terminou.
      const response = await fetch(`/api/conferences/finish-by-map/${mapNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        // 2. Se o banco de dados salvou com sucesso, mostramos a tela verde
        setShowSuccessScreen(true);

        // 3. Redireciona após o tempo visual
        setTimeout(() => {
          setLocation("/driver/login");
        }, 4500); 
      } else {
        const errorData = await response.json();
        alert(`Erro ao finalizar: ${errorData.message || 'Tente novamente'}`);
      }
    } catch (error) {
      console.error("Erro na comunicação com o servidor:", error);
      alert("Erro de conexão ao finalizar a carga.");
    }
  };

  // --- TELA VERDE DE CONFERÊNCIA FINALIZADA ---
  if (showSuccessScreen) {
    return (
      <div className="fixed inset-0 bg-[#27AE60] z-[200] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-500">
        <div className="mb-8 animate-bounce">
          <CheckCircle size={120} strokeWidth={3} />
        </div>
        <h1 className="text-5xl font-black uppercase mb-4 tracking-tighter">Conferência Finalizada!</h1>
        <p className="text-green-100 text-lg font-bold uppercase mb-12 opacity-80">Carga verificada com sucesso</p>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20">
            <div className="flex items-center justify-center gap-3 mb-1 text-green-200 uppercase text-xs font-black">
              <Map size={16}/> Mapa de Carga
            </div>
            <p className="text-3xl font-black tracking-tight">{mapNumber}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20">
            <div className="flex items-center justify-center gap-3 mb-1 text-green-200 uppercase text-xs font-black">
              <Clock size={16}/> Tempo Total
            </div>
            <p className="text-3xl font-black tracking-tight">{formatTime(seconds)}</p>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-3 text-green-100/60 font-bold uppercase text-sm italic">
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          Redirecionando para login...
        </div>
      </div>
    );
  }

  if (selectedBay) {
    const bayItems = items.filter(i => i.bay_number === selectedBay).sort((a, b) => (a.sequence || '').localeCompare(b.sequence || ''));
    const allDone = bayItems.length > 0 && bayItems.every(i => i.isChecked);

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <header className="bg-[#0264B4] text-white p-5 sticky top-0 z-50 flex items-center gap-4 shadow-lg">
          <button onClick={() => setSelectedBay(null)} className="p-2 bg-white/10 rounded-xl"><ChevronLeft size={28}/></button>
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase">Palete {getSmartLabel(selectedBay)}</h1>
            <p className="text-[10px] font-bold text-blue-200">MAPA: {mapNumber}</p>
          </div>
          <div className="bg-blue-900/50 px-3 py-1.5 rounded-xl border border-blue-400/30">
            <p className="text-lg font-mono font-black">{formatTime(seconds)}</p>
          </div>
        </header>

        <main className="p-4 space-y-4 flex-1 overflow-auto max-w-2xl mx-auto w-full pb-32">
          {bayItems.map((item, index) => {
            const isDivergent = item.isChecked && item.qtd_contada !== undefined && item.qtd_contada !== item.qtd;
            return (
              <div key={item.id} className={`p-5 rounded-[2rem] border-2 transition-all relative shadow-sm ${isDivergent ? 'bg-[#FFFBEB] border-[#FCD34D]' : item.isChecked ? 'bg-[#E8F8F0] border-[#58D68D]' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 mb-3 items-center">
                  <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">Item {index + 1}</span>
                </div>
                <p className={`text-lg font-black leading-tight uppercase mb-4 pr-16 ${item.isChecked ? (isDivergent ? 'text-amber-900' : 'text-[#1B5E20]') : 'text-slate-800'}`}>{item.item}</p>
                <div className="flex flex-col gap-2 mb-5">
                  <div className={`flex items-center gap-2 font-black ${item.isChecked ? (isDivergent ? 'text-amber-600' : 'text-green-700') : 'text-[#0264B4]'}`}>
                    <Box size={22} strokeWidth={2.5}/>
                    <span className="text-3xl tracking-tighter">{item.qtd}</span>
                    <span className="text-xs uppercase mt-2">{item.unitOfMeasure}</span>
                  </div>
                  {item.qtd_contada !== undefined && (
                    <div className={`flex items-center gap-1.5 font-black text-xs uppercase ${isDivergent ? 'text-amber-600' : 'text-green-600'}`}>
                       {isDivergent ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} Contado: {item.qtd_contada}
                    </div>
                  )}
                  {item.temAvaria && <div className="flex items-center gap-1.5 text-red-600 font-black text-xs uppercase bg-red-50 p-1.5 rounded-lg border border-red-100 w-fit">🚫 Produto Avariado: SIM</div>}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={() => openPartialContagem(item)} className="bg-slate-50 text-slate-700 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-100 flex items-center justify-center gap-1"><Hash size={14}/> Contagem Parcial</button>
                  <button onClick={() => toggleAvaria(item.id)} className={`py-3 rounded-2xl font-black text-[10px] uppercase border flex items-center justify-center gap-1 ${item.temAvaria ? 'bg-red-600 text-white border-red-700' : 'bg-[#FDF2F2] text-[#E74C3C] border-red-100'}`}><AlertTriangle size={14}/> {item.temAvaria ? 'Avaria: SIM' : 'Relatar Avaria'}</button>
                </div>
                <button onClick={() => toggleItem(item.id)} className={`absolute top-6 right-5 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg ${isDivergent ? 'bg-amber-400 border-amber-400 text-white' : item.isChecked ? 'bg-[#2ECC71] border-[#2ECC71] text-white' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                  {isDivergent ? <AlertTriangle size={32} strokeWidth={3} /> : <CheckCircle size={32} strokeWidth={3} />}
                </button>
              </div>
            );
          })}
        </main>

        {isPartialModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-t-8 border-[#0264B4] animate-in slide-in-from-bottom">
              <h3 className="text-2xl font-black uppercase text-slate-800 mb-2">Contagem Parcial</h3>
              <p className="text-slate-500 text-sm font-bold mb-6 uppercase">{activeItem?.item}</p>
              <input type="number" inputMode="numeric" autoFocus value={tempQuantity} onChange={(e) => setTempQuantity(e.target.value)} className="w-full text-5xl font-black text-center py-6 bg-slate-50 rounded-3xl border-2 border-blue-100 text-[#0264B4] mb-6 focus:outline-none" placeholder="0" />
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsPartialModalOpen(false)} className="py-4 rounded-2xl font-black uppercase text-slate-400 bg-slate-100">Cancelar</button>
                <button onClick={savePartialCount} className="py-4 rounded-2xl font-black uppercase text-white bg-blue-600">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 bg-white border-t-2 sticky bottom-0 z-30">
          <button onClick={() => setSelectedBay(null)} className={`w-full py-5 rounded-[2rem] font-black text-xl uppercase flex items-center justify-center gap-3 transition-all ${allDone ? 'bg-[#27AE60] text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`} disabled={!allDone}>
            <CheckCircle size={24} strokeWidth={3} /> Voltar aos Paletes ✅
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans">
      <header className="bg-white p-6 border-b-2 border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-end mb-4">
          <div><h2 className="text-[#1E293B] font-black text-xl uppercase tracking-tighter">Progresso Total</h2><p className="text-[#64748B] text-xs font-bold uppercase">{totalDone} de {totalItems} itens</p></div>
          <span className="text-[#2563EB] font-black text-4xl tracking-tighter">{globalPercent}%</span>
        </div>
        <div className="max-w-md mx-auto w-full h-4 bg-slate-100 rounded-full p-1"><div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${globalPercent}%` }} /></div>
      </header>
      <main className="p-4 grid grid-cols-2 gap-4 max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#2563EB] font-black text-xs uppercase px-2 mb-2"><User size={18} strokeWidth={3}/> Ajudante</div>
          {ajudanteBays.map(bay => {
            const { done, total } = getBayProgress(bay);
            const isComplete = done === total && total > 0;
            const label = getSmartLabel(bay);
            return (
              <button key={bay} onClick={() => setSelectedBay(bay)} className={`w-full p-4 rounded-[2rem] border-2 text-left shadow-sm active:scale-95 transition-all ${isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${isComplete ? 'bg-green-500 text-white' : 'bg-blue-50 text-[#0264B4]'}`}>{label.replace('A','')}</div>
                  {isComplete ? <CheckCircle className="text-green-500" size={20} strokeWidth={3}/> : <ChevronRight className="text-slate-200" size={20}/>}
                </div>
                <p className="text-slate-800 font-black text-sm uppercase">Palete {label}</p>
                <p className="text-[10px] font-bold text-slate-400">{done}/{total} ITENS</p>
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#FACC15] font-black text-xs uppercase px-2 mb-2"><Truck size={18} strokeWidth={3}/> Motorista</div>
          {motoristaBays.map(bay => {
            const { done, total } = getBayProgress(bay);
            const isComplete = done === total && total > 0;
            const label = getSmartLabel(bay);
            return (
              <button key={bay} onClick={() => setSelectedBay(bay)} className={`w-full p-4 rounded-[2rem] border-2 text-left shadow-sm active:scale-95 transition-all ${isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${isComplete ? 'bg-green-500 text-white' : 'bg-blue-50 text-[#0264B4]'}`}>{label.replace('M','')}</div>
                  {isComplete ? <CheckCircle className="text-green-500" size={20} strokeWidth={3}/> : <ChevronRight className="text-slate-200" size={20}/>}
                </div>
                <p className="text-slate-800 font-black text-sm uppercase">Palete {label}</p>
                <p className="text-[10px] font-bold text-slate-400">{done}/{total} ITENS</p>
              </button>
            );
          })}
        </div>
      </main>
      {globalPercent === 100 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t-2 z-30">
          <button onClick={handleFinalizeCarga} className="w-full bg-[#27AE60] text-white py-6 rounded-[2rem] font-black text-2xl uppercase flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all animate-pulse">
            <CheckCircle size={32} strokeWidth={3}/> FINALIZAR CARGA
          </button>
        </div>
      )}
    </div>
  );
};

export default ConferenceBays;