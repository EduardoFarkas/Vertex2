export type StoredEditorDocument = {
  schema?: unknown;
  html?: string | null;
  css?: string | null;
};

export type EditorDocumentLoadPlan =
  | { mode: "project-data"; projectData: Record<string, unknown>; html?: string; css?: string }
  | { mode: "html"; html: string; css: string };

export function getMissingProjectDataArtifacts(restored: { html: string; css: string }, persisted: { html?: string; css?: string }) {
  return {
    html: restored.html.trim() ? undefined : persisted.html?.trim() || undefined,
    css: restored.css.trim() ? undefined : persisted.css?.trim() || undefined,
  };
}

export function resolveEditorDocumentLoadPlan(document: StoredEditorDocument | undefined, fallback: { html: string; css: string }): EditorDocumentLoadPlan {
  const schema = document?.schema as { kind?: string; projectData?: unknown } | null | undefined;
  const html = document?.html?.trim() || "";
  const css = document?.css?.trim() || "";
  if (schema?.kind === "grapesjs-document" && schema.projectData && typeof schema.projectData === "object") {
    return { mode: "project-data", projectData: schema.projectData as Record<string, unknown>, html: html || undefined, css: css || undefined };
  }
  return { mode: "html", html: html || fallback.html, css: css || fallback.css };
}
