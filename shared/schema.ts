import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conferences = pgTable("conferences", {
  id: serial("id").primaryKey(),
  mapNumber: text("map_number").notNull(),
  driverId: text("driver_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  // NOVAS COLUNAS PARA PERSISTÊNCIA:
  hasDivergence: boolean("has_divergence").default(false),
  hasDamage: boolean("has_damage").default(false),
});

export const matinals = pgTable("matinals", {
  id: serial("id").primaryKey(),
  roomName: text("room_name").notNull(),
  fixedStartTime: text("fixed_start_time").notNull(),
  actualEndTime: timestamp("actual_end_time").defaultNow(),
  durationMinutes: integer("duration_minutes").notNull(),
  date: timestamp("date").defaultNow(),
});

export const wmsItems = pgTable("wms_items", {
  id: serial("id").primaryKey(),
  warehouseCode: text("warehouse_code"),
  mapNumber: text("map_number").notNull(),
  bayNumber: text("bay_number").notNull(),
  box: text("box"),
  sequence: text("sequence"),
  status: text("status"),
  sku: text("sku").notNull(),
  description: text("description").notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
  subtype: text("subtype"),
  category: text("category"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  origin: text("origin"),
  deliveryDate: text("delivery_date"),
  plate: text("plate"),
  isChecked: boolean("is_checked").default(false),
  checkedQuantity: integer("checked_quantity"),
  partialCountReason: text("partial_count_reason"),
  hasDamage: boolean("has_damage").default(false),
  damageDescription: text("damage_description"),
  uploadDate: text("upload_date"),
});

export const promaxData = pgTable("promax_data", {
  id: serial("id").primaryKey(),
  mapa: text("mapa"),
  fase: text("fase"),
  veiculo: text("veiculo"),
  placa: text("placa"),
  emissao: text("emissao"),
  dtOper: text("dt_oper"),
  hrOper: text("hr_oper"),
  usuario: text("usuario"),
  lacre1: text("lacre_1"),
  lacre2: text("lacre_2"),
  lacre3: text("lacre_3"),
  lacre4: text("lacre_4"),
  motorista: text("motorista"),
  dtIniCarreg: text("dt_ini_carreg"),
  hrIniCarreg: text("hr_ini_carreg"),
  dtFimCarreg: text("dt_fim_carreg"),
  hrFimCarreg: text("hr_fim_carreg"),
  kmPrev: text("km_prev"),
  kmAtual: text("km_atual"),
  conferente: text("conferente"),
  destino: text("destino"),
  promaxRf: text("promax_rf"),
  tipoMapa: text("tipo_mapa"),
  codUdc: text("cod_udc"),
  descUdc: text("desc_udc"),
});

export const driverBase = pgTable("driver_base", {
  id: serial("id").primaryKey(),
  registration: text("registration").notNull(),
  name: text("name").notNull(),
  room: text("room").notNull(),
});

export const ginfoChecklist = pgTable("ginfo_checklist", {
  id: serial("id").primaryKey(),
  realizadoPor: text("realizado_por").notNull(),
  equipe: text("equipe").notNull(),
  mapa: text("mapa").notNull(),
  tempo: text("tempo").notNull(),
  hrInicio: text("hr_inicio"),
  hrFinal: text("hr_final"),
  data: text("data"),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const kpiResults = pgTable("kpi_results", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").notNull(),
  mensagem: text("mensagem").notNull(),
  nome: text("nome"),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const metalogEntries = pgTable("metalog_entries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kpi: text("kpi").notNull(),
  kpiOther: text("kpi_other"),
  reason: text("reason").notNull(),
  solution: text("solution").notNull(),
  status: text("status").notNull().default("em_andamento"),
  blockerJustification: text("blocker_justification"),
  actionTaken: text("action_taken"),
  rootCauseAssessment: text("root_cause_assessment"),
  actionAssessment: text("action_assessment"),
  evidenceName: text("evidence_name"),
  evidenceMimeType: text("evidence_mime_type"),
  evidenceSize: integer("evidence_size"),
  evidenceData: text("evidence_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerPreferences = pgTable("customer_preferences", {
  id: serial("id").primaryKey(),
  setor: text("setor").notNull(),
  codigoPdv: text("codigo_pdv").notNull().unique(),
  nomePdv: text("nome_pdv").notNull(),
  telefone1: text("telefone_1").notNull(),
  telefone2: text("telefone_2"),
  diasNaoAbre: text("dias_nao_abre").notNull(),
  observacaoEntrega: text("observacao_entrega").notNull(),
  horarioPreferencia: text("horario_preferencia").notNull(),
  horarioPreferenciaOutro: text("horario_preferencia_outro"),
  horarioSabado: text("horario_sabado").notNull(),
  horarioSabadoOutro: text("horario_sabado_outro"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMetalogEntrySchema = createInsertSchema(metalogEntries).omit({ id: true, createdAt: true });
export type MetalogEntry = typeof metalogEntries.$inferSelect;
export type MetalogEntrySummary = Omit<MetalogEntry, "evidenceData">;
export type InsertMetalogEntry = z.infer<typeof insertMetalogEntrySchema>;

export const updateMetalogStatusSchema = z.object({
  status: z.enum(["em_andamento", "concluida", "nao_avancou"]),
  blockerJustification: z.string().nullable().optional(),
  actionTaken: z.string().nullable().optional(),
  rootCauseAssessment: z.enum(["aplicavel", "nao_aplicavel"]).nullable().optional(),
  actionAssessment: z.enum(["aplicavel", "nao_aplicavel"]).nullable().optional(),
  evidence: z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
    size: z.number().int().positive().max(3 * 1024 * 1024),
    data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/).max(4_200_000),
  }).nullable().optional(),
});

export const insertKpiResultSchema = createInsertSchema(kpiResults).omit({ id: true, importedAt: true });
export type KpiResult = typeof kpiResults.$inferSelect;
export type InsertKpiResult = z.infer<typeof insertKpiResultSchema>;

export const uploadMeta = pgTable("upload_meta", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  fileName: text("file_name").notNull(),
  recordCount: integer("record_count").notNull(),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const insertUploadMetaSchema = createInsertSchema(uploadMeta).omit({ id: true, importedAt: true });
export type UploadMeta = typeof uploadMeta.$inferSelect;

export const insertConferenceSchema = createInsertSchema(conferences).omit({ id: true, createdAt: true });
export const insertWmsItemSchema = createInsertSchema(wmsItems).omit({ id: true });
export const insertPromaxDataSchema = createInsertSchema(promaxData).omit({ id: true });
export const insertDriverBaseSchema = createInsertSchema(driverBase).omit({ id: true });
export const insertGinfoChecklistSchema = createInsertSchema(ginfoChecklist).omit({ id: true, importedAt: true });
export const insertMatinalSchema = createInsertSchema(matinals).omit({ id: true, date: true });

export const customerPreferenceDaySchema = z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]);
export const customerPreferenceHorarioOptions = [
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
export const customerPreferenceSabadoOptions = [
  ...customerPreferenceHorarioOptions,
  "Não recebe no sábado",
] as const;

export const customerPreferenceInputSchema = z.object({
  setor: z.string().trim().min(1, "Informe o setor.").max(200),
  codigoPdv: z.string().trim().min(1, "Informe o código PDV.").max(100),
  nomePdv: z.string().trim().min(1, "Informe o nome PDV.").max(200),
  telefone1: z.string().trim().min(1, "Informe o telefone 1.").max(50),
  telefone2: z.string().trim().max(50).optional().nullable(),
  diasNaoAbre: z.array(customerPreferenceDaySchema).min(1, "Selecione pelo menos um dia."),
  observacaoEntrega: z.string().trim().min(1, "Informe a observação na entrega.").max(2000),
  horarioPreferencia: z.enum(customerPreferenceHorarioOptions),
  horarioPreferenciaOutro: z.string().trim().max(200).optional().nullable(),
  horarioSabado: z.enum(customerPreferenceSabadoOptions),
  horarioSabadoOutro: z.string().trim().max(200).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.horarioPreferencia === "Outros" && !value.horarioPreferenciaOutro) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["horarioPreferenciaOutro"],
      message: "Descreva o horário de preferência.",
    });
  }
  if (value.horarioSabado === "Outros" && !value.horarioSabadoOutro) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["horarioSabadoOutro"],
      message: "Descreva o horário de sábado.",
    });
  }
});

