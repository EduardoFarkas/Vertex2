import path from "node:path";
import type { Express } from "express";
import { resolveKeyPath } from "./localStorage";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
};

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    let full: string;
    try {
      full = resolveKeyPath(key);
    } catch {
      res.status(400).send("Invalid storage key");
      return;
    }

    const ext = path.extname(full).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    try {
      // res.sendFile sets Content-Type from the extension and streams the file.
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.type(contentType);
      res.sendFile(full, err => {
        if (err && !res.headersSent) {
          const status = (err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
          res.status(status).send("Not found");
        }
      });
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(500).send("Storage proxy error");
    }
  });
}
