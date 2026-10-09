import { describe, expect, it } from "vitest";
import { getMissingProjectDataArtifacts, resolveEditorDocumentLoadPlan } from "./editorDocument";

const fallback = { html: "<main>blank</main>", css: "main{color:black}" };

describe("resolução de documento do editor", () => {
  it("prioriza HTML e CSS persistidos para um template", () => {
    expect(resolveEditorDocumentLoadPlan({ schema: { kind: "vertex-template-document", templateId: "editorial" }, html: "<main class=\"editorial\">Template</main>", css: ".editorial{color:blue}" }, fallback)).toEqual({ mode: "html", html: "<main class=\"editorial\">Template</main>", css: ".editorial{color:blue}" });
  });

  it("mantém projetos GrapesJS e preserva seus artefatos quando presentes", () => {
    const projectData = { pages: [] };
    expect(resolveEditorDocumentLoadPlan({ schema: { kind: "grapesjs-document", projectData }, html: "<main>Projeto</main>", css: "main{display:block}" }, fallback)).toEqual({ mode: "project-data", projectData, html: "<main>Projeto</main>", css: "main{display:block}" });
  });

  it("não sobrescreve regras responsivas que já vieram no projectData", () => {
    const responsiveCss = ".button{background:#111}@media (max-width:480px){.button{background:#2563eb}}";
    expect(getMissingProjectDataArtifacts({ html: "<main>Projeto</main>", css: responsiveCss }, { html: "<main>Projeto</main>", css: responsiveCss })).toEqual({ html: undefined, css: undefined });
    expect(getMissingProjectDataArtifacts({ html: "", css: "" }, { html: "<main>Projeto</main>", css: responsiveCss })).toEqual({ html: "<main>Projeto</main>", css: responsiveCss });
  });
});
