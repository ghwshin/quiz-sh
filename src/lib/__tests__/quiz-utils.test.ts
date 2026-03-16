import { describe, it, expect } from "vitest";
import { checkBlank, countConversationBlanks } from "@/lib/quiz-utils";

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

describe("countConversationBlanks", () => {
  it("counts blanks across multiple messages", () => {
    const messages = [
      { text: "소스에 ___ 매크로를 추가해야 해요." },
      { text: "보통 ___로 설정합니다." },
    ];
    expect(countConversationBlanks(messages)).toBe(2);
  });

  it("counts multiple blanks in one message", () => {
    const messages = [
      { text: "___ 명령어로 ___ 파일을 확인해요." },
    ];
    expect(countConversationBlanks(messages)).toBe(2);
  });

  it("returns 0 for messages without blanks", () => {
    const messages = [
      { text: "에러가 났어요." },
      { text: "확인해볼게요." },
    ];
    expect(countConversationBlanks(messages)).toBe(0);
  });

  it("skips messages without text", () => {
    const messages = [
      { text: "___ 확인해요." },
      {},
    ];
    expect(countConversationBlanks(messages)).toBe(1);
  });
});
