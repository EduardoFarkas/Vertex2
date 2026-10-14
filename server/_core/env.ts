// A fixed appId keeps local email/password sessions valid without the Manus
// OAuth server (verifySession requires a non-empty appId in the JWT).
const DEFAULT_APP_ID = "vertex-echad";
// Dev-only fallback so the server boots locally; production MUST set JWT_SECRET.
const DEFAULT_DEV_SECRET = "vertex-dev-insecure-secret-change-me";

export const ENV = {
  appId: process.env.VITE_APP_ID || DEFAULT_APP_ID,
  cookieSecret: process.env.JWT_SECRET || DEFAULT_DEV_SECRET,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  storageDir: process.env.STORAGE_DIR ?? "",
};

if (ENV.isProduction && !process.env.JWT_SECRET) {
  console.warn(
    "[ENV] JWT_SECRET is not set. Using an insecure development secret in production."
  );
}
