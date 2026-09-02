import { Link } from "wouter";
import { FormEvent, ReactNode, useState } from "react";
import { AlertCircle, ArrowLeft, ClipboardList, RotateCcw, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const horarios = [
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
];

const horariosDeSabado = [...horarios, "Não recebe no sábado"];

type FormValues = {
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

const initialValues: FormValues = {
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

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function ClientePreferencias() {
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(initialValues);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.diasNaoAbre.length === 0) {
      setFormError("Selecione pelo menos um dia em que o PDV não abre.");
      toast({
        title: "Campo obrigatório",
        description: "Informe os dias em que o PDV não abre.",
        variant: "destructive",
      });
      return;
    }

    if (!values.horarioPreferencia) {
      setFormError("Selecione um horário de preferência.");
      toast({
        title: "Campo obrigatório",
        description: "Informe o horário de preferência.",
        variant: "destructive",
      });
      return;
    }

    if (values.horarioPreferencia === "Outros" && !values.horarioPreferenciaOutro.trim()) {
      setFormError("Descreva o horário de preferência em “Outros”.");
      toast({
        title: "Campo obrigatório",
        description: "Informe o horário de preferência personalizado.",
        variant: "destructive",
      });
      return;
    }

    if (!values.horarioSabado) {
      setFormError("Selecione um horário para sábado.");
      toast({
        title: "Campo obrigatório",
        description: "Informe o horário de sábado.",
        variant: "destructive",
      });
      return;
    }

    if (values.horarioSabado === "Outros" && !values.horarioSabadoOutro.trim()) {
      setFormError("Descreva o horário de sábado em “Outros”.");
      toast({
        title: "Campo obrigatório",
        description: "Informe o horário de sábado personalizado.",
        variant: "destructive",
      });
      return;
    }

    setFormError("");
    toast({
      title: "Formulário validado",
      description: "Todos os campos obrigatórios foram preenchidos corretamente.",
    });
  }

  function handleReset() {
    setValues(initialValues);
    setFormError("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/comercial"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Comercial
        </Link>

        <header className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0f766e]/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-[#0f766e]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f766e] mb-1">Comercial</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Cliente - Preferências</h1>
            <p className="text-muted-foreground mt-2">
              Formulário de preferências para atualização da base de clientes.
            </p>
          </div>
        </header>

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
                <Input
                  value={values.setor}
                  onChange={(event) => updateValue("setor", event.target.value)}
                  placeholder="Informe o setor"
                  required
                />
              </Field>
              <Field label="2 - Código PDV" required>
                <Input
                  value={values.codigoPdv}
                  onChange={(event) => updateValue("codigoPdv", event.target.value)}
                  placeholder="Informe o código do PDV"
                  required
                />
              </Field>
              <Field label="3 - Nome PDV" required className="md:col-span-2">
                <Input
                  value={values.nomePdv}
                  onChange={(event) => updateValue("nomePdv", event.target.value)}
                  placeholder="Informe o nome do PDV"
                  required
                />
              </Field>
              <Field label="4 - Telefone 1" required hint="Exemplo: 22 99999-9999">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={values.telefone1}
                  onChange={(event) => updateValue("telefone1", formatPhone(event.target.value))}
                  placeholder="22 99999-9999"
                  required
                />
              </Field>
              <Field label="5 - Telefone 2" hint="Opcional">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={values.telefone2}
                  onChange={(event) => updateValue("telefone2", formatPhone(event.target.value))}
                  placeholder="22 99999-9999"
                />
              </Field>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <QuestionHeading
              number="6"
              title="Dias que o PDV NÃO ABRE"
              required
              description="Você pode marcar várias opções."
            />
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {diasDaSemana.map((day) => (
                <label
                  key={day}
                  htmlFor={`day-${day}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer hover:border-[#0f766e]/50 transition-colors"
                >
                  <Checkbox
                    id={`day-${day}`}
                    checked={values.diasNaoAbre.includes(day)}
                    onCheckedChange={(checked) => toggleDay(day, checked)}
                  />
                  <span className="text-sm font-medium">{day}</span>
                </label>
              ))}
            </div>
            {formError.includes("dia") && <ErrorMessage>{formError}</ErrorMessage>}
          </section>

          <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <Field
              label="7 - Observação na entrega"
              required
              hint="Exemplo: PDV mora do lado, só chamar"
            >
              <Textarea
                value={values.observacaoEntrega}
                onChange={(event) => updateValue("observacaoEntrega", event.target.value)}
                placeholder="Digite uma observação para a entrega"
                rows={4}
                required
              />
            </Field>
          </section>

          <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <QuestionHeading
              number="8"
              title="Horário Preferência"
              required
              description="Selecione apenas uma opção."
            />
            <RadioGroup
              value={values.horarioPreferencia}
              onValueChange={(value) => updateValue("horarioPreferencia", value)}
              className="grid gap-3 sm:grid-cols-2"
              required
            >
              {horarios.map((time) => (
                <RadioOption
                  key={time}
                  name="horario-preferencia"
                  value={time}
                  label={time}
                />
              ))}
            </RadioGroup>
            {values.horarioPreferencia === "Outros" && (
              <Input
                className="mt-4"
                value={values.horarioPreferenciaOutro}
                onChange={(event) => updateValue("horarioPreferenciaOutro", event.target.value)}
                placeholder="Descreva o horário de preferência"
                aria-label="Outro horário de preferência"
                required
              />
            )}
            {formError.includes("preferência") && <ErrorMessage>{formError}</ErrorMessage>}
          </section>

          <section className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <QuestionHeading
              number="9"
              title="Horário SÁBADO"
              required
              description="Selecione apenas uma opção."
            />
            <RadioGroup
              value={values.horarioSabado}
              onValueChange={(value) => updateValue("horarioSabado", value)}
              className="grid gap-3 sm:grid-cols-2"
              required
            >
              {horariosDeSabado.map((time) => (
                <RadioOption
                  key={time}
                  name="horario-sabado"
                  value={time}
                  label={time}
                />
              ))}
            </RadioGroup>
            {values.horarioSabado === "Outros" && (
              <Input
                className="mt-4"
                value={values.horarioSabadoOutro}
                onChange={(event) => updateValue("horarioSabadoOutro", event.target.value)}
                placeholder="Descreva o horário de sábado"
                aria-label="Outro horário de sábado"
                required
              />
            )}
            {formError.includes("sábado") && <ErrorMessage>{formError}</ErrorMessage>}
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Limpar
            </Button>
            <Button type="submit" className="bg-[#0f766e] hover:bg-[#115e59]">
              <Send className="w-4 h-4" />
              Validar preenchimento
            </Button>
          </div>
        </form>
      </div>
    </div>
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
        <span>
          {label}{required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function QuestionHeading({
  number,
  title,
  description,
  required = false,
}: {
  number: string;
  title: string;
  description: string;
  required?: boolean;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-foreground">
        {number} - {title}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function RadioOption({ name, value, label }: { name: string; value: string; label: string }) {
  const id = `${name}-${value.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer hover:border-[#0f766e]/50 transition-colors"
    >
      <RadioGroupItem id={id} value={value} aria-label={label} className="mt-0.5" />
      <span className="text-sm leading-5">{label}</span>
    </label>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-3" role="alert">
      <AlertCircle className="w-4 h-4" />
      {children}
    </p>
  );
}