import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Resolve to the dist folder where Vite outputs the client build
  const distPath = path.resolve(__dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files (includes sw.js, manifest.webmanifest, and all assets)
  app.use(express.static(distPath, {
    maxAge: "1d",
    etag: false,
  }));

  // Explicitly serve manifest and service worker with proper headers
  app.get("/manifest.webmanifest", (_req, res) => {
    res.type("application/manifest+json");
    res.sendFile(path.join(distPath, "manifest.webmanifest"));
  });

  app.get("/sw.js", (_req, res) => {
    res.type("application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(path.join(distPath, "sw.js"));
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
