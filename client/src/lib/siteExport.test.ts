import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildSiteExport, createStaticSiteZip } from "./siteExport";

describe("exportação do site", () => {
  it("gera HTML e CSS como arquivos complementares", () => {
    const bundle = buildSiteExport("Projeto São Paulo", "<main>Conteúdo</main>", "main{color:#000}");
    expect(bundle).toMatchObject({ baseName: "projeto-sao-paulo", htmlFileName: "projeto-sao-paulo.html", cssFileName: "projeto-sao-paulo.css", css: "main{color:#000}" });
    expect(bundle.html).toContain('href="projeto-sao-paulo.css"');
    expect(bundle.html).toContain("<main>Conteúdo</main>");
  });

  it("gera um ZIP estático não vazio com HTML, CSS, metadados e asset localizado", async () => {
    const result = await createStaticSiteZip({
      projectName: "Cliente XYZ",
      html: '<main data-gjs-type="wrapper" class="site-shell gjs-selected"><img src="https://cdn.example/logo.png" alt="Logo"></main>',
      css: "main { display: flex; color: #123456; background-image: url(https://cdn.example/logo.png); }",
      metadata: { title: "Cliente XYZ", description: "Site institucional", faviconUrl: "https://cdn.example/logo.png" },
      assets: [{ url: "https://cdn.example/logo.png", filename: "Logo Cliente.png", mimeType: "image/png" }],
      fetchAsset: async () => new Response(new Uint8Array([137, 80, 78, 71]), { status: 200 }),
    });
    expect(result.fileName).toBe("cliente-xyz.zip");
    expect(result.files).toEqual(["assets/logo-cliente.png", "css/style.css", "index.html"]);
    expect(result.blob.size).toBeGreaterThan(0);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(await zip.file("index.html")?.async("text")).toContain('href="css/style.css"');
    expect(await zip.file("index.html")?.async("text")).toContain("assets/logo-cliente.png");
    expect(await zip.file("index.html")?.async("text")).not.toContain("data-gjs-");
    expect(await zip.file("index.html")?.async("text")).not.toContain("gjs-selected");
    expect(await zip.file("css/style.css")?.async("text")).toContain("display:flex");
    expect(await zip.file("css/style.css")?.async("text")).toContain("assets/logo-cliente.png");
  });
});
