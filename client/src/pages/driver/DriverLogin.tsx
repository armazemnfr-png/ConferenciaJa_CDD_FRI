import { useState } from "react";
import { useLocation } from "wouter";
import { Truck, ArrowRight, Loader2, MapPin, UserSquare2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DriverLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [driverId, setDriverId] = useState("");
  const [mapNumber, setMapNumber] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mapNumber) {
      toast({
        title: "Mapa obrigatório",
        description: "Por favor, digite o número do mapa para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    try {
      // Chamada que valida o mapa e associa o código do motorista (se houver)
      const response = await fetch(`/api/itens/${mapNumber.trim().toUpperCase()}?driverCode=${driverId.trim() || "N/A"}`);

      if (response.ok) {
        const dados = await response.json();

        if (dados && dados.length > 0) {
          // Salva a matrícula na sessão se preenchida
          if (driverId.trim()) {
            sessionStorage.setItem('driverId', driverId.trim());
          } else {
            sessionStorage.removeItem('driverId');
          }

          toast({
            title: "Mapa localizado",
            description: "Boa conferência!",
          });

          setLocation(`/driver/bays/${mapNumber.trim().toUpperCase()}`);
        } else {
          toast({
            title: "Mapa vazio",
            description: "Este mapa não possui itens no sistema.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Não encontrado",
          description: "O número do mapa não existe no sistema.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível validar agora. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border overflow-hidden">

        {/* Cabeçalho Azul com Ícone Amarelo/Mostarda */}
        <div className="bg-[#0056b3] px-8 py-10 text-center text-white relative">
          <div className="relative z-10 flex flex-col items-center">
            {/* Fundo do caminhão Amarelo/Mostarda */}
            <div className="w-16 h-16 bg-[#ffc107] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
              <Truck className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-2xl font-bold">Área do Motorista</h2>
            <p className="opacity-90 mt-1">Inicie sua conferência de rota</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <UserSquare2 className="w-4 h-4 text-muted-foreground" />
                Sua Matrícula (Opcional)
              </label>
              <input
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Ex: 12345"
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#0056b3] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Número do Mapa
              </label>
              <input
                type="text"
                value={mapNumber}
                onChange={(e) => setMapNumber(e.target.value)}
                placeholder="Ex: 12345"
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[#0056b3] focus:outline-none transition-all uppercase"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#ffc107] hover:bg-[#e0a800] text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Iniciar Conferência
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center">
            <button 
              type="button" 
              onClick={() => setLocation("/")} 
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Voltar ao início
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}