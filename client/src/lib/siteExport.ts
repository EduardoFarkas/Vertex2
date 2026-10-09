import JSZip from "jszip";

export type SiteExportBundle = {
  baseName: string;
  htmlFileName: string;
  cssFileName: string;
  html: string;
  css: string;
};

export function safeExportBaseName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "site";
}

export function buildSiteExport(projectName: string, body: string, css: string): SiteExportBundle {
  const baseName = safeExportBaseName(projectName);
  const cssFileName = `${baseName}.css`;
  return {
    baseName,
    htmlFileName: `${baseName}.html`,
    cssFileName,
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${projectName}</title><link rel="stylesheet" href="${cssFileName}"></head><body>${body}</body></html>`,
    css,
  };
}

export type StaticExportAsset = { url: string; filename: string; mimeType?: string };
export type StaticExportMetadata = { title?: string | null; description?: string | null; faviconUrl?: string | null; openGraphImageUrl?: string | null };
export type StaticSiteZipResult = { blob: Blob; fileName: string; files: string[]; warnings: string[] };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function minifyHtml(html: string) {
  return html.trim().replace(/>\s+</g, "><");
}

function sanitizeGrapesHtml(html: string) {
  return html
    .replace(/\sdata-gjs-[\w-]+=("[^"]*"|'[^']*')/gi, "")
    .replace(/\sclass=("[^"]*"|'[^']*')/gi, (attribute) => {
      const quote = attribute.includes('"') ? '"' : "'";
      const classes = attribute.slice(attribute.indexOf(quote) + 1, attribute.lastIndexOf(quote)).split(/\s+/).filter((name) => name && !name.startsWith("gjs-"));
      return classes.length ? ` class="${classes.join(" ")}"` : "";
    });
}

function minifyCss(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").trim();
}

function safeAssetFileName(filename: string, fallbackIndex: number) {
  const extension = filename.match(/(\.[a-z0-9]{1,8})$/i)?.[1] ?? "";
  const name = (filename.replace(/\.[a-z0-9]{1,8}$/i, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || `asset-${fallbackIndex}`).toLowerCase();
  return `${name}${extension.toLowerCase()}`;
}

function replaceAssetUrls(value: string, replacements: Map<string, string>) {
  return Array.from(replacements.entries()).reduce((result, [remoteUrl, localUrl]) => result.split(remoteUrl).join(localUrl), value);
}

export function buildStaticSiteHtml(projectName: string, body: string, metadata: StaticExportMetadata = {}) {
  const title = escapeHtml(metadata.title?.trim() || projectName || "Site");
  const description = metadata.description?.trim() ? `<meta name="description" content="${escapeHtml(metadata.description.trim())}">` : "";
  const favicon = metadata.faviconUrl ? `<link rel="icon" href="${escapeHtml(metadata.faviconUrl)}">` : "";
  const openGraph = metadata.openGraphImageUrl ? `<meta property="og:image" content="${escapeHtml(metadata.openGraphImageUrl)}">` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${description}${favicon}${openGraph}<link rel="stylesheet" href="css/style.css"></head><body>${minifyHtml(sanitizeGrapesHtml(body))}</body></html>`;
}

export async function createStaticSiteZip(options: { projectName: string; html: string; css: string; metadata?: StaticExportMetadata; assets?: StaticExportAsset[]; fetchAsset?: typeof fetch }): Promise<StaticSiteZipResult> {
  const html = options.html.trim();
  const css = options.css.trim();
  if (!html) throw new Error("O editor não retornou HTML para exportação.");
  if (!css) throw new Error("O editor não retornou CSS para exportação.");

  const zip = new JSZip();
  const warnings: string[] = [];
  const replacements = new Map<string, string>();
  const sourceUrls = new Set([options.metadata?.faviconUrl, options.metadata?.openGraphImageUrl].filter((url): url is string => Boolean(url)));
  (options.assets ?? []).forEach((asset) => { if (html.includes(asset.url) || css.includes(asset.url)) sourceUrls.add(asset.url); });
  const fetchAsset = options.fetchAsset ?? fetch;
  let assetIndex = 1;
  for (const sourceUrl of Array.from(sourceUrls)) {
    const asset = (options.assets ?? []).find((candidate) => candidate.url === sourceUrl);
    if (!asset) continue;
    const localUrl = `assets/${safeAssetFileName(asset.filename, assetIndex++)}`;
    try {
      const response = await fetchAsset(sourceUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      zip.file(localUrl, await response.arrayBuffer());
      replacements.set(sourceUrl, localUrl);
    } catch {
      warnings.push(`Não foi possível copiar ${asset.filename}; a URL original foi mantida.`);
    }
  }

  const localizedMetadata: StaticExportMetadata = {
    title: options.metadata?.title,
    description: options.metadata?.description,
    faviconUrl: options.metadata?.faviconUrl ? replaceAssetUrls(options.metadata.faviconUrl, replacements) : null,
    openGraphImageUrl: options.metadata?.openGraphImageUrl ? replaceAssetUrls(options.metadata.openGraphImageUrl, replacements) : null,
  };
  const staticHtml = buildStaticSiteHtml(options.projectName, replaceAssetUrls(html, replacements), localizedMetadata);
  zip.file("index.html", staticHtml);
  zip.file("css/style.css", minifyCss(replaceAssetUrls(css, replacements)));
  const baseName = safeExportBaseName(options.projectName);
  const files = Object.values(zip.files).filter((entry) => !entry.dir).map((entry) => entry.name).sort();
  return { blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } }), fileName: `${baseName}.zip`, files, warnings };
}
