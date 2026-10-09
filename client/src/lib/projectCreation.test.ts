import { describe, expect, it } from "vitest";
import { toProjectCreateInput } from "./projectCreation";

describe("payload de criação de projeto", () => {
  it("preserva a criação em branco sem templateId", () => {
    expect(toProjectCreateInput("Página em branco")).toEqual({ name: "Página em branco" });
  });

  it("envia templateId quando uma base é selecionada", () => {
    expect(toProjectCreateInput("Projeto editorial", "editorial")).toEqual({ name: "Projeto editorial", templateId: "editorial" });
  });
});
