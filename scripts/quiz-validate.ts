import { loadAllQuizFiles, getExpectedPrefix, countBlanks, classifyShape } from "./quiz-data";
import type { Quiz } from "../src/types/quiz";

interface ValidationError {
  id: string;
  message: string;
}

interface ValidationWarning {
  id: string;
  message: string;
}

const VALID_DIFFICULTIES = ["초급", "중급", "고급"] as const;
const VALID_TYPES = ["multiple-choice", "short-answer", "code-fill", "conversation", "terminal"] as const;

function validateFile(
  filePath: string,
  category: string,
  subcategory: string,
  quizzes: Quiz[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const idsInFile = new Set<string>();
  const expectedPrefix = getExpectedPrefix(subcategory, category);

  const isConversationFile = subcategory === "dev-conversation";
  const isTerminalFile = subcategory === "terminal-lab";

  // File-level: question count
  if (isTerminalFile) {
    if (quizzes.length < 5 || quizzes.length > 25) {
      errors.push({ id: filePath, message: `terminal-lab expected 5-25 questions, got ${quizzes.length}` });
    }
  } else if (quizzes.length !== 25) {
    errors.push({ id: filePath, message: `expected 25 questions, got ${quizzes.length}` });
  }

  const typeCounts: Record<string, number> = { "multiple-choice": 0, "short-answer": 0, "code-fill": 0, "conversation": 0, "terminal": 0 };

  for (const q of quizzes) {
    const id = q.id || "(missing id)";

    // ID uniqueness within file
    if (idsInFile.has(q.id)) {
      errors.push({ id, message: `duplicate id in file` });
    }
    idsInFile.add(q.id);

    // ID format: {prefix}-{NNN} (prefix may contain hyphens, e.g., "lk-tl")
    const idMatch = q.id.match(/^(.+)-(\d{3})$/);
    if (!idMatch) {
      errors.push({ id, message: `id format invalid, expected {prefix}-{NNN}` });
    } else {
      const prefix = idMatch[1];
      if (expectedPrefix && prefix !== expectedPrefix) {
        errors.push({
          id,
          message: `id prefix "${prefix}" does not match subcategory "${subcategory}" (expected "${expectedPrefix}")`,
        });
      }
    }

    // category/subcategory match
    if (q.category !== category) {
      errors.push({ id, message: `category "${q.category}" does not match file path "${category}"` });
    }
    if (q.subcategory !== subcategory) {
      errors.push({
        id,
        message: `subcategory "${q.subcategory}" does not match file path "${subcategory}"`,
      });
    }

    // difficulty
    if (!VALID_DIFFICULTIES.includes(q.difficulty as typeof VALID_DIFFICULTIES[number])) {
      errors.push({ id, message: `invalid difficulty "${q.difficulty}"` });
    }

    // type
    if (!VALID_TYPES.includes(q.type as typeof VALID_TYPES[number])) {
      errors.push({ id, message: `invalid type "${q.type}"` });
    }
    if (q.type in typeCounts) {
      typeCounts[q.type]++;
    }

    // explanation not empty
    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push({ id, message: `explanation is empty` });
    }

    // Type-specific validations
    if (q.type === "multiple-choice") {
      if (!q.options || q.options.length !== 4) {
        errors.push({ id, message: `multiple-choice must have exactly 4 options` });
      }
      if (q.answer === undefined || q.answer < 0 || q.answer > 3) {
        errors.push({ id, message: `answer index ${q.answer} out of range (0-3)` });
      }
    }

    if (q.type === "short-answer") {
      const blanks = countBlanks(q.question);
      const answers = q.blankAnswers?.length ?? 0;
      if (blanks !== answers) {
        errors.push({
          id,
          message: `blank count mismatch: ${blanks} in question, ${answers} in blankAnswers`,
        });
      }
      if (q.blankAnswers) {
        for (let i = 0; i < q.blankAnswers.length; i++) {
          if (!q.blankAnswers[i] || q.blankAnswers[i].length === 0) {
            errors.push({ id, message: `blankAnswers[${i}] is empty` });
          }
        }
      }
    }

    // blankDistractors validation (for both short-answer and code-fill)
    if (q.blankDistractors) {
      if (!q.blankAnswers) {
        errors.push({ id, message: `blankDistractors present but blankAnswers missing` });
      } else if (q.blankDistractors.length !== q.blankAnswers.length) {
        errors.push({
          id,
          message: `blankDistractors.length (${q.blankDistractors.length}) !== blankAnswers.length (${q.blankAnswers.length})`,
        });
      } else {
        for (let i = 0; i < q.blankDistractors.length; i++) {
          const dists = q.blankDistractors[i];
          if (dists.length < 2 || dists.length > 3) {
            errors.push({
              id,
              message: `blankDistractors[${i}] should have 2-3 items, got ${dists.length}`,
            });
          }
          // Check no overlap with correct answers from ANY blank in this question
          const allCorrectNorm = new Set<string>();
          for (const answers of q.blankAnswers) {
            for (const a of answers) {
              allCorrectNorm.add(a.toLowerCase().replace(/\s+/g, " ").trim());
            }
          }
          for (const d of dists) {
            const dNorm = d.toLowerCase().replace(/\s+/g, " ").trim();
            if (allCorrectNorm.has(dNorm)) {
              errors.push({
                id,
                message: `blankDistractors[${i}] contains correct answer "${d}" from this question`,
              });
            }
          }
          // Check no duplicate distractors
          const distNorms = dists.map((d: string) => d.toLowerCase().replace(/\s+/g, " ").trim());
          const distSet = new Set(distNorms);
          if (distSet.size !== distNorms.length) {
            errors.push({
              id,
              message: `blankDistractors[${i}] contains duplicates`,
            });
          }

          // Shape-mismatch warning
          const answerShape = classifyShape(q.blankAnswers[i][0]);
          for (const d of dists) {
            const dShape = classifyShape(d);
            if (dShape !== answerShape) {
              warnings.push({
                id,
                message: `blankDistractors[${i}] shape mismatch: answer "${q.blankAnswers[i][0]}" (${answerShape}) vs distractor "${d}" (${dShape})`,
              });
            }
          }
        }
      }
    }

    if (q.type === "code-fill") {
      if (!q.codeTemplate) {
        errors.push({ id, message: `code-fill missing codeTemplate` });
      } else {
        const blanks = countBlanks(q.codeTemplate);
        const answers = q.blankAnswers?.length ?? 0;
        if (blanks !== answers) {
          errors.push({
            id,
            message: `blank count mismatch: ${blanks} in codeTemplate, ${answers} in blankAnswers`,
          });
        }
      }
      if (!q.codeLanguage) {
        errors.push({ id, message: `code-fill missing codeLanguage` });
      }
      if (q.blankAnswers) {
        for (let i = 0; i < q.blankAnswers.length; i++) {
          if (!q.blankAnswers[i] || q.blankAnswers[i].length === 0) {
            errors.push({ id, message: `blankAnswers[${i}] is empty` });
          }
        }
      }
    }

    if (q.type === "conversation") {
      if (!q.conversation || q.conversation.length === 0) {
        errors.push({ id, message: `conversation type missing conversation array` });
      } else {
        for (let i = 0; i < q.conversation.length; i++) {
          const msg = q.conversation[i];
          if (!msg.speaker) errors.push({ id, message: `conversation[${i}] missing speaker` });
          if (!msg.role) errors.push({ id, message: `conversation[${i}] missing role` });
          if (!msg.avatar) errors.push({ id, message: `conversation[${i}] missing avatar` });
          if (!msg.text && !msg.code) {
            errors.push({ id, message: `conversation[${i}] must have text or code` });
          }
        }
      }
      if (!q.conversationMode) {
        errors.push({ id, message: `conversation type missing conversationMode` });
      } else if (q.conversationMode !== "objective" && q.conversationMode !== "fill-blank") {
        errors.push({ id, message: `invalid conversationMode "${q.conversationMode}"` });
      }
      if (q.conversationMode === "objective") {
        if (!q.options || q.options.length !== 4) {
          errors.push({ id, message: `conversation objective must have exactly 4 options` });
        }
        if (q.answer === undefined || q.answer < 0 || q.answer > 3) {
          errors.push({ id, message: `answer index ${q.answer} out of range (0-3)` });
        }
      }
      if (q.conversationMode === "fill-blank") {
        // Count blanks in conversation text fields
        let conversationBlanks = 0;
        if (q.conversation) {
          for (const msg of q.conversation) {
            if (msg.text) {
              const matches = msg.text.match(/___/g);
              if (matches) conversationBlanks += matches.length;
            }
          }
        }
        const answers = q.blankAnswers?.length ?? 0;
        if (conversationBlanks !== answers) {
          errors.push({
            id,
            message: `conversation blank count mismatch: ${conversationBlanks} in conversation text, ${answers} in blankAnswers`,
          });
        }
        if (q.blankAnswers) {
          for (let i = 0; i < q.blankAnswers.length; i++) {
            if (!q.blankAnswers[i] || q.blankAnswers[i].length === 0) {
              errors.push({ id, message: `blankAnswers[${i}] is empty` });
            }
          }
        }
      }

      // seniorHint validation
      if (!q.seniorHint || q.seniorHint.length === 0) {
        errors.push({ id, message: `conversation type missing seniorHint array` });
      } else {
        for (let i = 0; i < q.seniorHint.length; i++) {
          const hint = q.seniorHint[i];
          if (hint.role !== "시니어") {
            errors.push({ id, message: `seniorHint[${i}] role must be "시니어", got "${hint.role}"` });
          }
          if (!hint.speaker) errors.push({ id, message: `seniorHint[${i}] missing speaker` });
          if (!hint.avatar) errors.push({ id, message: `seniorHint[${i}] missing avatar` });
          if (!hint.text && !hint.code) {
            errors.push({ id, message: `seniorHint[${i}] must have text or code` });
          }
          if (hint.text && hint.text.includes("___")) {
            errors.push({ id, message: `seniorHint[${i}] must not contain blanks (___) ` });
          }
        }
      }

      if (q.conversation) {
        for (let i = 0; i < q.conversation.length; i++) {
          if (q.conversation[i].role === "시니어") {
            errors.push({ id, message: `conversation[${i}] must not have role "시니어" (use seniorHint instead)` });
          }
          if (q.conversation[i].role === "고객") {
            errors.push({ id, message: `conversation[${i}] must not have role "고객" (deprecated)` });
          }
        }
      }

      const validScenarioTypes = ["bug-report", "code-review", "design-discussion"];
      if (!q.scenarioType) {
        errors.push({ id, message: `conversation type missing scenarioType` });
      } else if (!validScenarioTypes.includes(q.scenarioType)) {
        errors.push({ id, message: `invalid scenarioType "${q.scenarioType}"` });
      }
    }

    if (q.type === "terminal") {
      if (!q.terminalConfig) {
        errors.push({ id, message: `terminal type missing terminalConfig` });
      } else {
        const tc = q.terminalConfig;
        if (!tc.environment || !tc.environment.hostname || !tc.environment.user || !tc.environment.cwd) {
          errors.push({ id, message: `terminalConfig.environment missing required fields (hostname, user, cwd)` });
        }
        if (!tc.filesystem || Object.keys(tc.filesystem).length === 0) {
          errors.push({ id, message: `terminalConfig.filesystem is empty` });
        }
        if (!tc.goalChecks || tc.goalChecks.length === 0) {
          errors.push({ id, message: `terminalConfig.goalChecks is empty` });
        } else {
          const validGoalTypes = ["file-exists", "file-not-exists", "file-contains", "file-permissions", "module-loaded", "module-not-loaded", "process-running", "process-stopped", "env-equals"];
          for (let i = 0; i < tc.goalChecks.length; i++) {
            const gc = tc.goalChecks[i];
            if (!gc.description) errors.push({ id, message: `goalChecks[${i}] missing description` });
            if (!validGoalTypes.includes(gc.type)) errors.push({ id, message: `goalChecks[${i}] invalid type "${gc.type}"` });
          }
        }
      }
      // Terminal questions must not have blank markers or answer/blankAnswers
      if (q.question.includes("___")) {
        errors.push({ id, message: `terminal type question must not contain blank markers (___)` });
      }
      if (q.answer !== undefined) {
        errors.push({ id, message: `terminal type must not have answer field` });
      }
      if (q.blankAnswers) {
        errors.push({ id, message: `terminal type must not have blankAnswers field` });
      }
    }
  }

  // Type distribution check
  if (isTerminalFile) {
    // Terminal files: all questions must be "terminal" type
    if (typeCounts["terminal"] !== quizzes.length) {
      errors.push({
        id: filePath,
        message: `terminal-lab: all questions must be type "terminal", got ${typeCounts["terminal"]}/${quizzes.length}`,
      });
    }
  } else if (isConversationFile) {
    // Conversation files: all 25 questions must be "conversation" type
    if (typeCounts["conversation"] !== 25) {
      errors.push({
        id: filePath,
        message: `expected 25 conversation, got ${typeCounts["conversation"]}`,
      });
    }
  } else {
    if (typeCounts["multiple-choice"] !== 10) {
      errors.push({
        id: filePath,
        message: `expected 10 multiple-choice, got ${typeCounts["multiple-choice"]}`,
      });
    }
    if (typeCounts["short-answer"] !== 8) {
      errors.push({
        id: filePath,
        message: `expected 8 short-answer, got ${typeCounts["short-answer"]}`,
      });
    }
    if (typeCounts["code-fill"] !== 7) {
      errors.push({
        id: filePath,
        message: `expected 7 code-fill, got ${typeCounts["code-fill"]}`,
      });
    }
  }

  return { errors, warnings };
}

