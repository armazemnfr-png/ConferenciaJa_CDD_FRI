import { db } from "./db";
import {
  conferences,
  wmsItems,
  promaxData,
  driverBase,
  matinals,
  ginfoChecklist,
  type Conference,
  type WmsItem,
  type PromaxData,
  type DriverBase,
  type Matinal,
  type GinfoChecklist,
  type InsertGinfoChecklist,
  type InsertConference,
  type InsertWmsItem,
  type InsertDriverBase,
  type InsertMatinal,
  type UpdateConferenceRequest,
  type UpdateWmsItemRequest,
  type DashboardMetrics
} from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";

// Normaliza matrícula: remove zeros à esquerda de strings numéricas
// Ex: "006" → "6", "06" → "6", "6" → "6", "ABC" → "ABC"
function normalizeReg(s: string): string {
  const trimmed = (s || "").trim();
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? trimmed : String(num);
}

export type ConferenceWithMetrics = Conference;

export interface IStorage {
  getMatinals(): Promise<Matinal[]>;
  createMatinal(matinal: InsertMatinal): Promise<Matinal>;
  getConferences(filters?: any): Promise<Conference[]>;
  getConference(id: number): Promise<Conference | undefined>;
  getConferenceByMap(mapNumber: string): Promise<Conference | undefined>;
  createConference(conference: InsertConference): Promise<Conference>;
  updateConference(id: number, updates: UpdateConferenceRequest): Promise<Conference>;
  getWmsItemsByMap(mapNumber: string): Promise<WmsItem[]>;
  getWmsItem(id: number): Promise<WmsItem | undefined>;
  updateWmsItem(id: number, updates: UpdateWmsItemRequest): Promise<WmsItem>;
  bulkInsertWmsItems(items: InsertWmsItem[]): Promise<void>;
  bulkInsertPromaxData(items: any[]): Promise<void>;
  getPromaxByDriver(registration: string): Promise<PromaxData | undefined>;
  bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void>;
  getDriverByRegistration(registration: string): Promise<DriverBase | undefined>;
  getAllDrivers(): Promise<DriverBase[]>;
  getDashboardMetrics(filters?: any): Promise<DashboardMetrics>;
  getMetricsByRoom(filters?: { startDate?: string; endDate?: string }): Promise<{ room: string; avgMinutes: number; count: number }[]>;
  getDriversWithoutRoom(filters?: { startDate?: string; endDate?: string }): Promise<{ driverId: string; maps: string[]; count: number }[]>;
  getDriverRanking(filters?: { startDate?: string; endDate?: string }): Promise<{ room: string; top: any[]; bottom: any[] }[]>;
  bulkInsertGinfoChecklist(items: InsertGinfoChecklist[]): Promise<void>;
  getGinfoChecklist(): Promise<GinfoChecklist[]>;
  getAdherenceReport(): Promise<{
    totalMaps: number;
    conferencedMaps: number;
    adherencePercentage: number;
    maps: {
      mapNumber: string;
      status: 'completed' | 'in_progress' | 'not_started';
      driverId: string | null;
      driverName: string | null;
      completedAt: string | null;
    }[];
  }>;
  deleteConference(id: number): Promise<void>;
  deleteMatinal(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAdherenceReport() {
    // 1. Todos os mapas esperados (do WMS upload)
    const wmsRows = await db.selectDistinct({ mapNumber: wmsItems.mapNumber }).from(wmsItems);
    const expectedMaps = new Set(wmsRows.map(r => r.mapNumber.trim()));

    // 2. Todas as conferências (qualquer status) para saber driverId e status por mapa
    const allConfs = await db.select().from(conferences);
    // Mapa de mapNumber → melhor conference (completed > in_progress > pending)
    const statusPriority: Record<string, number> = { completed: 3, in_progress: 2, pending: 1 };
    const confByMap = new Map<string, typeof allConfs[0]>();
    for (const c of allConfs) {
      const key = c.mapNumber.trim();
      const existing = confByMap.get(key);
      if (!existing || (statusPriority[c.status] ?? 0) > (statusPriority[existing.status] ?? 0)) {
        confByMap.set(key, c);
      }
    }

    // 3. Motoristas pelo driverBase para resolver nomes
    const allDrivers = await db.select().from(driverBase);
    const nameByReg = new Map<string, string>();
    allDrivers.forEach(d => nameByReg.set(normalizeReg(d.registration), d.name));

    // 4. Promax para motoristas dos mapas que nunca foram iniciados
    const allPromax = await db.select({ mapa: promaxData.mapa, motorista: promaxData.motorista }).from(promaxData);
    const promaxByMap = new Map<string, string>();
    allPromax.forEach(p => { if (p.mapa) promaxByMap.set(p.mapa.trim(), p.motorista ?? ""); });

    // 5. Montar relatório
    const maps: {
      mapNumber: string;
      status: 'completed' | 'in_progress' | 'not_started';
      driverId: string | null;
      driverName: string | null;
      completedAt: string | null;
    }[] = [];

    for (const mapNumber of expectedMaps) {
      const conf = confByMap.get(mapNumber);
      let status: 'completed' | 'in_progress' | 'not_started';
      if (!conf) {
        status = 'not_started';
      } else if (conf.status === 'completed') {
        status = 'completed';
      } else {
        status = 'in_progress';
      }

      const driverId = conf?.driverId ?? null;
      let driverName: string | null = null;
      if (driverId) {
        driverName = nameByReg.get(normalizeReg(driverId)) ?? null;
      }
      // Fallback: promax
      if (!driverName) {
        const promaxName = promaxByMap.get(mapNumber);
        if (promaxName) driverName = promaxName;
      }

      maps.push({
        mapNumber,
        status,
        driverId,
        driverName,
        completedAt: conf?.endTime ? conf.endTime.toISOString() : null,
      });
    }

    // Ordenar: não iniciados primeiro, depois em progresso, depois concluídos; dentro de cada grupo, por mapa
    const order = { not_started: 0, in_progress: 1, completed: 2 };
    maps.sort((a, b) => order[a.status] - order[b.status] || a.mapNumber.localeCompare(b.mapNumber));

    const conferencedMaps = maps.filter(m => m.status === 'completed').length;
    const totalMaps = maps.length;
    const adherencePercentage = totalMaps > 0 ? Math.round((conferencedMaps / totalMaps) * 100) : 0;

    return { totalMaps, conferencedMaps, adherencePercentage, maps };
  }

  async getDriverRanking(filters?: { startDate?: string; endDate?: string }): Promise<{ room: string; top: any[]; bottom: any[] }[]> {
    // Todos os motoristas com sala cadastrada
    const allDrivers = await db.select().from(driverBase);
    const driverMap = new Map<string, { name: string; room: string }>();
    allDrivers.forEach(d => driverMap.set(normalizeReg(d.registration), { name: d.name, room: d.room }));

    // Conferências finalizadas com tempo válido (respeitando filtro de data)
    const allConfs = (await this.getConferences({ ...filters, status: "completed" })).filter(c => c.status === "completed");

    // Calcular duração por motorista
    const driverStats = new Map<string, { totalMin: number; count: number }>();
    for (const conf of allConfs) {
      if (!conf.startTime || !conf.endTime) continue;
      const durationMin = (new Date(conf.endTime).getTime() - new Date(conf.startTime).getTime()) / 60000;
      if (durationMin <= 0 || durationMin > 600) continue;
      const reg = normalizeReg(conf.driverId || "");
      if (!reg) continue;
      const cur = driverStats.get(reg) ?? { totalMin: 0, count: 0 };
      driverStats.set(reg, { totalMin: cur.totalMin + durationMin, count: cur.count + 1 });
    }

    // Montar lista de drivers com sala e métricas
    const entries: { registration: string; name: string; room: string; avgMinutes: number; count: number }[] = [];
    for (const [reg, stats] of driverStats) {
      const info = driverMap.get(reg);
      if (!info || !info.room) continue;
      entries.push({
        registration: reg,
        name: info.name,
        room: info.room,
        avgMinutes: stats.totalMin / stats.count,
        count: stats.count,
      });
    }

    // Agrupar por sala
    const byRoom = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = byRoom.get(entry.room) ?? [];
      list.push(entry);
      byRoom.set(entry.room, list);
    }

    const result: { room: string; top: any[]; bottom: any[] }[] = [];
    for (const [room, list] of byRoom) {
      const sorted = [...list].sort((a, b) => a.avgMinutes - b.avgMinutes);
      const top = sorted.slice(0, 3);
      const bottom = sorted.length > 3 ? sorted.slice(-3).reverse() : [];
      result.push({ room, top, bottom });
    }

    return result.sort((a, b) => a.room.localeCompare(b.room));
  }

