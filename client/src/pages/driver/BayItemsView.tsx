import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { CheckCircle2, Circle, ArrowLeft, Loader2, Timer, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function BayItemsView() {
  const [, params] = useRoute("/driver/conference/:mapNumber");
  const [, setLocation] = useLocation();
  const mapNumber = params?.mapNumber;
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const { toast } = useToast();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function carregarItens() {
      if (!mapNumber) return;
      try {
        const response = await fetch(`/api/itens/${mapNumber}`);
        if (response.ok) {
          const data = await response.json();
          setItens(data);
          if (data.length > 0) setIsActive(true);
        } else {
          toast({ variant: "destructive", title: "Erro", description: "Mapa não localizado." });
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarItens();
  }, [mapNumber, toast]);

  const toggleConferido = (id: number) => {
    setItens(prev => prev.map(item => 
      item.id === id ? { ...item, conferido: !item.conferido } : item
    ));
  };

  const toggleAvaria = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = itens.find(i => i.id === id);
    if (!item) return;

    const newHasDamage = true; // Sempre marcar como avariado ao clicar
    const payload = {
      hasDamage: newHasDamage
    };
    
    console.log('[toggleAvaria] Enviando para API:', { id, hasDamage: newHasDamage });
    
    try {
      const response = await fetch(`/api/wms-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      console.log('[toggleAvaria] Status da resposta:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('[toggleAvaria] Resposta do servidor:', responseData);
        
        setItens(prev => prev.map(i => 
          i.id === id 
            ? { ...i, hasDamage: true }
            : i
        ));
        
        toast({
          title: "Avaria registrada",
          description: "Item marcado como avariado"
        });
        
        // Invalidar cache do dashboard para atualizar instantaneamente
        await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      } else {
        const errorData = await response.json();
        console.error('[toggleAvaria] Erro na resposta:', errorData);
        toast({ variant: "destructive", title: "Erro", description: errorData.message || "Falha ao registrar avaria" });
      }
    } catch (error) {
      console.error('[toggleAvaria] Exceção:', error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao registrar avaria" });
    }
  };

  const handleFinalizar = async () => {
    setIsActive(false); 
    setMostrarSucesso(true);

    setTimeout(() => {
      setLocation("/driver/login");
    }, 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#f1b40e]" />
        <p className="mt-4 text-gray-500 font-medium">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ALERTA GIGANTE DE SUCESSO (OVERLAY) */}
      {mostrarSucesso && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-green-600 p-6 text-white animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Check className="w-16 h-16 text-white stroke-[4px]" />
          </div>
          <h2 className="text-4xl font-black text-center leading-tight uppercase mb-2">
            Conferência <br/> Finalizada!
          </h2>
          <p className="text-xl font-medium opacity-90 text-center mb-8">
            Tempo total: <span className="font-mono font-bold">{formatTime(seconds)}</span>
          </p>
          <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-progress origin-left"></div>
          </div>
          <p className="mt-6 text-sm font-bold opacity-70 uppercase tracking-widest">Retornando ao Login...</p>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#f1b40e] text-black p-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold uppercase leading-none">Mapa: {mapNumber}</h1>
              <p className="text-[10px] font-bold opacity-80 mt-1">{itens.length} PRODUTOS</p>
            </div>
          </div>
          <div className="flex flex-col items-end border-l border-black/20 pl-4">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-70">
              <Timer className="w-3 h-3" /> Tempo
            </div>
            <span className="text-xl font-mono font-black leading-none">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {itens.map((item) => (
          <Card 
            key={item.id} 
            className={`border-none shadow-sm transition-all duration-300 ${item.conferido ? 'bg-green-100 ring-1 ring-green-500/30' : 
            item.hasDamage ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white'}`}
            onClick={() => toggleConferido(item.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <h2 className={`font-black text-base leading-tight uppercase ${item.conferido ? 'text-green-800' : 
                    item.hasDamage ? 'text-red-800' : 'text-gray-800'}`}>
                    {item.item}
                  </h2>
                  <div className="flex gap-2 mt-2 items-center flex-wrap">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.conferido ? 'bg-green-600 text-white' : 'bg-[#f1b40e] text-black'}`}>
                      QTD: {item.qtd}
                    </span>
                    {item.hasDamage && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-red-500 text-white flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> AVARIA
                      </span>
                    )}
                  </div>
                  {item.hasDamage && (
                    <div className="mt-2 text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded inline-block">
                      Produto avariado: Sim
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => toggleAvaria(item.id, e)}
                    className={`p-1.5 rounded-full transition-colors ${item.hasDamage ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-100'}`}
                    title="Marcar como avariado"
                  >
                    <AlertTriangle className={`w-6 h-6 ${item.hasDamage ? 'text-red-600 fill-red-600' : 'text-gray-300'}`} />
                  </button>
                  {item.conferido ? (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  ) : (
                    <Circle className="w-10 h-10 text-gray-200" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-30 shadow-lg">
        <Button 
          className="w-full h-14 text-lg font-bold bg-[#f1b40e] hover:bg-[#d49e0d] text-black"
          onClick={handleFinalizar}
        >
          Finalizar Conferência
        </Button>
      </div>
    </div>
  );
}
