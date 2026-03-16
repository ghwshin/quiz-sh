import fs from "fs";
import path from "path";
import { loadAllQuizFiles, ID_PREFIX_MAP, extractKeywords } from "./quiz-data";

function main() {
  const files = loadAllQuizFiles();
  const allIds: string[] = [];

  const fileEntries = files.map((file) => {
    const byType: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    const keywordSet = new Set<string>();

    const ids: string[] = [];
    for (const q of file.data) {
      ids.push(q.id);
      allIds.push(q.id);
      byType[q.type] = (byType[q.type] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;

      // Extract keywords from question, explanation, options, codeTemplate
      for (const kw of extractKeywords(q.question)) keywordSet.add(kw);
      for (const kw of extractKeywords(q.explanation)) keywordSet.add(kw);
      if (q.options) {
        for (const opt of q.options) {
          for (const kw of extractKeywords(opt)) keywordSet.add(kw);
        }
      }
      if (q.codeTemplate) {
        for (const kw of extractKeywords(q.codeTemplate)) keywordSet.add(kw);
      }
      if (q.conversation) {
        for (const msg of q.conversation) {
          if (msg.text) {
            for (const kw of extractKeywords(msg.text)) keywordSet.add(kw);
          }
          if (msg.code) {
            for (const kw of extractKeywords(msg.code)) keywordSet.add(kw);
          }
        }
      }
    }

    ids.sort();
    const idRange = ids.length > 0 ? `${ids[0]} ~ ${ids[ids.length - 1]}` : "";

    // Take top keywords by frequency (limit to keep manifest compact)
    const keywords = [...keywordSet].slice(0, 30);

    return {
      path: file.path,
      category: file.category,
      subcategory: file.subcategory,
      questionCount: file.data.length,
      byType,
      byDifficulty,
      idRange,
      keywords,
    };
  });

  const manifest = {
    generated: new Date().toISOString(),
    totalQuestions: allIds.length,
    files: fileEntries,
    allIds: allIds.sort(),
    idPrefixMap: ID_PREFIX_MAP,
  };

  const outPath = path.join(__dirname, "..", "data", "quiz-manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(`Manifest generated: ${outPath}`);
  console.log(`Total questions: ${manifest.totalQuestions}`);
  console.log(`Files: ${manifest.files.length}`);
}

main();
