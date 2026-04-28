import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(
  express.json({
    limit: "100mb",
  })
);
app.use(express.urlencoded({ limit: "100mb", extended: false }));

const httpServer = createServer(app);

let initPromise: Promise<void> | null = null;

function ensureInit() {
  if (!initPromise) {
    initPromise = registerRoutes(httpServer, app).then(() => {});
  }
  return initPromise;
}

export default async function handler(req: Request, res: Response) {
  await ensureInit();
  app(req, res);
}
