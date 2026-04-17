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
  importedAt: timestamp("imported_at").defaultNow(),
});

export const insertConferenceSchema = createInsertSchema(conferences).omit({ id: true, createdAt: true });
export const insertWmsItemSchema = createInsertSchema(wmsItems).omit({ id: true });
export const insertPromaxDataSchema = createInsertSchema(promaxData).omit({ id: true });
export const insertDriverBaseSchema = createInsertSchema(driverBase).omit({ id: true });
export const insertGinfoChecklistSchema = createInsertSchema(ginfoChecklist).omit({ id: true, importedAt: true });
export const insertMatinalSchema = createInsertSchema(matinals).omit({ id: true, date: true });

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
  checklistMin: number;
  patioPortariaMin: number;
  tmlMin: number;
}

export interface DashboardMetrics {
  totalConferences: number;
  averageTimeMinutes: number;
  divergencePercentage: number;
  damagePercentage: number;
  partialCountPercentage: number;
}