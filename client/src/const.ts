export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Navigate to the local login page. Kept as a function (same signature as the
// old Manus OAuth redirect) so existing callers keep working, but there is no
// external OAuth server anymore — authentication is handled by /login itself
// via email + password.
export const startLogin = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};
