import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";

const safeCodes = new Set(["INTERNAL_SERVER_ERROR", "NETWORK_ERROR", "BAD_REQUEST", "NOT_FOUND", "TIMEOUT", "CLIENT_RENDER_ERROR"]);
const safeAction = /^[a-zA-Z0-9_.:-]{1,80}$/;

export function registerErrorRoutes(app: Express) {
  app.post("/api/client-errors", async (req: Request, res: Response) => {
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null;
    try { user = await sdk.authenticateRequest(req); }
    catch { res.status(401).json({ code: "AUTH_REQUIRED", error: "Entre novamente para registrar e consultar erros." }); return; }
    if (!user) { res.status(401).json({ code: "AUTH_REQUIRED", error: "Entre novamente para registrar e consultar erros." }); return; }
    try {
      const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
      const code = typeof body.code === "string" && safeCodes.has(body.code) ? body.code : "INTERNAL_SERVER_ERROR";
      const action = typeof body.action === "string" && safeAction.test(body.action) ? body.action : "interface";
      const route = typeof body.route === "string" ? body.route.split(/[?#]/, 1)[0].slice(0, 255) : "/";
      const requestId = await db.recordErrorForUser(user.id, { action, route, code, message: "Falha na ação. Consulte o identificador para suporte." });
      res.status(202).json({ requestId });
    } catch {
      res.status(503).json({ code: "ERROR_LOG_UNAVAILABLE", error: "Não foi possível guardar o registro de erro neste momento." });
    }
  });

  app.get("/api/client-errors", async (req: Request, res: Response) => {
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null;
    try { user = await sdk.authenticateRequest(req); }
    catch { res.status(401).json({ code: "AUTH_REQUIRED", error: "Entre novamente para consultar seus registros." }); return; }
    if (!user) { res.status(401).json({ code: "AUTH_REQUIRED", error: "Entre novamente para consultar seus registros." }); return; }
    try {
      const items = await db.listErrorsForUser(user.id, 50);
      res.json({ items });
    } catch {
      res.status(503).json({ code: "ERROR_LOG_UNAVAILABLE", error: "Não foi possível carregar os registros. Tente novamente." });
    }
  });
}
