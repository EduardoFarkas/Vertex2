export function getAuthRouteTarget(input: { loading: boolean; isAuthenticated: boolean; pathname: string }) {
  if (input.loading) return null;
  if (!input.isAuthenticated && input.pathname !== "/login") return "/login";
  if (input.isAuthenticated && (input.pathname === "/login" || input.pathname === "/")) return "/dashboard";
  if (input.isAuthenticated && input.pathname === "/") return "/dashboard";
  return null;
}
