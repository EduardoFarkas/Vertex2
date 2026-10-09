import { describe, expect, it } from "vitest";
import { validateUploadedFile } from "./uploadValidation";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("validação de arquivos enviados", () => {
  it("aceita PNG com assinatura binária correspondente", () => {
    expect(() => validateUploadedFile(png, "image/png")).not.toThrow();
  });
  it("recusa MIME falsificado e SVG ativo", () => {
    expect(() => validateUploadedFile(png, "image/jpeg")).toThrow(/não corresponde/i);
    expect(() => validateUploadedFile(Buffer.from('<svg onload="alert(1)"/>'), "image/svg+xml")).toThrow(/Formato não permitido/i);
  });
  it("recusa arquivo vazio e arquivo acima do limite", () => {
    expect(() => validateUploadedFile(Buffer.alloc(0), "image/png")).toThrow(/vazio/i);
    expect(() => validateUploadedFile(Buffer.alloc(20 * 1024 * 1024 + 1), "image/png")).toThrow(/20 MB/i);
  });
});
