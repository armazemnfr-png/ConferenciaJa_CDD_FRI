import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- PROTEÇÃO SIMPLES DO PAINEL ADMIN ---
  app.post("/api/admin/verify", (req: Request, res: Response) => {
    const received = String(req.body?.password ?? "").trim();
    const correctPassword = (process.env.ADMIN_PASSWORD ?? "Ambev@123").trim();

    console.log("[admin/verify] ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD ? "Configurada" : "Vazia (usando padrão)");
    console.log("[admin/verify] comprimento esperado:", correctPassword.length, "| recebido:", received.length);
    console.log("[admin/verify] preview esperado:", correctPassword.slice(0, 3) + "***");
    console.log("[admin/verify] bate?", received === correctPassword);

    if (received === correctPassword) {
      return res.json({ ok: true });
    }
    return res.status(401).json({
      ok: false,
      message: "Senha incorreta.",
      hint: `esperado ${correctPassword.length} chars, recebido ${received.length} chars`,
    });
  });

  // --- DIAGNÓSTICO GERAL (remover após configurar) ---
  app.get("/api/check-env", async (_req: Request, res: Response) => {
    const pw = (process.env.ADMIN_PASSWORD ?? "").trim();
    const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

    let dbOk = false;
    let dbError = "";
    try {
      const { pool } = await import("./db");
      const result = await pool.query("SELECT 1 AS ok");
      dbOk = result.rows[0]?.ok === 1;
    } catch (err: any) {
      dbError = err?.message ?? "erro desconhecido";
    }

    res.json({
      admin_password: pw ? `Configurada (${pw.length} chars, começa com "${pw.slice(0, 3)}")` : "NÃO CONFIGURADA – usando padrão Ambev@123",
      database_url: dbUrl ? "Configurada" : "NÃO CONFIGURADA",
      database_conectada: dbOk ? "SIM ✓" : `NÃO ✗ – ${dbError}`,
      node_env: process.env.NODE_ENV ?? "não definido",
    });
  });

  app.get("/api/admin/debug-pw", (_req: Request, res: Response) => {
    const pw = (process.env.ADMIN_PASSWORD ?? "Ambev@123").trim();
    res.json({
      defined: !!process.env.ADMIN_PASSWORD,
      length: pw.length,
      preview: pw.slice(0, 3) + "*".repeat(Math.max(0, pw.length - 3)),
    });
  });

  // --- ROTA DE VALIDAÇÃO DE MOTORISTA (LOGIN INTELIGENTE) ---
  app.get("/api/driver/check/:registration", async (req, res) => {
    try {
      const { registration } = req.params;
      const driver = await storage.getDriverByRegistration(registration);
      if (!driver) {
        return res.status(404).json({ 
          message: "Matrícula não encontrada na base de motoristas (MOT)." 
        });
      }
      const promaxEntry = await storage.getPromaxByDriver(registration);
      res.json({
        success: true,
        nome: driver.name,
        sala: driver.room,
        mapa: promaxEntry ? promaxEntry.mapa : null,
        message: promaxEntry 
          ? `Bem-vindo, ${driver.name}!` 
          : `Olá ${driver.name}, não encontramos mapa na fase 'CARREGADO' para você.`
      });
    } catch (err) {
      console.error("Erro ao validar motorista:", err);
      res.status(500).json({ message: "Erro interno ao validar matrícula." });
    }
  });

  // Matinals
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar motoristas" });
    }
  });

  // --- GINFO CHECKLIST ---
  app.post("/api/ginfo/upload", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Nenhum item enviado." });
      }
      await storage.bulkInsertGinfoChecklist(items);
      res.json({ success: true, count: items.length });
    } catch (err) {
      console.error("Erro ao importar Ginfo:", err);
      res.status(500).json({ message: "Erro ao importar checklist Ginfo." });
    }
  });

  app.get("/api/ginfo", async (req, res) => {
    try {
      const data = await storage.getGinfoChecklist();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar checklist Ginfo." });
    }
  });

  app.get("/api/tml", async (req, res) => {
    try {
      const data = await storage.getTmlData();
      res.json(data);
    } catch (err) {
      console.error("Erro ao calcular TML:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/portaria", async (req, res) => {
    try {
      const data = await storage.getPortariaData();
      res.json(data);
    } catch (err) {
      console.error("Erro ao buscar dados da portaria:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/dashboard/adherencia", async (req, res) => {
    try {
      const data = await storage.getAdherenceReport();
      res.json(data);
    } catch (err) {
      console.error("Erro ao calcular aderência:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/dashboard/ranking", async (req, res) => {
    try {
      const filters = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };
      const data = await storage.getDriverRanking(filters);
      res.json(data);
    } catch (err) {
      console.error("Erro ao buscar ranking:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/dashboard/sem-sala", async (req, res) => {
    try {
      const filters = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };
      const data = await storage.getDriversWithoutRoom(filters);
      res.json(data);
    } catch (err) {
      console.error("Erro ao buscar motoristas sem sala:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/dashboard/by-room", async (req, res) => {
    try {
      const filters = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };
      const data = await storage.getMetricsByRoom(filters);
      res.json(data);
    } catch (err) {
      console.error("Erro ao buscar métricas por sala:", err);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get(api.matinals.list.path, async (req, res) => {
    const data = await storage.getMatinals();
    res.json(data);
  });

  app.delete("/api/matinals/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });
      await storage.deleteMatinal(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Erro ao excluir matinal" });
    }
  });

  app.post(api.matinals.create.path, async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.actualEndTime === 'string') {
        body.actualEndTime = new Date(body.actualEndTime);
      }
      const input = api.matinals.create.input.parse(body);
      const created = await storage.createMatinal(input);
      res.status(200).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create matinal" });
    }
  });

  // Conferences - Listagem com Filtros
  app.get(api.conferences.list.path, async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        driverId: req.query.driverId as string,
        mapNumber: req.query.mapNumber as string,
      };
      const data = await storage.getConferences(filters);
      res.json(data);
    } catch (err) {
      console.error("Erro ao listar conferências:", err);
      res.status(500).json({ message: "Erro ao buscar lista de conferências" });
    }
  });

  app.get(api.conferences.get.path, async (req, res) => {
    const data = await storage.getConferenceByMap(req.params.mapNumber);
    if (!data) {
      return res.status(404).json({ message: "Conference not found" });
    }
    res.json(data);
  });

  app.post(api.conferences.start.path, async (req, res) => {
    try {
      const input = api.conferences.start.input.parse(req.body);
      let conference = await storage.getConferenceByMap(input.mapNumber);

      if (!conference) {
        conference = await storage.createConference({
          mapNumber: input.mapNumber,
          driverId: input.driverId || "N/A",
          status: "in_progress",
          startTime: new Date()
        });
      } else if (conference.status === "pending") {
        conference = await storage.updateConference(conference.id, {
          status: "in_progress",
          driverId: input.driverId,
          startTime: new Date()
        });
      }
      res.status(200).json(conference);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard Metrics
  app.get(api.conferences.dashboard.path, async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        driverId: req.query.driverId as string,
        mapNumber: req.query.mapNumber as string,
      };
      const metrics = await storage.getDashboardMetrics(filters);
      res.json(metrics);
    } catch (err) {
      console.error("Erro ao processar dashboard:", err);
      res.status(500).json({ message: "Erro ao calcular métricas do dashboard" });
    }
  });

  // Finalizar Conferência
  app.post("/api/conferences/finish-by-map/:mapNumber", async (req, res) => {
    try {
      const { mapNumber } = req.params;
      const conference = await storage.getConferenceByMap(mapNumber);
      if (!conference) {
        return res.status(404).json({ message: "Conferência não encontrada." });
      }
      const updated = await storage.updateConference(conference.id, {
        status: "completed",
        endTime: new Date()
      });
      res.json(updated);
    } catch (err) {
      console.error("Erro ao finalizar mapa:", err);
      res.status(500).json({ message: "Erro interno ao finalizar." });
    }
  });

  // WMS Items
  app.get('/api/wms-items/list/:mapNumber', async (req, res) => {
    try {
      const data = await storage.getWmsItemsByMap(req.params.mapNumber);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar itens" });
    }
  });

  app.patch(api.wmsItems.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.wmsItems.update.input.parse(req.body);
      const updated = await storage.updateWmsItem(id, input);
      res.json(updated);
    } catch (err) {
      res.status(404).json({ message: "Item not found" });
    }
  });

  // --- UPLOADS ---
  app.post('/api/promax/upload', async (req, res) => {
    try {
      await storage.bulkInsertPromaxData(req.body.items);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post('/api/motoristas/upload', async (req, res) => {
    try {
      await storage.bulkInsertDriverBase(req.body.items);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // --- UPLOADS (CAMINHO DIRETO PARA EVITAR BLOQUEIO) ---
  app.post('/api/promax/upload', async (req, res) => {
    try {
      await storage.bulkInsertPromaxData(req.body.items);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Erro no upload Promax:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post('/api/motoristas/upload', async (req, res) => {
    try {
      await storage.bulkInsertDriverBase(req.body.items);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Erro no upload Motoristas:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Alteramos aqui de api.wmsItems.upload.path para a string direta
  app.post('/api/wms-items/upload', async (req, res) => {
    try {
      // O seu código original usava z.parse, vamos simplificar para garantir o fluxo
      if (!req.body.items) {
        return res.status(400).json({ message: "Nenhum item enviado" });
      }
      await storage.bulkInsertWmsItems(req.body.items);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Erro no upload WMS:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.delete("/api/conferences/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await storage.deleteConference(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar mapa" });
    }
  });

  // Busca de itens para o coletor
  app.get('/api/itens/:mapNumber', async (req, res) => {
    try {
      const mapNumber = req.params.mapNumber.trim();
      const driverCode = req.query.driverCode as string;
      const rawData = await storage.getWmsItemsByMap(mapNumber);

      if (!rawData || rawData.length === 0) {
        return res.status(404).json({ message: "Mapa não encontrado." });
      }

      let conference = await storage.getConferenceByMap(mapNumber);
      if (!conference) {
        conference = await storage.createConference({
          mapNumber,
          driverId: driverCode || "N/A",
          status: "in_progress",
          startTime: new Date()
        });
      }

      const formattedData = rawData.map((item: any) => ({
        id: item.id,
        item: (item.description || "PRODUTO SEM NOME").toUpperCase(),
        qtd: item.expectedQuantity ?? 0,
        codigoDoItem: item.sku || "N/A",
        conferido: !!item.isChecked,
        isChecked: !!item.isChecked,
        bay_number: item.bayNumber,
        sequence: item.sequence,
        unitOfMeasure: item.unitOfMeasure,
        qtd_contada: (item.checkedQuantity !== null && item.checkedQuantity !== undefined && item.checkedQuantity > 0) ? item.checkedQuantity : undefined,
        temAvaria: !!item.hasDamage,
      }));

      res.json(formattedData);
    } catch (err) {
      res.status(500).json({ message: "Erro no servidor ao carregar itens." });
    }
  });

  return httpServer;
}