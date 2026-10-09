import { describe, expect, it } from "vitest";
import { createProjectTemplateDocument, isProjectTemplateId, PROJECT_TEMPLATE_IDS } from "./projectTemplates";

describe("project templates", () => {
  it("gera documento HTML, CSS e schema para todos os templates disponíveis", () => {
    for (const templateId of PROJECT_TEMPLATE_IDS) {
      const document = createProjectTemplateDocument(templateId, "Projeto de teste");
      expect(document.schema).toMatchObject({ kind: "vertex-template-document", templateId });
      expect(document.html).toContain("Projeto de teste");
      expect(document.css.length).toBeGreaterThan(100);
    }
  });

  it("aceita apenas identificadores de template publicados", () => {
    expect(isProjectTemplateId("editorial")).toBe(true);
    expect(isProjectTemplateId("desconhecido")).toBe(false);
  });
});
