import { describe, expect, it } from "vitest";
import { createInitialDocumentSchema, slugify } from "./builderModel";

describe("builder document model", () => {
  it("creates a structured starter document with the project title", () => {
    const document = createInitialDocumentSchema("Atelier Norte");
    expect(document.kind).toBe("vertex-document");
    expect(document.root.children[0]?.children[0]?.children[0]?.props.text).toBe("Atelier Norte");
  });

  it("creates stable slugs for Portuguese project names", () => {
    expect(slugify("Página do Estúdio — São Paulo")).toBe("pagina-do-estudio-sao-paulo");
    expect(slugify("   ")).toBe("novo-projeto");
  });
});
