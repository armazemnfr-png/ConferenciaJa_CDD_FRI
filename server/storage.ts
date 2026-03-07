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
  type InsertPromaxData,
  type InsertDriverBase,
  type InsertMatinal,
  type UpdateConferenceRequest,
  type UpdateWmsItemRequest,
  type DashboardMetrics
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Conferences
  getConferences(): Promise<Conference[]>;
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
  bulkInsertPromaxData(items: InsertPromaxData[]): Promise<void>;

  // Driver Base
  bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void>;

  // Matinals
  getMatinals(): Promise<Matinal[]>;
  createMatinal(matinal: InsertMatinal): Promise<Matinal>;

  // Dashboard Metrics
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class DatabaseStorage implements IStorage {
  // Matinals
  async getMatinals(): Promise<Matinal[]> {
    return await db.select().from(matinals);
  }

  async createMatinal(matinal: InsertMatinal): Promise<Matinal> {
    const [created] = await db.insert(matinals).values(matinal).returning();
    return created;
  }

  // Conferences
  async getConferences(): Promise<Conference[]> {
    return await db.select().from(conferences);
  }

  async getConference(id: number): Promise<Conference | undefined> {
    const [conference] = await db.select().from(conferences).where(eq(conferences.id, id));
    return conference;
  }

  async getConferenceByMap(mapNumber: string): Promise<Conference | undefined> {
    const [conference] = await db.select().from(conferences).where(eq(conferences.mapNumber, mapNumber));
    return conference;
  }

  async createConference(conference: InsertConference): Promise<Conference> {
    const [created] = await db.insert(conferences).values(conference).returning();
    return created;
  }

  // LÓGICA DE CONFERÊNCIA: Atualiza status e registra data de término
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

  // WMS Items
  async getWmsItemsByMap(mapNumber: string): Promise<WmsItem[]> {
    const normalizedMap = String(mapNumber).trim().toUpperCase();
    const results = await db.select().from(wmsItems)
      .where(sql`upper(trim(${wmsItems.mapNumber})) = ${normalizedMap}`);
    return results;
  }

  async getWmsItem(id: number): Promise<WmsItem | undefined> {
    const [item] = await db.select().from(wmsItems).where(eq(wmsItems.id, id));
    return item;
  }

  // LÓGICA DE CONFERÊNCIA: Salva os dados do item conferido
  async updateWmsItem(id: number, updates: UpdateWmsItemRequest): Promise<WmsItem> {
    const [updated] = await db.update(wmsItems)
      .set({
        ...updates,
        isChecked: true // Força como conferido ao atualizar
      })
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
        const chunk = items.slice(i, i + chunkSize);
        await db.insert(wmsItems).values(chunk);
      }
    } catch (error) {
      console.error("❌ ERRO NO UPLOAD:", error);
      throw error;
    }
  }

  // Promax Data
  async bulkInsertPromaxData(items: any[]): Promise<void> {
    if (items.length === 0) return;
    for (const item of items) {
      const [driver] = await db.select()
        .from(driverBase)
        .where(eq(driverBase.registration, item.motorista));
      const driverName = driver ? driver.name : `Matrícula: ${item.motorista}`;

      await db.update(wmsItems)
        .set({ plate: driverName })
        .where(eq(wmsItems.mapNumber, item.mapa));

      await db.insert(promaxData).values({
        mapa: item.mapa,
        motorista: driverName,
      });
    }
  }

  // Driver Base
  async bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void> {
    if (items.length === 0) return;
    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db.insert(driverBase).values(chunk);
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const allConferences = await db.select().from(conferences);
    const totalConferences = allConferences.length;

    let averageTimeMinutes = 0;
    const completedConferences = allConferences.filter(c => c.status === "completed" && c.startTime && c.endTime);
    if (completedConferences.length > 0) {
      const totalTimeMs = completedConferences.reduce((acc, c) => {
        return acc + (c.endTime!.getTime() - c.startTime!.getTime());
      }, 0);
      averageTimeMinutes = (totalTimeMs / completedConferences.length) / 60000;
    }

    const allItems = await db.select().from(wmsItems);
    const totalItems = allItems.length;
    let divergencePercentage = 0;
    let damagePercentage = 0;
    let partialCountPercentage = 0;

    if (totalItems > 0) {
      const divergences = allItems.filter(i => i.isChecked && i.checkedQuantity !== null && i.checkedQuantity !== i.expectedQuantity).length;
      divergencePercentage = (divergences / totalItems) * 100;

      const damaged = allItems.filter(i => i.hasDamage).length;
      damagePercentage = (damaged / totalItems) * 100;

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