  async bulkInsertGinfoChecklist(items: InsertGinfoChecklist[]): Promise<void> {
    if (items.length === 0) return;
    // Acumula sem truncar — cada upload adiciona novos registros
    await db.insert(ginfoChecklist).values(items);
  }

  async getGinfoChecklist(): Promise<GinfoChecklist[]> {
    return await db.select().from(ginfoChecklist).orderBy(desc(ginfoChecklist.importedAt));
  }

  async deleteConference(id: number): Promise<void> {
    await db.delete(conferences).where(eq(conferences.id, id));
  }

  async deleteMatinal(id: number): Promise<void> {
    await db.delete(matinals).where(eq(matinals.id, id));
  }

  async getMatinals(): Promise<Matinal[]> {
    return await db.select().from(matinals);
  }

  async createMatinal(matinal: InsertMatinal): Promise<Matinal> {
    const [created] = await db.insert(matinals).values(matinal).returning();
    return created;
  }

  async getConferences(filters?: any): Promise<Conference[]> {
    const conditions = [];
    if (filters?.driverId) conditions.push(eq(conferences.driverId, filters.driverId));
    if (filters?.mapNumber) conditions.push(sql`upper(trim(${conferences.mapNumber})) = ${filters.mapNumber.trim().toUpperCase()}`);

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

    return await db.select().from(conferences)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(conferences.startTime));
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
      startTime: new Date(),
      mapNumber: conference.mapNumber.trim().toUpperCase()
    }).returning();
    return created;
  }

  async updateConference(id: number, updates: UpdateConferenceRequest): Promise<Conference> {
    let finalUpdates = { ...updates };

    if (updates.status === 'completed') {
      const currentConf = await this.getConference(id);
      if (currentConf) {
        const items = await this.getWmsItemsByMap(currentConf.mapNumber);
        finalUpdates.hasDivergence = items.some(i => i.isChecked && i.checkedQuantity !== null && i.checkedQuantity !== i.expectedQuantity);
        finalUpdates.hasDamage = items.some(i => i.hasDamage === true);
        finalUpdates.endTime = new Date();
      }
    }

    const [updated] = await db.update(conferences)
      .set(finalUpdates)
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
    await db.execute(sql`TRUNCATE TABLE wms_items RESTART IDENTITY CASCADE`);
    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      await db.insert(wmsItems).values(items.slice(i, i + chunkSize));
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
    const normalized = normalizeReg(registration);
    // Busca todos e compara normalizados (resolve "006" == "6")
    const all = await db.select().from(driverBase);
    return all.find(d => normalizeReg(d.registration) === normalized);
  }

  async getAllDrivers(): Promise<DriverBase[]> {
    return await db.select().from(driverBase).orderBy(driverBase.name);
  }

  async bulkInsertDriverBase(items: InsertDriverBase[]): Promise<void> {
    if (items.length === 0) return;
    await db.execute(sql`TRUNCATE TABLE driver_base RESTART IDENTITY CASCADE`);
    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      await db.insert(driverBase).values(items.slice(i, i + chunkSize));
    }
  }

  async getDriversWithoutRoom(filters?: { startDate?: string; endDate?: string }): Promise<{ driverId: string; maps: string[]; count: number }[]> {
    const drivers = await db.select().from(driverBase);
    const knownRegistrations = new Set(drivers.map(d => normalizeReg(d.registration)));

    const completed = (await this.getConferences(filters)).filter(c => c.status === "completed");

    const map = new Map<string, string[]>();
    for (const conf of completed) {
      const id = normalizeReg(conf.driverId ?? "");
      if (!id || knownRegistrations.has(id)) continue;
      const existing = map.get(id) ?? [];
      existing.push(conf.mapNumber);
      map.set(id, existing);
    }

    return Array.from(map.entries())
      .map(([driverId, maps]) => ({ driverId, maps, count: maps.length }))
      .sort((a, b) => b.count - a.count);
  }

  async getMetricsByRoom(filters?: { startDate?: string; endDate?: string }): Promise<{ room: string; avgMinutes: number; count: number }[]> {
    // Busca todos os motoristas com sala definida
    const drivers = await db.select().from(driverBase);
    const roomByRegistration = new Map<string, string>();
    for (const d of drivers) {
      if (d.registration && d.room) {
        roomByRegistration.set(normalizeReg(d.registration), d.room.trim());
      }
    }

    // Busca conferências finalizadas com tempo válido (respeitando filtro de data)
    const completed = (await this.getConferences(filters))
      .filter(c => c.status === "completed" && c.startTime && c.endTime);

    // Agrupa por sala
    const roomMap = new Map<string, { total: number; count: number }>();
    for (const conf of completed) {
      const room = roomByRegistration.get(normalizeReg(conf.driverId ?? "")) ?? "Sem Sala";
      const diffMs = new Date(conf.endTime!).getTime() - new Date(conf.startTime!).getTime();
      const diffMin = diffMs / 60000;
      if (diffMin < 0.1 || diffMin > 360) continue; // descarta outliers

      const entry = roomMap.get(room) ?? { total: 0, count: 0 };
      entry.total += diffMin;
      entry.count += 1;
      roomMap.set(room, entry);
    }

    return Array.from(roomMap.entries())
      .map(([room, { total, count }]) => ({
        room,
        avgMinutes: Number((total / count).toFixed(3)),
        count,
      }))
      .sort((a, b) => a.room.localeCompare(b.room));
  }

  async getDashboardMetrics(filters?: any): Promise<DashboardMetrics> {
    const filteredConferences = await this.getConferences(filters);
    const completed = filteredConferences.filter(c => c.status === "completed");

    let totalItems = 0;
    let totalDivergences = 0;
    let totalDamages = 0;
    let totalMinutes = 0;
    let validTimeCount = 0;

    for (const conf of completed) {
      const items = await this.getWmsItemsByMap(conf.mapNumber);
      totalItems += items.length;
      totalDivergences += items.filter(i => i.isChecked && i.checkedQuantity !== null && i.checkedQuantity !== i.expectedQuantity).length;
      totalDamages += items.filter(i => i.hasDamage).length;

      if (conf.startTime && conf.endTime) {
        const start = new Date(conf.startTime).getTime();
        const end = new Date(conf.endTime).getTime();
        const diff = (end - start) / 60000;

        if (diff > 0.1 && diff < 360) {
          totalMinutes += diff;
          validTimeCount++;
        }
      }
    }

    const averageTimeMinutes = validTimeCount > 0 ? totalMinutes / validTimeCount : 0;
    const denominator = totalItems || 1;

    return {
      totalConferences: filteredConferences.length,
      averageTimeMinutes,
      divergencePercentage: Number(((totalDivergences / denominator) * 100).toFixed(1)),
      damagePercentage: Number(((totalDamages / denominator) * 100).toFixed(1)),
      partialCountPercentage: 0
    };
  }
}

export const storage = new DatabaseStorage();