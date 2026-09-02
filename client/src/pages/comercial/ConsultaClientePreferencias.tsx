import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CustomerPreference } from "@shared/schema";
import {
  ClientePreferenciasForm,
  customerPreferenceToFormValues,
  downloadCustomerPreferencesCsv,
  type FormValues,
} from "./ClientePreferenciasForm";
import { PageHeader, PageShell } from "./ClientePreferencias";

const preferencesUrl = "/api/comercial/cliente-preferencias";

export default function ConsultaClientePreferencias() {
  const { toast } = useToast();
  const [codigoBusca, setCodigoBusca] = useState("");
  const [record, setRecord] = useState<CustomerPreference | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = codigoBusca.trim();
    if (!code) {
      toast({
        title: "Informe o Código PDV",
        description: "Digite um código para fazer a consulta.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setRecord(null);
    try {
      const response = await fetch(`${preferencesUrl}/${encodeURIComponent(code)}`, { credentials: "include" });
      if (response.status === 404) {
        toast({
          title: "PDV não encontrado",
          description: "Ainda não existe um cadastro salvo para este Código PDV.",
        });
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível consultar o PDV.");
      }
      const data = await response.json() as CustomerPreference;
      setRecord(data);
      setFormKey((current) => current + 1);
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave(values: FormValues) {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", preferencesUrl, values);
      const saved = await response.json() as CustomerPreference;
      setRecord(saved);
      setCodigoBusca(saved.codigoPdv);
      setFormKey((current) => current + 1);
      toast({
        title: "Alterações salvas",
        description: "O cadastro do PDV foi atualizado com sucesso.",
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
        title="Consulta de clientes"
        description="Digite o Código PDV para consultar, editar e salvar as preferências."
        action={
          <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar CSV
          </Button>
        }
      />

      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="codigo-busca" className="text-sm font-medium">
              Código PDV
            </label>
            <Input
              id="codigo-busca"
              value={codigoBusca}
              onChange={(event) => setCodigoBusca(event.target.value)}
              placeholder="Digite o Código PDV"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="bg-[#0f766e] hover:bg-[#115e59] sm:min-w-32" disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isSearching ? "Consultando..." : "Consultar"}
          </Button>
        </form>
      </section>

      {record ? (
        <ClientePreferenciasForm
          key={`${record.id}-${formKey}`}
          initialFormValues={customerPreferenceToFormValues(record)}
          onSubmitValues={handleSave}
          isSaving={isSaving}
          submitLabel="Salvar alterações"
        />
      ) : (
        <section className="bg-card border border-border rounded-2xl shadow-sm p-10 text-center">
          <Search className="w-9 h-9 text-[#0f766e] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground">Consulte um cadastro</h2>
          <p className="text-sm text-muted-foreground mt-2">
            O formulário do PDV aparecerá aqui quando o Código PDV for encontrado.
          </p>
        </section>
      )}
    </PageShell>
  );
}