export type BuilderNode = {
  id: string;
  type: "section" | "container" | "heading" | "text" | "button" | "image";
  props: Record<string, unknown>;
  styles: Record<string, string | number>;
  children: BuilderNode[];
};

export type BuilderDocument = {
  kind: "vertex-document";
  schemaVersion: 1;
  root: BuilderNode;
};

export function slugify(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || "novo-projeto";
}

export function createInitialDocumentSchema(projectName: string): BuilderDocument {
  return {
    kind: "vertex-document",
    schemaVersion: 1,
    root: {
      id: "page-root",
      type: "section",
      props: { label: "Página" },
      styles: { backgroundColor: "#f5f5f7", minHeight: "100vh" },
      children: [
        {
          id: "hero-section",
          type: "section",
          props: { label: "Hero" },
          styles: { backgroundColor: "#ffffff", paddingTop: 96, paddingBottom: 96 },
          children: [
            {
              id: "hero-container",
              type: "container",
              props: { label: "Conteúdo" },
              styles: { maxWidth: 1120, margin: "0 auto", paddingLeft: 32, paddingRight: 32 },
              children: [
                {
                  id: "hero-heading",
                  type: "heading",
                  props: { text: projectName },
                  styles: { fontSize: 56, fontWeight: 700, color: "#1d1d1f", lineHeight: 1.02 },
                  children: [],
                },
                {
                  id: "hero-text",
                  type: "text",
                  props: { text: "Comece a editar esta página no Vertex Echad Studio." },
                  styles: { fontSize: 18, color: "#686872", marginTop: 18 },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
