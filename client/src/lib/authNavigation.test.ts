import { describe, expect, it, vi } from "vitest";
import { logoutAndNavigate } from "./authNavigation";

describe("logoutAndNavigate", () => {
  it("navega para login após logout bem-sucedido", async () => {
    const logout = vi.fn(async () => undefined);
    const navigate = vi.fn();
    await logoutAndNavigate(logout, navigate);
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("navega para login mesmo se a solicitação de logout falhar", async () => {
    const logout = vi.fn(async () => { throw new Error("network"); });
    const navigate = vi.fn();
    await logoutAndNavigate(logout, navigate);
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
