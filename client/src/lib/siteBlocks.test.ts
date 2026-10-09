import { describe, expect, it } from "vitest";
import { BLOCK_CATEGORIES, SITE_BLOCKS } from "./siteBlocks";

describe("biblioteca de blocos do site", () => {
  it("cobre todas as categorias essenciais do editor", () => {
    expect(new Set(SITE_BLOCKS.map((block) => block.category))).toEqual(new Set(BLOCK_CATEGORIES));
    expect(SITE_BLOCKS.some((block) => block.id === "contact-form" && block.html.includes("data-vertex-lead-form"))).toBe(true);
  });

  it("oferece estruturas responsivas para composição sem código", () => {
    expect(SITE_BLOCKS.find((block) => block.id === "flex-split")?.html).toContain("flex-wrap:wrap");
    expect(SITE_BLOCKS.find((block) => block.id === "grid-auto")?.html).toContain("auto-fit");
    expect(SITE_BLOCKS.find((block) => block.id === "button-group")?.html).toContain("display:flex");
  });
});
