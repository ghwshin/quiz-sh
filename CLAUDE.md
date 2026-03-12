# Linux & Android Quiz

Static quiz web app for learning Linux Kernel and Android System concepts.

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
│   ├── ShortAnswerQuiz.tsx       # Fill-in-the-blank quiz (inline inputs)
│   ├── CodeFillQuiz.tsx          # Code fill-in-the-blank (code block with inputs)
│   ├── QuizSession.tsx           # Quiz session container (navigation, progress)
│   ├── DifficultyProgress.tsx    # Progress display per difficulty
│   └── SubcategoryProgress.tsx   # Progress display per subcategory
├── hooks/
│   └── useQuizProgress.ts       # localStorage-based progress (useSyncExternalStore)
├── lib/
│   ├── quiz-loader.ts           # Quiz data loading, filtering, shuffle
│   ├── quiz-utils.ts            # Shared utilities (checkBlank)
│   └── constants.ts             # Categories, subcategories, difficulties
├── types/
│   └── quiz.ts                  # Quiz, Category, Difficulty types
└── test/
    └── setup.ts                 # Vitest setup (jest-dom matchers, RTL cleanup)
data/
├── linux-kernel/*.json          # 14 subcategory quiz files (25 questions each)
└── android-system/*.json        # 14 subcategory quiz files (25 questions each)
e2e/
└── quiz-flow.spec.ts            # Playwright E2E tests
```

## Quiz Data

- 700 questions total: 28 files x 25 questions (10 multiple-choice + 8 fill-in-the-blank + 7 code-fill)
- See `QUIZ.md` for quiz data format rules
- Both `short-answer` and `code-fill` use `blankAnswers` field for blank grading (shared `checkBlank()`)
- Grading: case-insensitive, trim, internal whitespace normalization

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
npm run test:run     # All 80 unit/component tests
npm run typecheck    # Type safety
npm run lint         # Lint rules
```

For E2E (after UI/routing changes):

```bash
npm run build && npx playwright test   # 6 E2E tests
```

## Maintenance Rules

- **CLAUDE.md must be written in English only.** Do not use Korean or other languages in this file.
- **Update CLAUDE.md** after completing work if any of the following apply:
  - Project structure changes (files/directories added, removed, or moved)
  - New commands added or existing commands changed
  - Test count changes (current: 80 unit/component, 6 E2E)
  - Quiz data structure changes
  - New libraries or tools introduced
  - Development workflow or convention changes
