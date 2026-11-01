import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import app from "./app.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5000;
const clientDir = path.resolve(__dirname, "../client");

async function startServer() {
  const isClientBuilt = fs.existsSync(path.resolve(clientDir, ".next"));
  const dev = process.env.NODE_ENV !== "production" && !isClientBuilt;

  try {
    const nextEntry = pathToFileURL(
      path.resolve(clientDir, "node_modules/next/dist/server/next.js")
    ).href;
    const nextModule = await import(nextEntry);
    const next = nextModule.default || nextModule;
    const nextApp = next({ dev, dir: clientDir });
    const handle = nextApp.getRequestHandler();

    console.log(`[Unified Server] Loading Next.js frontend in ${dev ? "development" : "production"} mode...`);
    await nextApp.prepare();

    // Serve Next.js static files directly for maximum throughput
    app.use("/_next", express.static(path.resolve(clientDir, ".next")));
    app.use(express.static(path.resolve(clientDir, "public")));

    // Route all non-API web traffic to Next.js (SSR + static pages + client routing)
    app.all("*", (req, res) => {
      return handle(req, res);
    });

    console.log(`[Unified Server] Next.js frontend mounted cleanly on port ${PORT}`);
  } catch (err) {
    console.warn("[Unified Server Warning] Could not attach Next.js directly:", err.message);
    app.get("/", (req, res) => {
      res.json({ message: `NK-SHOES API is running on port ${PORT}` });
    });
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 NK-SHOES UNIFIED APPLICATION RUNNING ON PORT ${PORT}`);
    console.log(`🌐 Storefront: http://localhost:${PORT}`);
    console.log(`🛡️  Admin Portal: http://localhost:${PORT}/admin`);
    console.log(`⚡ REST API:   http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer();
