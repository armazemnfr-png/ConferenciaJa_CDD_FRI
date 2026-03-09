import { db } from "./db";
import {
  conferences,
  wmsItems,
  promaxData,
  driverBase,
  matinals,
  type Conference,
  type WmsItem,
  type PromaxData,
  type DriverBase,
  type Matinal,
  type InsertConference,
  type InsertWmsItem,
  type InsertDriverBase,
  type InsertMatinal,
  type UpdateConferenceRequest,
  type UpdateWmsItemRequest,
  type DashboardMetrics
} from "@shared/schema";
import { eq, sql, and, desc, inArray } from "drizzle-orm";

// Estendemos o tipo para que o Frontend reconheça as novas propriedades
export type ConferenceWithMetrics = Conference & {
  hasDivergence?: boolean;
  hasDamage?: boolean;
};

export interface IStorage {
  // Matinals
  getMatinals(): Promise<Matinal[]>;
  createMatinal(matinal: InsertMatinal): Promise<Matinal>;

  // Conferences
  getConferences(filters?: any): Promise<ConferenceWithMetrics[]>;
  getConference(id: number): Promise<Conference | undefined>;
  getConferenceByMap(mapNumber: string): Promise<Conference | undefined>;
  createConference(conference: InsertConference): Promise<Conference>;
  updateConference(id: number, updates: UpdateConferenceRequest): Promise<Conference>;

  // WMS Items
  getWmsItemsByMap(mapNumber: string): Promise<WmsItem[]>;
  getWmsItem(id: number): Promise<WmsItem | undefined>;
  updateWmsItem(id: number, updates: UpdateWmsItemRequest): Promise<WmsItem>;
  bulkInsertWmsItems(items: InsertWmsItem[]): Promise<void>;

  // Promax Data
  bulkInsertPromaxData(items: any[]): Promise<void>;
  getPromaxByDriver(registration: string): Promise<PromaxData | undefined>;

  // Driver Base
  bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void>;
  getDriverByRegistration(registration: string): Promise<DriverBase | undefined>;

  // Dashboard Metrics
  getDashboardMetrics(filters?: any): Promise<DashboardMetrics>;
}

export class DatabaseStorage implements IStorage {
  async getMatinals(): Promise<Matinal[]> {
    return await db.select().from(matinals);
  }

  async createMatinal(matinal: InsertMatinal): Promise<Matinal> {
    const [created] = await db.insert(matinals).values(matinal).returning();
    return created;
  }

  // REVISADO: Agora busca os itens de cada conferência para marcar se houve erro
  async getConferences(filters?: any): Promise<ConferenceWithMetrics[]> {
    const conditions = [];

    if (filters?.driverId) {
      conditions.push(eq(conferences.driverId, filters.driverId));
    }

    if (filters?.mapNumber) {
      conditions.push(sql`upper(trim(${conferences.mapNumber})) = ${filters.mapNumber.trim().toUpperCase()}`);
    }

    // Melhorado: Usa início e fim do dia para evitar problemas com fuso horário
    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      conditions.push(sql`${conferences.startTime} >= ${startDate}`);
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(sql`${conferences.startTime} <= ${endDate}`);
    }

    const results = conditions.length > 0 
      ? await db.select().from(conferences).where(and(...conditions)).orderBy(desc(conferences.startTime))
      : await db.select().from(conferences).orderBy(desc(conferences.startTime));

