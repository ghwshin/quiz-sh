# quiz.sh

CS quiz web app for developers.

**This file must be written in English only.**

## Tech Stack

- Next.js 15 (App Router, static export via `output: "export"`)
- React 19, TypeScript 5, Tailwind CSS 4
- No server/API — all data is static JSON, state is localStorage

## Commands

```bash
npm run dev          # Dev server (turbopack, 0.0.0.0)
npm run build        # Production build (static export to out/)
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npx playwright test  # E2E tests (requires build first)
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home — category selection
│   └── quiz/[category]/
│       ├── page.tsx              # Subcategory selection
│       └── [subcategory]/
│           ├── page.tsx          # Difficulty selection
│           └── [difficulty]/
│               └── page.tsx      # Quiz session
├── components/
│   ├── MultipleChoiceQuiz.tsx    # Multiple choice quiz component
│   ├── ShortAnswerQuiz.tsx       # Fill-in-the-blank quiz (inline inputs or word bank)
│   ├── CodeFillQuiz.tsx          # Code fill-in-the-blank (code block with inputs or word bank)
│   ├── ConversationQuiz.tsx      # Conversation scenario quiz (slack-style chat + senior hint + objective/fill-blank)
│   ├── TerminalQuiz.tsx          # Terminal emulator quiz (interactive shell missions)
│   ├── WordBank.tsx              # Word bank chip selection component (Duolingo-style)
│   ├── QuizSession.tsx           # Quiz session container (navigation, progress, mode toggle)
│   ├── DifficultyProgress.tsx    # Progress display per difficulty
│   └── SubcategoryProgress.tsx   # Progress display per subcategory
├── hooks/
│   ├── useQuizProgress.ts       # localStorage-based progress (useSyncExternalStore)
│   └── useQuizMode.ts           # Quiz mode (normal/hard) toggle (useSyncExternalStore)
├── lib/
│   ├── quiz-loader.ts           # Quiz data loading, filtering, shuffle
│   ├── quiz-utils.ts            # Shared utilities (checkBlank, countConversationBlanks)
│   ├── constants.ts             # Categories, subcategories, difficulties, scenario types
│   └── terminal/                # Terminal quiz engine
│       ├── shell.ts             # Shell parser (tokenizer, pipeline AST, executor)
│       ├── virtual-fs.ts        # In-memory virtual filesystem
│       ├── terminal-state.ts    # Unified state manager
│       ├── goal-checker.ts      # Mission completion verifier
│       └── commands/            # Command implementations (~30 commands)
│           ├── index.ts         # Command registry + info commands
│           ├── fs.ts            # Filesystem commands (ls, cat, grep, find, etc.)
│           ├── kernel.ts        # Kernel module commands (insmod, rmmod, lsmod, etc.)
│           ├── process.ts       # Process commands (ps, kill)
│           ├── network.ts       # Network commands (ip, ss, ping)
│           └── android.ts       # Android commands (adb, fastboot, logcat)
├── types/
│   └── quiz.ts                  # Quiz, Category, Difficulty, ScenarioType types
└── test/
    └── setup.ts                 # Vitest setup (jest-dom matchers, RTL cleanup)
data/
├── linux-kernel/*.json          # 18 subcategory quiz files (25 questions each, terminal-lab: 10)
└── android-system/*.json        # 17 subcategory quiz files (25 questions each, terminal-lab: 10)
e2e/
└── quiz-flow.spec.ts            # Playwright E2E tests
scripts/
├── quiz-data.ts                 # Shared utility (data loading, keyword extraction)
├── quiz-validate.ts             # Validate all quiz data against QUIZ.md rules
├── quiz-manifest.ts             # Generate data/quiz-manifest.json index
├── quiz-search.ts               # Search/lookup quiz questions
├── quiz-stats.ts                # Coverage statistics report
└── quiz-distractors.ts          # Generate blankDistractors for word bank mode
```

## Quiz Data

- 845 questions total: 35 files (33 x 25 + 2 x 10)
  - 31 standard files: 10 multiple-choice + 8 fill-in-the-blank + 7 code-fill per file
  - 2 conversation files (dev-conversation): 15 objective + 10 fill-blank per file
  - 2 terminal-lab files: 10 terminal questions per file
- See `QUIZ.md` for quiz data format rules
- 5 quiz types: multiple-choice, short-answer, code-fill, conversation, terminal
- Both `short-answer` and `code-fill` use `blankAnswers` field for blank grading (shared `checkBlank()`)
- `conversation` type: slack-style developer dialog with senior hint (collapsible), 3 scenario types (bug-report, code-review, design-discussion)
- 8 personas: 시니어(hint only), 신입, AI, 팀장, QA, 리뷰어, PM, 동료. Senior never in conversation array, only in `seniorHint`
- `blankDistractors` field: per-blank wrong choices for word bank mode (2-3 per blank)
- Grading: case-insensitive, trim, internal whitespace normalization
- Word bank (normal) mode: tap chips to fill blanks; Hard mode: type answers manually
- `terminal` type: interactive shell missions with virtual filesystem, goal-based grading (goalChecks)

## Quiz Data Tooling

```bash
npm run quiz:validate   # Validate all questions against QUIZ.md rules
npm run quiz:manifest   # Regenerate data/quiz-manifest.json
npm run quiz:search     # Search questions (--id, --keyword, --similar, --subcategory, --type, --difficulty)
npm run quiz:stats      # Coverage statistics report
npm run quiz:distractors # Generate/regenerate blankDistractors for word bank
```

When working with quiz data:
- Read `data/quiz-manifest.json` first for overview (instead of reading all 35 JSON files)
- Run `npm run quiz:validate` after any quiz data changes
- Use `npm run quiz:search -- --keyword "..."` to find existing questions before adding new ones

## Testing

### Writing Tests

Tests live in `__tests__/` directories next to the code they test:

- **Unit tests**: `src/lib/__tests__/*.test.ts`
- **Hook tests**: `src/hooks/__tests__/*.test.ts` — use `renderHook` from `@testing-library/react`
- **Component tests**: `src/components/__tests__/*.test.tsx` — use React Testing Library
- **E2E tests**: `e2e/*.spec.ts` — Playwright

Key points:
- `useQuizProgress` uses module-level state (`useSyncExternalStore`). Call `localStorage.clear()` in `beforeEach` to reset between tests.
- When calling `saveResult` multiple times in hook tests, use separate `act()` blocks — the hook reads stale closures within a single `act`.
- Component tests auto-cleanup via `src/test/setup.ts`.

### Verification After Changes

Always run these after modifying code:

```bash
npm run test:run     # All unit/component tests
npm run typecheck    # Type safety
npm run lint         # Lint rules
```

For E2E (after UI/routing changes):

```bash
npm run build && npx playwright test   # 27 E2E tests
```

## Maintenance Rules

- **CLAUDE.md must be written in English only.** Do not use Korean or other languages in this file.
- **Update CLAUDE.md** after completing work if any of the following apply:
  - Project structure changes (files/directories added, removed, or moved)
  - New commands added or existing commands changed
  - Test count changes
  - Quiz data structure changes
  - New libraries or tools introduced
  - Development workflow or convention changes
