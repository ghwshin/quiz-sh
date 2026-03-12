import { describe, it, expect } from "vitest";
import { checkBlank } from "@/lib/quiz-utils";

describe("checkBlank", () => {
  it("returns true for exact match", () => {
    expect(checkBlank("TLB", ["TLB"])).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(checkBlank("tlb", ["TLB"])).toBe(true);
    expect(checkBlank("TLB", ["tlb"])).toBe(true);
  });

  it("trims whitespace", () => {
    expect(checkBlank("  TLB  ", ["TLB"])).toBe(true);
  });

  it("normalizes internal whitespace", () => {
    expect(checkBlank("page  cache", ["page cache"])).toBe(true);
  });

  it("returns true when matching any acceptable answer", () => {
    expect(
      checkBlank("Translation Lookaside Buffer", [
        "TLB",
        "Translation Lookaside Buffer",
      ])
    ).toBe(true);
  });

  it("returns false when no match", () => {
    expect(checkBlank("wrong answer", ["TLB"])).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(checkBlank("", ["TLB"])).toBe(false);
  });

  it("returns false for whitespace-only input", () => {
    expect(checkBlank("   ", ["TLB"])).toBe(false);
  });
});