    // Para cada conferência, verificamos se existem itens com divergência ou avaria no WMS
    return await Promise.all(results.map(async (conf) => {
      const items = await db.select().from(wmsItems).where(eq(wmsItems.mapNumber, conf.mapNumber));

      return {
        ...conf,
        hasDivergence: items.some(i => i.isChecked && i.checkedQuantity !== null && i.checkedQuantity !== i.expectedQuantity),
        hasDamage: items.some(i => i.hasDamage === true)
      };
    }));
  }

  async getConference(id: number): Promise<Conference | undefined> {
    const [conference] = await db.select().from(conferences).where(eq(conferences.id, id));
    return conference;
  }

  async getConferenceByMap(mapNumber: string): Promise<Conference | undefined> {
    const normalizedMap = String(mapNumber).trim().toUpperCase();
    const [conference] = await db.select()
      .from(conferences)
      .where(sql`upper(trim(${conferences.mapNumber})) = ${normalizedMap}`)
      .orderBy(desc(conferences.startTime))
      .limit(1);
    return conference;
  }

  async createConference(conference: InsertConference): Promise<Conference> {
    const [created] = await db.insert(conferences).values({
      ...conference,
      mapNumber: conference.mapNumber.trim().toUpperCase()
    }).returning();
    return created;
  }

  async updateConference(id: number, updates: UpdateConferenceRequest): Promise<Conference> {
    const [updated] = await db.update(conferences)
      .set({
        ...updates,
        endTime: updates.status === 'completed' ? new Date() : undefined
      })
      .where(eq(conferences.id, id))
      .returning();
    return updated;
  }

  async getWmsItemsByMap(mapNumber: string): Promise<WmsItem[]> {
    const normalizedMap = String(mapNumber).trim().toUpperCase();
    return await db.select().from(wmsItems)
      .where(sql`upper(trim(${wmsItems.mapNumber})) = ${normalizedMap}`);
  }

  async getWmsItem(id: number): Promise<WmsItem | undefined> {
    const [item] = await db.select().from(wmsItems).where(eq(wmsItems.id, id));
    return item;
  }

  async updateWmsItem(id: number, updates: UpdateWmsItemRequest): Promise<WmsItem> {
    const [updated] = await db.update(wmsItems)
      .set(updates)
      .where(eq(wmsItems.id, id))
      .returning();
    return updated;
  }

  async bulkInsertWmsItems(items: InsertWmsItem[]): Promise<void> {
    if (items.length === 0) return;
    try {
      await db.execute(sql`TRUNCATE TABLE wms_items RESTART IDENTITY CASCADE`);
      const chunkSize = 200;
      for (let i = 0; i < items.length; i += chunkSize) {
        await db.insert(wmsItems).values(items.slice(i, i + chunkSize));
      }
    } catch (error) {
      console.error("❌ ERRO NO UPLOAD WMS:", error);
      throw error;
    }
  }

  async getPromaxByDriver(registration: string): Promise<PromaxData | undefined> {
    const [entry] = await db.select()
      .from(promaxData)
      .where(and(eq(promaxData.motorista, registration), sql`upper(trim(${promaxData.fase})) = 'CARREGADO'`))
      .limit(1);
    return entry;
  }

  async bulkInsertPromaxData(items: any[]): Promise<void> {
    if (items.length === 0) return;
    await db.execute(sql`TRUNCATE TABLE promax_data RESTART IDENTITY CASCADE`);
    for (const item of items) {
      const fase = String(item.fase || item.Fase || "").trim().toUpperCase();
      if (fase !== "CARREGADO") continue;
      const matricula = String(item.motorista || item.Motorista || "").trim();
      const mapa = String(item.mapa || item.Mapa || "").trim();
      if (!mapa || !matricula) continue;

      const [driver] = await db.select().from(driverBase).where(eq(driverBase.registration, matricula));
      const driverName = driver ? driver.name : `Matrícula: ${matricula}`;

      await db.update(wmsItems).set({ plate: driverName }).where(eq(wmsItems.mapNumber, mapa));
      await db.insert(promaxData).values({
        mapa: mapa,
        motorista: matricula,
        fase: "CARREGADO",
        veiculo: String(item.veiculo || item.Veículo || ""),
        placa: String(item.placa || item.Placa || ""),
      });
    }
  }

  async getDriverByRegistration(registration: string): Promise<DriverBase | undefined> {
    const [driver] = await db.select().from(driverBase).where(eq(driverBase.registration, registration));
    return driver;
  }

  async bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void> {
    if (items.length === 0) return;
    await db.execute(sql`TRUNCATE TABLE driver_base RESTART IDENTITY CASCADE`);
    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      await db.insert(driverBase).values(items.slice(i, i + chunkSize));
    }
  }

  async getDashboardMetrics(filters?: any): Promise<DashboardMetrics> {
    const filteredConferences = await this.getConferences(filters);
    const totalConferences = filteredConferences.length;

    let averageTimeMinutes = 0;
    const completed = filteredConferences.filter(c => c.status === "completed" && c.startTime && c.endTime);

    if (completed.length > 0) {
      const totalTimeMs = completed.reduce((acc, c) => {
        return acc + (new Date(c.endTime!).getTime() - new Date(c.startTime!).getTime());
      }, 0);
      averageTimeMinutes = (totalTimeMs / completed.length) / 60000;
    }

    let allItems: WmsItem[] = [];
    if (filters?.mapNumber) {
      allItems = await this.getWmsItemsByMap(filters.mapNumber);
    } else if (totalConferences > 0) {
      const mapNumbers = filteredConferences.map(c => c.mapNumber);
      allItems = await db.select().from(wmsItems).where(inArray(wmsItems.mapNumber, mapNumbers));
    } else {
      allItems = await db.select().from(wmsItems);
    }

    const totalItems = allItems.length;
    let divergencePercentage = 0, damagePercentage = 0, partialCountPercentage = 0;

    // DEBUG: Log para diagnosticar problema das avarias
    console.log('[getDashboardMetrics] Filtros:', filters);
    console.log('[getDashboardMetrics] Total de conferências:', totalConferences);
    console.log('[getDashboardMetrics] Total de itens no banco:', totalItems);
    if (totalItems > 0 && totalItems < 100) {
      console.log('[getDashboardMetrics] Amostra de itens:', allItems.slice(0, 5).map(i => ({ id: i.id, mapNumber: i.mapNumber, hasDamage: i.hasDamage, tipo: typeof i.hasDamage })));
    }

    if (totalItems > 0) {
      const divergences = allItems.filter(i => i.isChecked && i.checkedQuantity !== null && i.checkedQuantity !== i.expectedQuantity).length;
      divergencePercentage = (divergences / totalItems) * 100;

      // Aceita booleano, número (1) ou string ('true') para hasDamage
      const damaged = allItems.filter(i => {
        const hasDamageValue = i.hasDamage;
        if (typeof hasDamageValue === 'boolean') return hasDamageValue;
        if (typeof hasDamageValue === 'number') return hasDamageValue === 1;
        if (typeof hasDamageValue === 'string') return hasDamageValue.toLowerCase() === 'true';
        return false;
      }).length;
      damagePercentage = (damaged / totalItems) * 100;
      console.log('[getDashboardMetrics] Itens com avaria:', damaged, 'de', totalItems, '=', damagePercentage.toFixed(2) + '%');

      const partialCounts = allItems.filter(i => i.partialCountReason).length;
      partialCountPercentage = (partialCounts / totalItems) * 100;
    }

    return {
      totalConferences,
      averageTimeMinutes: Math.round(averageTimeMinutes),
      divergencePercentage: Math.round(divergencePercentage),
      damagePercentage: Math.round(damagePercentage),
      partialCountPercentage: Math.round(partialCountPercentage)
    };
  }
}

export const storage = new DatabaseStorage();