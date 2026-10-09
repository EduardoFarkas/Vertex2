import { describe, expect, it } from "vitest";
import { getAuthRouteTarget } from "./authRoutePolicy";

describe("política de rotas de sessão", () => {
  it("protege o dashboard enquanto a sessão está ausente", () => {
    expect(getAuthRouteTarget({ loading: false, isAuthenticated: false, pathname: "/dashboard" })).toBe("/login");
  });

  it("redireciona uma sessão autenticada do login para o dashboard", () => {
    expect(getAuthRouteTarget({ loading: false, isAuthenticated: true, pathname: "/login" })).toBe("/dashboard");
  });

  it("não redireciona enquanto a sessão está sendo verificada", () => {
    expect(getAuthRouteTarget({ loading: true, isAuthenticated: false, pathname: "/dashboard" })).toBeNull();
  });
});
