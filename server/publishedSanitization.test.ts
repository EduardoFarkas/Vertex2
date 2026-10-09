import { describe, expect, it } from "vitest";
import { sanitizePublishedCss, sanitizePublishedHtml, sanitizePublishedUrl } from "./publishedSanitization";

describe("sanitização da publicação", () => {
  it("preserva markup básico e atributos do formulário de contato", () => {
    const html = sanitizePublishedHtml('<main><h1 class="hero">Olá</h1><form data-vertex-lead-form><input name="email" type="email" required></form></main>');
    expect(html).toContain('<h1 class="hero">Olá</h1>');
    expect(html).toContain('data-vertex-lead-form');
    expect(html).toContain('name="email"');
  });

  it("remove scripts, eventos inline, SVG ativo, iframes e esquemas perigosos", () => {
    const html = sanitizePublishedHtml('<img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">link</a><iframe src="https://evil.test"></iframe><svg onload="alert(4)"></svg>');
    expect(html).not.toMatch(/script|onerror|javascript:|iframe|svg|onload/i);
    expect(html).toContain('<img src="x">');
  });

  it("mantém CSS seguro e remove imports, valores executáveis e urls javascript", () => {
    const css = sanitizePublishedCss('@import url(https://evil.test/x.css); .hero{color:#123456;background:url("javascript:alert(1)");opacity:1}');
    expect(css).toContain('color:#123456');
    expect(css).toContain('opacity:1');
    expect(css).not.toMatch(/@import|javascript:/i);
  });

  it("falha fechada com CSS malformado ou tentativa de fechar a tag style", () => {
    expect(sanitizePublishedCss('a{color:red')).toBe('');
    expect(sanitizePublishedCss('a{color:red}</style><script>alert(1)</script>')).toBe('');
  });

  it("aceita URLs seguras de mídia e rejeita esquemas executáveis nos metadados", () => {
    expect(sanitizePublishedUrl("/manus-storage/asset.png")).toBe("/manus-storage/asset.png");
    expect(sanitizePublishedUrl("https://images.example.com/cover.jpg")).toBe("https://images.example.com/cover.jpg");
    expect(sanitizePublishedUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizePublishedUrl("//evil.example/cover.jpg")).toBeNull();
  });
});
