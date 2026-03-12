import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  SUBCATEGORIES,
  DIFFICULTIES,
  slugToDifficulty,
  difficultyToSlug,
} from "@/lib/constants";

describe("CATEGORIES", () => {
  it("has linux-kernel and android-system", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(["linux-kernel", "android-system"]);
  });

  it("each category has name and description", () => {
    for (const cat of CATEGORIES) {
      expect(cat.name).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });
});

describe("SUBCATEGORIES", () => {
  it("has 10 subcategories per category", () => {
    expect(SUBCATEGORIES["linux-kernel"]).toHaveLength(10);
    expect(SUBCATEGORIES["android-system"]).toHaveLength(10);
  });

  it("each subcategory has id and name", () => {
    for (const category of Object.values(SUBCATEGORIES)) {
      for (const sub of category) {
        expect(sub.id).toBeTruthy();
        expect(sub.name).toBeTruthy();
      }
    }
  });
});

describe("DIFFICULTIES", () => {
  it("has 3 difficulty levels", () => {
    expect(DIFFICULTIES).toHaveLength(3);
  });

  it("has correct ids", () => {
    const ids = DIFFICULTIES.map((d) => d.id);
    expect(ids).toEqual(["초급", "중급", "고급"]);
  });
});

describe("slugToDifficulty", () => {
  it("converts beginner to 초급", () => {
    expect(slugToDifficulty("beginner")).toBe("초급");
  });

  it("converts intermediate to 중급", () => {
    expect(slugToDifficulty("intermediate")).toBe("중급");
  });

  it("converts advanced to 고급", () => {
    expect(slugToDifficulty("advanced")).toBe("고급");
  });

  it("returns 'random' for random slug", () => {
    expect(slugToDifficulty("random")).toBe("random");
  });

  it("returns undefined for unknown slug", () => {
    expect(slugToDifficulty("unknown")).toBeUndefined();
  });
});

describe("difficultyToSlug", () => {
  it("converts 초급 to beginner", () => {
    expect(difficultyToSlug("초급")).toBe("beginner");
  });

  it("converts 중급 to intermediate", () => {
    expect(difficultyToSlug("중급")).toBe("intermediate");
  });

  it("converts 고급 to advanced", () => {
    expect(difficultyToSlug("고급")).toBe("advanced");
  });

  it("converts random to random", () => {
    expect(difficultyToSlug("random")).toBe("random");
  });

  it("roundtrips with slugToDifficulty", () => {
    for (const diff of DIFFICULTIES) {
      const slug = difficultyToSlug(diff.id);
      expect(slugToDifficulty(slug)).toBe(diff.id);
    }
  });
});
