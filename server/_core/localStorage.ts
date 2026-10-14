// Local filesystem storage backend (replaces the Manus Forge/S3 flow).
// Files are written under STORAGE_DIR (or <cwd>/.vertex-storage) and served
// through the /manus-storage/* proxy, so stored URLs keep the same shape.
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

let cachedRoot: string | null = null;

/** Absolute root directory for uploaded objects. */
export function getStorageRoot(): string {
  if (cachedRoot) return cachedRoot;
  const configured = process.env.STORAGE_DIR?.trim();
  cachedRoot = configured
    ? path.resolve(configured)
    : path.resolve(process.cwd(), ".vertex-storage");
  return cachedRoot;
}

/**
 * Resolve a storage key to an absolute path inside the storage root.
 * Throws on traversal attempts (keys containing ".." or absolute paths).
 */
export function resolveKeyPath(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  const root = getStorageRoot();
  const full = path.resolve(root, key);
  const rel = path.relative(root, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Invalid storage key: ${relKey}`);
  }
  return full;
}

export async function writeLocalObject(
  relKey: string,
  data: Buffer | Uint8Array | string,
): Promise<string> {
  const full = resolveKeyPath(relKey);
  await fsp.mkdir(path.dirname(full), { recursive: true });
  await fsp.writeFile(full, data as Uint8Array);
  return full;
}

export function localObjectExists(relKey: string): boolean {
  try {
    return fs.statSync(resolveKeyPath(relKey)).isFile();
  } catch {
    return false;
  }
}
