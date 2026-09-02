import { FormEvent, ReactNode, useState } from "react";
import { AlertCircle, ClipboardList, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { CustomerPreference } from "@shared/schema";

export const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const;

export const horarios = [
  "08:00 às 18:00 (recebe horário de almoço)",
  "08:00 às 12:00 e 13:00 às 18:00",
  "08:00 às 12 e 14:00 às 18:00",
  "08:00 às 10:00",
  "08:00 às 11:00",
  "08:00 às 12:00",
  "08:00 às 10:00 e 14:00 às 16:00",
  "12:00 às 18:00",
  "14:00 às 18:00",
  "Outros",
] as const;

export const horariosDeSabado = [...horarios, "Não recebe no sábado"] as const;

export type FormValues = {
  setor: string;
  codigoPdv: string;
  nomePdv: string;
  telefone1: string;
  telefone2: string;
  diasNaoAbre: string[];
  horarioPreferencia: string;
  horarioPreferenciaOutro: string;
  horarioSabado: string;
  horarioSabadoOutro: string;
  observacaoEntrega: string;
};

export const initialValues: FormValues = {
  setor: "",
  codigoPdv: "",
  nomePdv: "",
  telefone1: "",
  telefone2: "",
  diasNaoAbre: [],
  horarioPreferencia: "",
  horarioPreferenciaOutro: "",
  horarioSabado: "",
  horarioSabadoOutro: "",
  observacaoEntrega: "",
};

export function customerPreferenceToFormValues(record: CustomerPreference): FormValues {
  return {
    setor: record.setor,
    codigoPdv: record.codigoPdv,
    nomePdv: record.nomePdv,
    telefone1: record.telefone1,
    telefone2: record.telefone2 || "",
    diasNaoAbre: record.diasNaoAbre,
    horarioPreferencia: record.horarioPreferencia,
    horarioPreferenciaOutro: record.horarioPreferenciaOutro || "",
    horarioSabado: record.horarioSabado,
    horarioSabadoOutro: record.horarioSabadoOutro || "",
    observacaoEntrega: record.observacaoEntrega,
  };
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join("; ") : value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR");
}

export function downloadCustomerPreferencesCsv(records: CustomerPreference[]) {
  const headers = [
    "Setor",
    "Código PDV",
    "Nome PDV",
    "Telefone 1",
    "Telefone 2",
    "Dias que não abre",
    "Observação na entrega",
    "Horário preferência",
    "Outro horário preferência",
    "Horário sábado",
    "Outro horário sábado",
    "Criado em",
    "Atualizado em",
  ];
  const rows = records.map((record) => [
    record.setor,
    record.codigoPdv,
    record.nomePdv,
    record.telefone1,
    record.telefone2,
    record.diasNaoAbre,
    record.observacaoEntrega,
    record.horarioPreferencia,
    record.horarioPreferenciaOutro,
    record.horarioSabado,
    record.horarioSabadoOutro,
    exportDate(record.createdAt),
    exportDate(record.updatedAt),
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clientes-preferencias.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type ClientePreferenciasFormProps = {
  initialFormValues?: FormValues;
  onSubmitValues: (values: FormValues) => Promise<void>;
  submitLabel?: string;
  isSaving?: boolean;
};

export function ClientePreferenciasForm({
  initialFormValues = initialValues,
  onSubmitValues,
  submitLabel = "Salvar cadastro",
  isSaving = false,
}: ClientePreferenciasFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [formError, setFormError] = useState("");

  function updateValue<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  function toggleDay(day: string, checked: boolean | "indeterminate") {
    const nextDays = checked === true
      ? [...values.diasNaoAbre, day]
      : values.diasNaoAbre.filter((selectedDay) => selectedDay !== day);
    updateValue("diasNaoAbre", nextDays);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.diasNaoAbre.length === 0) {
      return showValidationError("Selecione pelo menos um dia em que o PDV não abre.", "Informe os dias em que o PDV não abre.");
    }
    if (!values.horarioPreferencia) {
      return showValidationError("Selecione um horário de preferência.", "Informe o horário de preferência.");
    }
    if (values.horarioPreferencia === "Outros" && !values.horarioPreferenciaOutro.trim()) {
      return showValidationError("Descreva o horário de preferência em “Outros”.", "Informe o horário de preferência personalizado.");
    }
    if (!values.horarioSabado) {
      return showValidationError("Selecione um horário para sábado.", "Informe o horário de sábado.");
    }
    if (values.horarioSabado === "Outros" && !values.horarioSabadoOutro.trim()) {
      return showValidationError("Descreva o horário de sábado em “Outros”.", "Informe o horário de sábado personalizado.");
    }

    setFormError("");
    try {
      await onSubmitValues({
        ...values,
        setor: values.setor.trim(),
        codigoPdv: values.codigoPdv.trim(),
        nomePdv: values.nomePdv.trim(),
        telefone1: values.telefone1.trim(),
        telefone2: values.telefone2.trim(),
        observacaoEntrega: values.observacaoEntrega.trim(),
        horarioPreferenciaOutro: values.horarioPreferenciaOutro.trim(),
        horarioSabadoOutro: values.horarioSabadoOutro.trim(),
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  }

  function showValidationError(message: string, description: string) {
    setFormError(message);
    toast({ title: "Campo obrigatório", description, variant: "destructive" });
  }

  function handleReset() {
    setValues(initialFormValues);
    setFormError("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Dados do PDV</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha todos os campos. Os itens marcados com <span className="text-destructive">*</span> são obrigatórios.
            </p>
          </div>
          <ClipboardList className="w-6 h-6 text-[#0f766e] shrink-0 mt-1" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="1 - Setor" required>
            <Input value={values.setor} onChange={(event) => updateValue("setor", event.target.value)} placeholder="Informe o setor" required />
          </Field>
          <Field label="2 - Código PDV" required>
            <Input value={values.codigoPdv} onChange={(event) => updateValue("codigoPdv", event.target.value)} placeholder="Informe o código do PDV" required />
          </Field>
          <Field label="3 - Nome PDV" required className="md:col-span-2">
            <Input value={values.nomePdv} onChange={(event) => updateValue("nomePdv", event.target.value)} placeholder="Informe o nome do PDV" required />
          </Field>
          <Field label="4 - Telefone 1" required hint="Exemplo: 22 99999-9999">
            <Input type="tel" inputMode="tel" value={values.telefone1} onChange={(event) => updateValue("telefone1", formatPhone(event.target.value))} placeholder="22 99999-9999" required />
          </Field>
          <Field label="5 - Telefone 2" hint="Opcional">
            <Input type="tel" inputMode="tel" value={values.telefone2} onChange={(event) => updateValue("telefone2", formatPhone(event.target.value))} placeholder="22 99999-9999" />
          </Field>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <QuestionHeading number="6" title="Dias que o PDV NÃO ABRE" required description="Você pode marcar várias opções." />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {diasDaSemana.map((day) => (
            <label key={day} htmlFor={`day-${day}`} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer hover:border-[#0f766e]/50 transition-colors">
              <Checkbox id={`day-${day}`} checked={values.diasNaoAbre.includes(day)} onCheckedChange={(checked) => toggleDay(day, checked)} />
              <span className="text-sm font-medium">{day}</span>
            </label>
          ))}
        </div>
        {formError.includes("dia") && <ErrorMessage>{formError}</ErrorMessage>}
      </section>

      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <Field label="7 - Observação na entrega" required hint="Exemplo: PDV mora do lado, só chamar">
          <Textarea value={values.observacaoEntrega} onChange={(event) => updateValue("observacaoEntrega", event.target.value)} placeholder="Digite uma observação para a entrega" rows={4} required />
        </Field>
      </section>

      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <QuestionHeading number="8" title="Horário Preferência" required description="Selecione apenas uma opção." />
        <RadioGroup value={values.horarioPreferencia} onValueChange={(value) => updateValue("horarioPreferencia", value)} className="grid gap-3 sm:grid-cols-2" name="horarioPreferencia" required>
          {horarios.map((time) => <RadioOption key={time} name="horario-preferencia" value={time} label={time} />)}
        </RadioGroup>
        {values.horarioPreferencia === "Outros" && (
          <Input className="mt-4" value={values.horarioPreferenciaOutro} onChange={(event) => updateValue("horarioPreferenciaOutro", event.target.value)} placeholder="Descreva o horário de preferência" aria-label="Outro horário de preferência" required />
        )}
        {formError.includes("preferência") && <ErrorMessage>{formError}</ErrorMessage>}
      </section>

      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
        <QuestionHeading number="9" title="Horário SÁBADO" required description="Selecione apenas uma opção." />
        <RadioGroup value={values.horarioSabado} onValueChange={(value) => updateValue("horarioSabado", value)} className="grid gap-3 sm:grid-cols-2" name="horarioSabado" required>
          {horariosDeSabado.map((time) => <RadioOption key={time} name="horario-sabado" value={time} label={time} />)}
        </RadioGroup>
        {values.horarioSabado === "Outros" && (
          <Input className="mt-4" value={values.horarioSabadoOutro} onChange={(event) => updateValue("horarioSabadoOutro", event.target.value)} placeholder="Descreva o horário de sábado" aria-label="Outro horário de sábado" required />
        )}
        {formError.includes("sábado") && <ErrorMessage>{formError}</ErrorMessage>}
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
          <RotateCcw className="w-4 h-4" />
          Limpar
        </Button>
        <Button type="submit" className="bg-[#0f766e] hover:bg-[#115e59]" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>{label}{required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function QuestionHeading({ number, title, description, required = false }: { number: string; title: string; description: string; required?: boolean }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-foreground">
        {number} - {title}{required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function RadioOption({ name, value, label }: { name: string; value: string; label: string }) {
  const id = `${name}-${value.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer hover:border-[#0f766e]/50 transition-colors">
      <RadioGroupItem id={id} value={value} aria-label={label} className="mt-0.5" />
      <span className="text-sm leading-5">{label}</span>
    </label>
  );
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-3" role="alert">
      <AlertCircle className="w-4 h-4" />
      {children}
    </p>
  );
}