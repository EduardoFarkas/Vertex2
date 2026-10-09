export type InlineDataImage = {
  dataUrl: string;
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/svg+xml";
  filename: string;
  sizeBytes: number;
};

const DATA_IMAGE_PATTERN = /data:(image\/(?:jpeg|png|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)/gi;

function extensionFor(mimeType: InlineDataImage["mimeType"]) {
  return mimeType === "image/svg+xml" ? "svg" : mimeType.split("/")[1];
}

function inspectString(value: string, found: Map<string, InlineDataImage>) {
  const pattern = new RegExp(DATA_IMAGE_PATTERN.source, DATA_IMAGE_PATTERN.flags);
  Array.from(value.matchAll(pattern)).forEach((match) => {
    const dataUrl = match[0];
    if (found.has(dataUrl)) return;
    const mimeType = match[1].toLowerCase() as InlineDataImage["mimeType"];
    const base64 = match[2];
    found.set(dataUrl, {
      dataUrl,
      base64,
      mimeType,
      filename: `imagem-inline-${found.size + 1}.${extensionFor(mimeType)}`,
      sizeBytes: Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0),
    });
  });
}

export function findInlineDataImages(value: unknown) {
  const found = new Map<string, InlineDataImage>();
  const seen = new WeakSet<object>();

  const visit = (item: unknown): void => {
    if (typeof item === "string") { inspectString(item, found); return; }
    if (!item || typeof item !== "object" || seen.has(item)) return;
    seen.add(item);
    if (Array.isArray(item)) { item.forEach(visit); return; }
    Object.values(item).forEach(visit);
  };

  visit(value);
  return Array.from(found.values());
}

export function replaceInlineDataImages(value: unknown, replacements: ReadonlyMap<string, string>): unknown {
  if (typeof value === "string") {
    return value.replace(new RegExp(DATA_IMAGE_PATTERN.source, DATA_IMAGE_PATTERN.flags), (dataUrl) => replacements.get(dataUrl) ?? dataUrl);
  }
  if (Array.isArray(value)) return value.map((item) => replaceInlineDataImages(item, replacements));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceInlineDataImages(item, replacements)]));
}
