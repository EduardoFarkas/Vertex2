import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useAuth", () => {
  it("mantém a escrita em localStorage fora do useMemo", () => {
    const source = readFileSync(new URL("./useAuth.ts", import.meta.url), "utf8");
    const memoSection = source.slice(source.indexOf("const state = useMemo"), source.indexOf("useEffect(() =>", source.indexOf("const state = useMemo")));
    expect(memoSection).not.toContain("localStorage");
    expect(source).toContain('localStorage.setItem("manus-runtime-user-info"');
  });
});
