export type Navigate = (to: string, options?: { replace?: boolean }) => void;

export async function logoutAndNavigate(logout: () => Promise<void>, navigate: Navigate) {
  try {
    await logout();
  } catch {
    // A sessão local já é limpa no finally do hook; ainda conduzimos a pessoa à rota de login.
  } finally {
    navigate("/login", { replace: true });
  }
}
