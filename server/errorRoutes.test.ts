import type { Express, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { registerErrorRoutes } from "./errorRoutes";

vi.mock("./db", () => ({ recordErrorForUser: vi.fn(), listErrorsForUser: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));

type Handler = (req: Request, res: Response) => Promise<void>;
function setupRoutes() {
  const handlers = new Map<string, Handler>();
  const app = { post: (path: string, handler: Handler) => handlers.set(`POST ${path}`, handler), get: (path: string, handler: Handler) => handlers.set(`GET ${path}`, handler) };
  registerErrorRoutes(app as unknown as Express);
  return handlers;
}
function responseStub() {
  const result: { statusCode: number; body: unknown } = { statusCode: 200, body: undefined };
  const res = { status(code: number) { result.statusCode = code; return this; }, json(body: unknown) { result.body = body; return this; } };
  return { result, res: res as unknown as Response };
}

beforeEach(() => vi.clearAllMocks());

describe("rotas de logs pessoais", () => {
  it("associa erro somente à identidade da sessão e não persiste mensagem/PII do navegador", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 42 } as never);
    vi.mocked(db.recordErrorForUser).mockResolvedValue("support-42");
    const handlers = setupRoutes();
    const { result, res } = responseStub();
    await handlers.get("POST /api/client-errors")!({ body: { action: "api_mutation", route: "/dashboard/projects?email=private@example.com", code: "NETWORK_ERROR", message: "senha secreta" } } as Request, res);
    expect(result.statusCode).toBe(202);
    expect(db.recordErrorForUser).toHaveBeenCalledWith(42, expect.objectContaining({ action: "api_mutation", route: "/dashboard/projects", code: "NETWORK_ERROR" }));
    expect(JSON.stringify(db.recordErrorForUser.mock.calls)).not.toContain("private@example.com");
    expect(JSON.stringify(db.recordErrorForUser.mock.calls)).not.toContain("senha secreta");
  });

  it("consulta registros com o userId da sessão e sem aceitar outro userId do cliente", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 9 } as never);
    vi.mocked(db.listErrorsForUser).mockResolvedValue([] as never);
    const handlers = setupRoutes();
    const { result, res } = responseStub();
    await handlers.get("GET /api/client-errors")!({ query: { userId: "42" } } as unknown as Request, res);
    expect(result.statusCode).toBe(200);
    expect(db.listErrorsForUser).toHaveBeenCalledWith(9, 50);
  });

  it("nega consultas sem sessão autenticada", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(null as never);
    const handlers = setupRoutes();
    const { result, res } = responseStub();
    await handlers.get("GET /api/client-errors")!({} as Request, res);
    expect(result.statusCode).toBe(401);
    expect(db.listErrorsForUser).not.toHaveBeenCalled();
  });
});
