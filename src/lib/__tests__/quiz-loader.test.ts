import { describe, it, expect } from "vitest";
import {
  getQuizzesByCategory,
  getQuizzesBySubcategory,
  filterQuizzes,
  shuffle,
  getSubcategoryCounts,
  getCategoryQuizCount,
} from "@/lib/quiz-loader";
import { SUBCATEGORIES } from "@/lib/constants";

describe("getQuizzesByCategory", () => {
  it("returns quizzes for linux-kernel", () => {
    const quizzes = getQuizzesByCategory("linux-kernel");
    expect(quizzes.length).toBeGreaterThan(0);
    expect(quizzes.every((q) => q.category === "linux-kernel")).toBe(true);
  });

  it("returns quizzes for android-system", () => {
    const quizzes = getQuizzesByCategory("android-system");
    expect(quizzes.length).toBeGreaterThan(0);
    expect(quizzes.every((q) => q.category === "android-system")).toBe(true);
  });
});

describe("getQuizzesBySubcategory", () => {
  it("returns all quizzes when subcategory is 'all'", () => {
    const all = getQuizzesByCategory("linux-kernel");
    const fromAll = getQuizzesBySubcategory("linux-kernel", "all");
    expect(fromAll).toEqual(all);
  });

  it("returns quizzes for a specific subcategory", () => {
    const quizzes = getQuizzesBySubcategory(
      "linux-kernel",
      "process-management"
    );
    expect(quizzes.length).toBeGreaterThan(0);
    expect(
      quizzes.every((q) => q.subcategory === "process-management")
    ).toBe(true);
  });

  it("returns empty array for unknown subcategory", () => {
    const quizzes = getQuizzesBySubcategory("linux-kernel", "nonexistent");
    expect(quizzes).toEqual([]);
  });
});

describe("filterQuizzes", () => {
  it("filters by difficulty", () => {
    const quizzes = filterQuizzes("linux-kernel", "all", "초급");
    expect(quizzes.length).toBeGreaterThan(0);
    expect(quizzes.every((q) => q.difficulty === "초급")).toBe(true);
  });

  it("returns all quizzes when difficulty is 'random'", () => {
    const all = getQuizzesBySubcategory("linux-kernel", "all");
    const random = filterQuizzes("linux-kernel", "all", "random");
    expect(random).toEqual(all);
  });

  it("returns all quizzes when difficulty is undefined", () => {
    const all = getQuizzesBySubcategory("linux-kernel", "all");
    const noFilter = filterQuizzes("linux-kernel", "all");
    expect(noFilter).toEqual(all);
  });
});

describe("shuffle", () => {
  it("preserves array length", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("contains the same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("returns empty array for empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

describe("getSubcategoryCounts", () => {
  it("returns counts for all subcategories", () => {
    const counts = getSubcategoryCounts("linux-kernel");
    const expectedIds = SUBCATEGORIES["linux-kernel"].map((s) => s.id);
    expect(Object.keys(counts).sort()).toEqual(expectedIds.sort());
  });

  it("all counts are positive", () => {
    const counts = getSubcategoryCounts("linux-kernel");
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(0);
    }
  });
});

describe("getCategoryQuizCount", () => {
  it("returns positive count for linux-kernel", () => {
    expect(getCategoryQuizCount("linux-kernel")).toBeGreaterThan(0);
  });

  it("equals sum of subcategory counts", () => {
    const counts = getSubcategoryCounts("linux-kernel");
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(getCategoryQuizCount("linux-kernel")).toBe(sum);
  });
});
