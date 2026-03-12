# Linux & Android Quiz

Static quiz web app for learning Linux Kernel and Android System concepts.

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
│   ├── ShortAnswerQuiz.tsx       # Short answer (keyword matching)
│   ├── CodeFillQuiz.tsx          # Code fill-in-the-blank
│   ├── QuizSession.tsx           # Quiz session container (navigation, progress)
│   ├── DifficultyProgress.tsx    # Progress display per difficulty
│   └── SubcategoryProgress.tsx   # Progress display per subcategory
├── hooks/
│   └── useQuizProgress.ts       # localStorage-based progress (useSyncExternalStore)
├── lib/
│   ├── quiz-loader.ts           # Quiz data loading, filtering, shuffle
│   └── constants.ts             # Categories, subcategories, difficulties
├── types/
│   └── quiz.ts                  # Quiz, Category, Difficulty types
└── test/
    └── setup.ts                 # Vitest setup (jest-dom matchers, RTL cleanup)
data/
├── linux-kernel/*.json          # 10 subcategory quiz files
└── android-system/*.json        # 10 subcategory quiz files
e2e/
└── quiz-flow.spec.ts            # Playwright E2E tests
```

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
npm run test:run     # All 71 unit/component tests
npm run typecheck    # Type safety
npm run lint         # Lint rules
```

For E2E (after UI/routing changes):

```bash
npm run build && npx playwright test   # 6 E2E tests
```
