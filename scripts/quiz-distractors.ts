import fs from "fs";
import path from "path";
import { loadAllQuizFiles, classifyShape } from "./quiz-data";
import type { AnswerShape } from "./quiz-data";
import type { Quiz } from "../src/types/quiz";

const DATA_DIR = path.join(__dirname, "..", "data");

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const files = loadAllQuizFiles();

  // Build shape-indexed pools per subcategory and per category
  const subcategoryShapedPool = new Map<string, Map<AnswerShape, string[]>>();
  const categoryShapedPool = new Map<string, Map<AnswerShape, string[]>>();
  // Flat pools as fallback (tier 3)
  const subcategoryPool = new Map<string, string[]>();

  for (const file of files) {
    const subKey = `${file.category}/${file.subcategory}`;
    if (!subcategoryShapedPool.has(subKey)) subcategoryShapedPool.set(subKey, new Map());
    if (!categoryShapedPool.has(file.category)) categoryShapedPool.set(file.category, new Map());
    if (!subcategoryPool.has(subKey)) subcategoryPool.set(subKey, []);

    for (const q of file.data) {
      if (q.blankAnswers) {
        for (const answers of q.blankAnswers) {
          const primary = answers[0];
          const shape = classifyShape(primary);

          // Subcategory shaped pool
          const subShapes = subcategoryShapedPool.get(subKey)!;
          if (!subShapes.has(shape)) subShapes.set(shape, []);
          subShapes.get(shape)!.push(primary);

          // Category shaped pool
          const catShapes = categoryShapedPool.get(file.category)!;
          if (!catShapes.has(shape)) catShapes.set(shape, []);
          catShapes.get(shape)!.push(primary);

          // Flat subcategory pool
          subcategoryPool.get(subKey)!.push(primary);
        }
      }
    }
  }

  let totalGenerated = 0;
  let totalBlanks = 0;
  const issues: string[] = [];

  // Dry-run stats
  let tierCounts = [0, 0, 0]; // tier1, tier2, tier3
  let shapeMatchCount = 0;
  let totalDistractors = 0;
  const mismatchExamples: string[] = [];

  for (const file of files) {
    let modified = false;

    for (const q of file.data) {
      if (q.type !== "short-answer" && q.type !== "code-fill" && !(q.type === "conversation" && q.conversationMode === "fill-blank")) continue;
      if (!q.blankAnswers) continue;

      totalBlanks += q.blankAnswers.length;

      const distractors: string[][] = [];

      // Collect ALL correct answers across ALL blanks in this question
      const allCorrectNorm = new Set<string>();
      for (const answers of q.blankAnswers) {
        for (const a of answers) {
          allCorrectNorm.add(normalize(a));
        }
      }

      for (let i = 0; i < q.blankAnswers.length; i++) {
        const correctAnswer = q.blankAnswers[i][0];
        const answerShape = classifyShape(correctAnswer);
        const subKey = `${q.category}/${q.subcategory}`;

        const selected: string[] = [];
        const usedNorm = new Set<string>(allCorrectNorm);
        let blankTier = 0;

        // Helper to pick candidates from a pool (deduplicated)
        const pickFrom = (pool: string[]): string[] => {
          const available: string[] = [];
          const seenNorm = new Set<string>();
          for (const c of pool) {
            const n = normalize(c);
            if (!usedNorm.has(n) && !seenNorm.has(n)) {
              available.push(c);
              seenNorm.add(n);
            }
          }
          return shuffle(available);
        };

        // Tier 1: same subcategory + same shape
        const tier1Pool = subcategoryShapedPool.get(subKey)?.get(answerShape) ?? [];
        for (const c of pickFrom(tier1Pool)) {
          if (selected.length >= 3) break;
          selected.push(c);
          usedNorm.add(normalize(c));
        }
        if (selected.length >= 2) blankTier = 1;

        // Tier 2: same category + same shape
        if (selected.length < 3) {
          const tier2Pool = categoryShapedPool.get(q.category)?.get(answerShape) ?? [];
          for (const c of pickFrom(tier2Pool)) {
            if (selected.length >= 3) break;
            selected.push(c);
            usedNorm.add(normalize(c));
          }
          if (blankTier === 0 && selected.length >= 2) blankTier = 2;
        }

        // Tier 3: same subcategory, any shape (fallback)
        if (selected.length < 2) {
          const tier3Pool = subcategoryPool.get(subKey) ?? [];
          for (const c of pickFrom(tier3Pool)) {
            if (selected.length >= 3) break;
            selected.push(c);
            usedNorm.add(normalize(c));
          }
          if (blankTier === 0 && selected.length >= 2) blankTier = 3;
        }

        if (blankTier === 0) blankTier = 3; // fallback even if < 2
        tierCounts[blankTier - 1]++;

        // Track shape match stats for dry-run
        for (const d of selected) {
          totalDistractors++;
          if (classifyShape(d) === answerShape) {
            shapeMatchCount++;
          } else if (mismatchExamples.length < 20) {
            mismatchExamples.push(
              `${q.id} blank ${i + 1}: answer="${correctAnswer}" (${answerShape}) vs distractor="${d}" (${classifyShape(d)})`
            );
          }
        }

        if (selected.length < 2) {
          issues.push(`${q.id} blank ${i + 1}: only ${selected.length} distractor(s) available`);
        }

        distractors.push(selected);
      }

      (q as Quiz & { blankDistractors: string[][] }).blankDistractors = distractors;
      totalGenerated += distractors.length;
      modified = true;
    }

    if (!dryRun && modified) {
      const filePath = path.join(DATA_DIR, file.path);
      fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2) + "\n", "utf-8");
      console.log(`Updated: ${file.path}`);
    }
  }

  console.log(`\nGenerated distractors for ${totalGenerated} blanks out of ${totalBlanks} total`);

  // Shape-match statistics
  const matchRate = totalDistractors > 0 ? ((shapeMatchCount / totalDistractors) * 100).toFixed(1) : "0";
  console.log(`\nShape-match rate: ${shapeMatchCount}/${totalDistractors} (${matchRate}%)`);
  console.log(`Tier usage: tier1=${tierCounts[0]}, tier2=${tierCounts[1]}, tier3=${tierCounts[2]}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No files were modified.");
    if (mismatchExamples.length > 0) {
      console.log(`\nShape mismatch examples (up to 20):`);
      for (const ex of mismatchExamples) {
        console.log(`  - ${ex}`);
      }
    }
  }

  if (issues.length > 0) {
    console.log(`\nIssues (${issues.length}):`);
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
  } else {
    console.log("No issues found.");
  }
}

main();
