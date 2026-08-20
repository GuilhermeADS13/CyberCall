import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerAttachmentRoutes } from "../attachments";
import { serveStatic, setupVite } from "./vite";
import { createRealtimeServer } from "../realtime";
import { isTrustedRequest } from "../origin";
import { createRateLimiter } from "../rateLimit";

const isProduction = process.env.NODE_ENV === "production";

// Mutations carry the session cookie, so every non-idempotent API call has to
// prove it originated from a trusted page before it reaches the router.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const apiLimiter = createRateLimiter(300, 60_000);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * In production the platform injects the port it will route traffic to.
 * Silently listening somewhere else turns into a health check that never
 * passes, so only development is allowed to look for a free port.
 */
async function resolvePort(preferredPort: number) {
  if (isProduction) return preferredPort;
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  return port;
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader(
      "Permissions-Policy",
      "camera=(self), microphone=(self), display-capture=(self), geolocation=()"
    );
    if (isProduction) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob: https:",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data: https:",
          "connect-src 'self' https: wss:",
          "object-src 'none'",
          "base-uri 'self'",
        ].join("; ")
      );
    }
    next();
  });

  app.use("/api", (req, res, next) => {
    if (!SAFE_METHODS.has(req.method) && !isTrustedRequest(req)) {
      res
        .status(403)
        .json({ error: "Origem não autorizada para esta requisição." });
      return;
    }
    const { allowed, retryAfterMs } = apiLimiter.check(req.ip || "unknown");
    if (!allowed) {
      res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000).toString());
      res
        .status(429)
        .json({ error: "Muitas requisições. Aguarde alguns instantes." });
      return;
    }
    next();
  });

  const server = createServer(app);
  const realtimeServer = createRealtimeServer(server);

  // JSON payloads only carry message bodies and signaling metadata; binary
  // uploads go through multer on /api/attachments with its own 10 MB cap.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAttachmentRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await resolvePort(preferredPort);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Server] ${signal} received, closing connections...`);
    realtimeServer.clients.forEach(socket =>
      socket.close(1001, "Servidor reiniciando")
    );
    realtimeServer.close();
    server.close(() => process.exit(0));
    // Do not let a stuck connection hold the deploy open forever.
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(console.error);
