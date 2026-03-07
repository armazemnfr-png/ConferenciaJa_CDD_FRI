import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerAuthRoutes(app);

  // Matinals
  app.get(api.matinals.list.path, async (req, res) => {
    const data = await storage.getMatinals();
    res.json(data);
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

  // Conferences
  app.get(api.conferences.list.path, async (req, res) => {
    const data = await storage.getConferences();
    res.json(data);
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

  app.post("/api/conferences/finish/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateConference(id, {
        status: "completed",
        endTime: new Date()
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Erro ao finalizar no banco" });
    }
  });

  app.get(api.conferences.dashboard.path, async (req, res) => {
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  });

  app.get("/api/conferences/completed", async (_req, res) => {
    try {
      const data = await storage.getCompletedConferences();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar histórico" });
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

  app.post(api.wmsItems.upload.path, async (req, res) => {
    try {
      const input = api.wmsItems.upload.input.parse(req.body);
      await storage.bulkInsertWmsItems(input.items);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  /**
   * ROTA DE ITENS CORRIGIDA
   * Prioriza encontrar os produtos para o motorista não ficar travado.
   */
  app.get('/api/itens/:mapNumber', async (req, res) => {
    try {
      const mapNumber = req.params.mapNumber.trim();
      const driverCode = req.query.driverCode as string;

      const rawData = await storage.getWmsItemsByMap(mapNumber);

      if (!rawData || rawData.length === 0) {
        return res.status(404).json({ message: "Mapa não encontrado no banco de dados." });
      }

      // 2. Busca ou cria a conferência (Dashboard)
      let conferenceId: number | undefined;
      try {
        let conference = await storage.getConferenceByMap(mapNumber);
        if (!conference) {
          conference = await storage.createConference({
            mapNumber,
            driverId: driverCode || "N/A",
            status: "in_progress",
            startTime: new Date()
          });
        } else if (driverCode && conference.driverId === "N/A") {
          await storage.updateConference(conference.id, { driverId: driverCode });
        }
        conferenceId = conference.id;
      } catch (e) {
        console.error("Aviso: Falha ao registrar conferência.");
      }

      const formattedData = rawData.map((item: any) => ({
        id: item.id,
        conferenceId: conferenceId, 
        item: (item.description || "PRODUTO SEM NOME").toUpperCase(),
        qtd: item.expectedQuantity ?? 0,
        codigoDoItem: item.sku || "N/A",
        conferido: !!item.isChecked,
        bay_number: item.bayNumber,
        sequence: item.sequence,
        unitOfMeasure: item.unitOfMeasure
      }));

      res.json(formattedData);
    } catch (err) {
      console.error("Erro interno na rota de itens:", err);
      res.status(500).json({ message: "Erro no servidor ao carregar itens." });
    }
  });

  return httpServer;
}