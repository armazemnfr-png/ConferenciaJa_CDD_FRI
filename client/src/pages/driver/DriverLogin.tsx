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
        title: "Campo obrigatório",
        description: "Por favor, digite o número do mapa.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    try {
      // Fazemos a busca direta para validar se o mapa existe
      const response = await fetch(`/api/itens/${mapNumber.trim()}`);

      if (response.ok) {
        const dados = await response.json();

        if (dados && dados.length > 0) {
          toast({
            title: "Mapa validado",
            description: "Carregando itens da conferência...",
          });
          // Sucesso: Salva o ID do motorista e vai para a tela de conferência
          if (driverId) {
            sessionStorage.setItem('driverId', driverId);
          } else {
            sessionStorage.removeItem('driverId');
          }
          setLocation(`/driver/conference/${mapNumber.trim().toUpperCase()}`);
        } else {
          toast({
            title: "Mapa vazio",
            description: "Este mapa não possui itens cadastrados.",
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
        description: "Não foi possível verificar o mapa agora.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-border">

        {/* Header graphic */}
        <div className="bg-accent px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
              <Truck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold text-accent-foreground">Área do Motorista</h2>
            <p className="text-accent-foreground/80 mt-1">Inicie sua conferência de rota</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <UserSquare2 className="w-4 h-4 text-muted-foreground" />
                Sua Matrícula (Opcional)
              </label>
              <input
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Ex: 12345"
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Número do Mapa
              </label>
              <input
                type="text"
                value={mapNumber}
                onChange={(e) => setMapNumber(e.target.value)}
                placeholder="Ex: 12345"
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium uppercase"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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

          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => setLocation("/")}
              className="text-sm text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
            >
              Voltar ao início
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}