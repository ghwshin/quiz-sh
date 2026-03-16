import fs from "fs";
import path from "path";
import type { Quiz, Category } from "../src/types/quiz";

const DATA_DIR = path.join(__dirname, "..", "data");

export interface QuizFile {
  path: string;
  category: Category;
  subcategory: string;
  data: Quiz[];
}

export function loadAllQuizFiles(): QuizFile[] {
  const results: QuizFile[] = [];
  const categories: Category[] = ["linux-kernel", "android-system"];

  for (const category of categories) {
    const categoryDir = path.join(DATA_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const subcategory = file.replace(".json", "");
      const raw = fs.readFileSync(filePath, "utf-8");
      const data: Quiz[] = JSON.parse(raw);
      results.push({
        path: `${category}/${file}`,
        category,
        subcategory,
        data,
      });
    }
  }

  return results;
}

export const ID_PREFIX_MAP: Record<string, string> = {
  pm: "process-management",
  mm: "memory-management",
  fs: "filesystem",
  dd: "device-driver",
  nw: "networking",
  km: "kernel-module",
  sc: "scheduling",
  sy: "system-call",
  si: "synchronization-ipc",
  bp: "boot-process",
  kd: "kernel-observability-debugging",
  ci: "containers-isolation",
  io: "block-storage-io",
  aa: "arm64-architecture",
  sa: "system-architecture",
  as: "activity-service",
  bi: "binder-ipc",
  hl: "hal",
  ar: "android-runtime",
  bs: "build-system",
  se: "selinux-security",
  iz: "init-zygote",
  fw: "framework-services",
  ha: "hidl-aidl",
  bu: "boot-integrity-updates",
  dp: "platform-debugging-performance",
  mv: "platform-modularity-virtualization",
  ap: "arm64-platform",
  dc: "dev-conversation",
  ad: "dev-conversation",
};

// Reverse map: subcategory -> prefix (for subcategories with multiple prefixes, use category-aware lookup)
export const SUBCATEGORY_PREFIX_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ID_PREFIX_MAP).map(([prefix, sub]) => [sub, prefix])
);

// Category-aware prefix map for subcategories shared across categories
export const CATEGORY_PREFIX_MAP: Record<string, Record<string, string>> = {
  "linux-kernel": { "dev-conversation": "dc" },
  "android-system": { "dev-conversation": "ad" },
};

/** Get expected ID prefix for a subcategory, optionally with category context */
export function getExpectedPrefix(subcategory: string, category?: string): string | undefined {
  if (category && CATEGORY_PREFIX_MAP[category]?.[subcategory]) {
    return CATEGORY_PREFIX_MAP[category][subcategory];
  }
  return SUBCATEGORY_PREFIX_MAP[subcategory];
}

export function extractKeywords(text: string): string[] {
  // Remove code-like syntax noise
  const cleaned = text
    .replace(/[{}()\[\];,.:=<>!&|+\-*/%^~?#@"'`\\]/g, " ")
    .replace(/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|need|must|to|of|in|for|on|at|by|with|from|as|into|through|during|before|after|above|below|between|under|over|that|this|these|those|it|its|and|or|but|if|then|else|when|while|where|how|what|which|who|whom|whose|not|no|nor|so|than|too|very|just|about|also|both|each|few|more|most|other|some|such|only|own|same|all|any|every|다|에서|를|은|는|이|가|의|에|으로|로|와|과|하는|한|된|되는|할|합니다|합니다|것|수|있는|있다|없는|없다|때|중|내)\b/gi, " ");

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  return [...new Set(words)];
}

export type AnswerShape =
  | "number" | "path" | "macro_invocation" | "function_call"
  | "macro_or_const" | "korean_concept" | "identifier" | "phrase";

export function classifyShape(s: string): AnswerShape {
  const t = s.trim();
  if (/^-?\d+$/.test(t) || /^0[xX][0-9a-fA-F]+$/.test(t)) return "number";
  if (/^[\/.]/.test(t)) return "path";
  if (/^[A-Z][A-Z0-9_]+\(/.test(t)) return "macro_invocation";
  if (/\)$/.test(t)) return "function_call";
  if (/^[A-Z][A-Z0-9_]+$/.test(t)) return "macro_or_const";
  if (/[\uAC00-\uD7AF]/.test(t)) return "korean_concept";
  if (/^[a-z][a-z0-9_.:-]*$/i.test(t) && !/\s/.test(t)) return "identifier";
  return "phrase";
}

export function countBlanks(text: string): number {
  const matches = text.match(/___/g);
  return matches ? matches.length : 0;
}