export type CustomerPreferenceRow = typeof customerPreferences.$inferSelect;
export type CustomerPreferenceInput = z.infer<typeof customerPreferenceInputSchema>;
export type CustomerPreference = Omit<CustomerPreferenceRow, "diasNaoAbre"> & {
  diasNaoAbre: string[];
};

export const updateWmsItemSchema = z.object({
  isChecked: z.boolean().optional(),
  checkedQuantity: z.number().nullable().optional(),
  hasDamage: z.boolean().optional(),
  damageDescription: z.string().nullable().optional(),
  partialCountReason: z.string().nullable().optional(),
});

export type Conference = typeof conferences.$inferSelect;
export type InsertConference = z.infer<typeof insertConferenceSchema>;
export type WmsItem = typeof wmsItems.$inferSelect;
export type InsertWmsItem = z.infer<typeof insertWmsItemSchema>;
export type PromaxData = typeof promaxData.$inferSelect;
export type InsertPromaxData = z.infer<typeof insertPromaxDataSchema>;
export type DriverBase = typeof driverBase.$inferSelect;
export type InsertDriverBase = z.infer<typeof insertDriverBaseSchema>;
export type GinfoChecklist = typeof ginfoChecklist.$inferSelect;
export type InsertGinfoChecklist = z.infer<typeof insertGinfoChecklistSchema>;
export type Matinal = typeof matinals.$inferSelect;
export type InsertMatinal = z.infer<typeof insertMatinalSchema>;

export type CreateConferenceRequest = {
  driverId: string;
  mapNumber: string;
};

export type UpdateConferenceRequest = Partial<InsertConference>;
export type UpdateWmsItemRequest = z.infer<typeof updateWmsItemSchema>;

export interface TmlRecord {
  mapa: string;
  motorista: string;
  nome: string;
  sala: string;
  dtOper: string;
  hrPortaria: string;
  hrInicio: string;
  hrFinal: string;
  matinalMin: number;
  matinalPatioMin: number;
  matPatioOverlap: boolean;
  hasMatinal: boolean;
  hasChecklist: boolean;
  checklistMin: number;
  checklistConferenceMin: number;
  checklistConferenceSec: number;
  ckConfOverlap: boolean;
  hasConference: boolean;
  conferenceMin: number;
  patioPortariaMin: number;
  patioPortariaOverlap: boolean;
  hasPortariaTime: boolean;
  tmlMin: number;
}

export interface DashboardMetrics {
  totalConferences: number;
  averageTimeMinutes: number;
  divergencePercentage: number;
  damagePercentage: number;
  partialCountPercentage: number;
}