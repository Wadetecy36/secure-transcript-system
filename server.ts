import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import { initDb } from "./backend/models/database.ts";
import authRoutes from "./backend/routes/authRoutes.ts";
import transcriptRoutes from "./backend/routes/transcriptRoutes.ts";
import adminRoutes from "./backend/routes/adminRoutes.ts";
import fileRoutes from "./backend/routes/fileRoutes.ts";
import { seed } from "./seed.ts";

import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', 1);

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  
  // 1. Initial State & Basic Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })); 

  // 2. Logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
  });

  // 3. API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/transcripts", transcriptRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/files", fileRoutes);

  // 4. Database Setup (Internal)
  try {
    initDb();
    await seed();
    console.log("Database online.");
  } catch (err) {
    console.error("Database error:", err);
  }

  // 5. Tooling (Vite)
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite development server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Final Listen
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Service active on port ${PORT}`);
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled ERROR:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error (Global)',
      message: err.message || String(err),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
  process.exit(1);
});
