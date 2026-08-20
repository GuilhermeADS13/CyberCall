import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import { sdk } from "./_core/sdk";
import { createAttachment } from "./db";
import { moderateAttachment } from "./attachmentModeration";
import { storagePut } from "./storage";
import { createRateLimiter } from "./rateLimit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".csv",
]);
const uploadLimiter = createRateLimiter(20, 60_000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(
      null,
      allowedTypes.has(file.mimetype) && allowedExtensions.has(extension)
    );
  },
});

function safeFileName(originalName: string) {
  const base = path
    .basename(originalName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 180);
  return base || "anexo";
}

export function registerAttachmentRoutes(app: Express) {
  app.post("/api/attachments", (req: Request, res: Response) => {
    upload.single("file")(req, res, async error => {
      if (error) {
        const message =
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
            ? "O arquivo excede o limite de 10 MB."
            : "Tipo de arquivo não permitido ou upload inválido.";
        res.status(400).json({ error: message });
        return;
      }

      try {
        const user = await sdk.authenticateRequest(req);
        if (user.isCron || user.id < 1) {
          res
            .status(403)
            .json({ error: "Upload indisponível para este tipo de sessão." });
          return;
        }
        const rate = uploadLimiter.check(`${user.id}:${req.ip || "unknown"}`);
        if (!rate.allowed) {
          res.setHeader(
            "Retry-After",
            Math.ceil(rate.retryAfterMs / 1000).toString()
          );
          res.status(429).json({
            error:
              "Limite temporário de uploads atingido. Tente novamente em um minuto.",
          });
          return;
        }

        const file = req.file;
        if (!file || !allowedTypes.has(file.mimetype)) {
          res
            .status(400)
            .json({ error: "Selecione uma imagem ou arquivo compatível." });
          return;
        }

        const moderation = await moderateAttachment(file.buffer, file.mimetype);
        if (!moderation.allowed) {
          const status =
            moderation.category === "moderation_unavailable" ? 503 : 422;
          res
            .status(status)
            .json({ error: moderation.reason, code: moderation.category });
          return;
        }

        const stored = await storagePut(
          `users/${user.id}/attachments/${Date.now()}-${safeFileName(file.originalname)}`,
          file.buffer,
          file.mimetype
        );
        const record = await createAttachment(user.id, {
          key: stored.key,
          url: stored.url,
          name: safeFileName(file.originalname),
          mimeType: file.mimetype,
          size: file.size,
        });
        res.status(201).json(record);
      } catch (uploadError) {
        console.error("[Attachments] Upload failed:", uploadError);
        res.status(401).json({
          error: "Sessão inválida ou não foi possível armazenar o anexo.",
        });
      }
    });
  });
}

export { MAX_FILE_SIZE };
