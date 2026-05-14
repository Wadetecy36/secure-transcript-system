import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
<<<<<<< HEAD
import { initDb } from "./backend/models/database.ts";
=======
import compression from "compression";
import { pinoHttp } from "pino-http";
import db, { initDb } from "./backend/models/database.ts";
>>>>>>> master
import authRoutes from "./backend/routes/authRoutes.ts";
import transcriptRoutes from "./backend/routes/transcriptRoutes.ts";
import adminRoutes from "./backend/routes/adminRoutes.ts";
import fileRoutes from "./backend/routes/fileRoutes.ts";
import { seed } from "./seed.ts";
<<<<<<< HEAD

import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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
=======
import { config } from "./backend/config.ts";
import { globalRateLimiter } from "./backend/middleware/rateLimitMiddleware.ts";
import { logger } from "./backend/logger.ts";

async function startServer() {
  const app = express();
  const PORT = config.PORT;

  app.set('trust proxy', 1);

  logger.info(`Starting server in ${config.NODE_ENV} mode`);
  if (process.env.AUTO_VERIFY === 'true') {
    logger.info('AUTO_VERIFY is ENABLED - 2FA and Email verification will be bypassed or auto-filled.');
  }
  
  // 1. Initial State & Basic Middleware
  app.use(pinoHttp({ logger }));
  app.use(compression());
  app.use(globalRateLimiter);
  app.use(cors({ 
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','), 
    credentials: true 
  }));
  app.use(express.json());
  app.use(helmet({ 
    contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false
  })); 

  // 2. API Routes
>>>>>>> master
  app.use("/api/auth", authRoutes);
  app.use("/api/transcripts", transcriptRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/files", fileRoutes);

<<<<<<< HEAD
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
=======
  // 3. Health Check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // 4. Database Setup (Internal)
  try {
    initDb();
    if (process.argv.includes('--seed') || process.env.SEED_DB === 'true') {
      logger.info("Seeding database...");
      await seed();
    }
    logger.info("Database online.");
  } catch (err) {
    logger.error({ err }, "Database error");
  }

  // 5. Tooling (Vite)
  if (config.NODE_ENV !== "production") {
    logger.info("Starting Vite development server...");
>>>>>>> master
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
<<<<<<< HEAD
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
=======
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`>>> Service active on port ${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      db.close();
      logger.info('Database connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err, url: req.url, method: req.method }, 'Unhandled ERROR');
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      stack: config.NODE_ENV === 'development' ? err.stack : undefined
>>>>>>> master
    });
  });
}

startServer().catch(err => {
<<<<<<< HEAD
  console.error("CRITICAL: Server failed to start:", err);
=======
  logger.fatal({ err }, "CRITICAL: Server failed to start");
>>>>>>> master
  process.exit(1);
});
