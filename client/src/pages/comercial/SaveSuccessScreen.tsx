import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaveSuccessScreenProps = {
  onReturn: () => void;
};

export default function SaveSuccessScreen({ onReturn }: SaveSuccessScreenProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ecfdf5] via-background to-[#fef3c7] flex items-center justify-center p-6">
      <section
        className="w-full max-w-xl rounded-3xl border border-[#99f6e4] bg-card px-6 py-12 md:px-12 md:py-16 text-center shadow-xl"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#0f766e]/10">
          <CheckCircle2 className="h-12 w-12 text-[#0f766e]" />
        </div>

        <div
          className="mb-5 flex items-center justify-center text-6xl leading-none"
          role="img"
          aria-label="Dois copos de cerveja brindando"
        >
          <span className="-rotate-12">🍺</span>
          <span className="-ml-3 rotate-12">🍺</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Salvo com sucesso!</h1>
        <p className="mt-3 text-xl font-semibold text-[#0f766e]">Por mais razões para brindar</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          As informações do PDV foram gravadas e já estão disponíveis para consulta.
        </p>

        <Button type="button" onClick={onReturn} className="mt-8 bg-[#0f766e] hover:bg-[#115e59]">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu Comercial
        </Button>
      </section>
    </main>
  );
}