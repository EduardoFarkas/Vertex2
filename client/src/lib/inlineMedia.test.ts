import { describe, expect, it } from "vitest";
import { findInlineDataImages, replaceInlineDataImages } from "./inlineMedia";

describe("inlineMedia", () => {
  const inlineImage = "data:image/png;base64,aGVsbG8=";

  it("detecta uma imagem Base64 uma única vez em HTML e schema", () => {
    const document = { html: `<img src="${inlineImage}" />`, schema: { assets: [inlineImage], component: { src: inlineImage } } };

    expect(findInlineDataImages(document)).toEqual([expect.objectContaining({ dataUrl: inlineImage, mimeType: "image/png", filename: "imagem-inline-1.png", sizeBytes: 5 })]);
  });

  it("substitui a imagem inline em todo o documento sem alterar outros valores", () => {
    const document = { html: `<img src="${inlineImage}" />`, schema: { assets: [inlineImage], label: "Preservar" } };
    const result = replaceInlineDataImages(document, new Map([[inlineImage, "/manus-storage/workspaces/1/assets/imagem.png"]]));

    expect(result).toEqual({ html: '<img src="/manus-storage/workspaces/1/assets/imagem.png" />', schema: { assets: ["/manus-storage/workspaces/1/assets/imagem.png"], label: "Preservar" } });
  });
});
