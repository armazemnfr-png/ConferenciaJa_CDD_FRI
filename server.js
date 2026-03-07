import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

// --- VARIÁVEIS GLOBAIS ---
let baseMotoristas = []; // Declarada apenas uma vez aqui no topo

app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// --- MÓDULO DE ENTREGA (WMS) ---

app.post("/api/upload-wms", async (req, res) => {
  try {
    const { items } = req.body;
    console.log("📥 Recebendo upload de CSV WMS...");

    const result = await prisma.itemMapa.createMany({
      data: items.map((item) => ({
        mapa: String(item["Mapas"] || ""),
        motorista: String(item["Placa"] || ""),
        codigoItem: String(item["Código do item"] || ""),
        descricao: String(item["Item"] || ""),
        quantidade: Number(item["Qtd"]) || 0,
        unidade: String(item["Unidade"] || ""),
        paleteCompleto: String(item["Palete"] || ""),
        baia: String(item["Palete"] || ""),
        conferido: false,
      })),
    });

    console.log(`✅ ${result.count} itens do WMS salvos!`);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error("❌ Erro no WMS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NOVO MÓDULO: BASE MOTORISTA (MOT) ---

app.post('/api/motoristas/upload', (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Dados inválidos ou vazios." });
    }

    const novosMotoristas = items.map(row => ({
      matricula: String(row['Matrícula'] || row['MATRICULA'] || "").trim(),
      nome: String(row['Colaborador'] || row['COLABORADOR'] || "").trim(),
      sala: String(row['Sala'] || row['SALA'] || "").trim(),
      importadoEm: new Date()
    })).filter(m => m.matricula && m.nome);

    if (novosMotoristas.length === 0) {
      throw new Error("Cabeçalhos esperados: Matrícula, Colaborador, Sala.");
    }

    baseMotoristas = novosMotoristas; 
    console.log(`✅ Base de Motoristas atualizada: ${novosMotoristas.length} registros.`);

    res.status(200).json({ 
      message: `${novosMotoristas.length} colaboradores importados com sucesso!`,
      count: novosMotoristas.length 
    });
  } catch (error) {
    console.error("❌ Erro no upload MOT:", error);
    res.status(500).json({ message: error.message });
  }
});

// --- MÓDULO MATINAL PLAY ---

app.get("/api/matinals", async (req, res) => {
  try {
    const historico = await prisma.matinal.findMany({
      orderBy: { date: "desc" },
    });
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/matinals", async (req, res) => {
  try {
    const { roomName, fixedStartTime, durationMinutes, actualEndTime } = req.body;
    const novaMatinal = await prisma.matinal.create({
      data: {
        roomName,
        fixedStartTime,
        durationMinutes: parseInt(durationMinutes),
        actualEndTime: new Date(actualEndTime),
        date: new Date(),
      },
    });
    res.json(novaMatinal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- INICIALIZAÇÃO ---
// Ajustei a porta para 3001 conforme seu console.log
app.listen(3001, "0.0.0.0", () => {
  console.log("------------------------------------------");
  console.log("✅ SERVIDOR CORRIGIDO E RODANDO!");
  console.log("🚀 Portas ativas: 3001");
  console.log("------------------------------------------");
});