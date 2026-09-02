import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CustomerPreference } from "@shared/schema";
import {
  ClientePreferenciasForm,
  downloadCustomerPreferencesCsv,
  type FormValues,
} from "./ClientePreferenciasForm";

const preferencesUrl = "/api/comercial/cliente-preferencias";

export default function ClientePreferencias() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleSave(values: FormValues) {
    setIsSaving(true);
    try {
      await apiRequest("POST", preferencesUrl, values);
      toast({
        title: "Dados salvos com sucesso",
        description: "O cadastro do PDV foi gravado e já pode ser consultado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await apiRequest("GET", preferencesUrl);
      const records = await response.json() as CustomerPreference[];
      if (records.length === 0) {
        toast({ title: "Nenhum cadastro para exportar", description: "Salve pelo menos um PDV antes de exportar." });
        return;
      }
      downloadCustomerPreferencesCsv(records);
      toast({ title: "Exportação iniciada", description: `${records.length} cadastro(s) incluído(s) no CSV.` });
    } catch (error) {
      toast({
        title: "Não foi possível exportar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <PageShell>
      <Link
        href="/comercial"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Comercial
      </Link>

      <PageHeader
        eyebrow="Comercial"
        title="Cliente - Preferências"
        description="Cadastre ou atualize as preferências de atendimento dos clientes."
        action={
          <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar CSV
          </Button>
        }
      />

      <ClientePreferenciasForm
        onSubmitValues={handleSave}
        isSaving={isSaving}
        submitLabel="Salvar cadastro"
      />
    </PageShell>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0f766e]/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6 text-[#0f766e]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f766e] mb-1">{eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      </div>
      {action}
    </header>
  );
}