function main() {
  console.log("Quiz Validation Report");
  console.log("======================\n");

  const files = loadAllQuizFiles();
  const globalIds = new Map<string, string>(); // id -> file path
  let totalErrors = 0;
  let totalWarnings = 0;
  let failedFiles = 0;

  for (const file of files) {
    const { errors, warnings } = validateFile(file.path, file.category, file.subcategory, file.data);

    // Check global ID uniqueness
    for (const q of file.data) {
      if (globalIds.has(q.id)) {
        errors.push({
          id: q.id,
          message: `duplicate id (also in ${globalIds.get(q.id)})`,
        });
      }
      globalIds.set(q.id, file.path);
    }

    const fileName = file.path.split("/").pop()!;
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`PASS  ${fileName} (${file.data.length} questions, 0 errors)`);
    } else if (errors.length === 0) {
      console.log(`PASS  ${fileName} (${file.data.length} questions, ${warnings.length} warnings)`);
      for (const w of warnings) {
        console.log(`  WARN  [${w.id}] ${w.message}`);
      }
    } else {
      failedFiles++;
      totalErrors += errors.length;
      console.log(`FAIL  ${fileName} (${file.data.length} questions, ${errors.length} errors, ${warnings.length} warnings)`);
      for (const err of errors) {
        console.log(`  ERROR [${err.id}] ${err.message}`);
      }
      for (const w of warnings) {
        console.log(`  WARN  [${w.id}] ${w.message}`);
      }
    }
    totalWarnings += warnings.length;
  }

  const shapeMatchRate = totalWarnings === 0 ? "100%" : `warnings: ${totalWarnings}`;
  console.log(
    `\nSummary: ${totalErrors} errors in ${failedFiles} files, ${files.length - failedFiles} files passed`
  );
  console.log(`Shape-mismatch warnings: ${totalWarnings} (${shapeMatchRate})`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
