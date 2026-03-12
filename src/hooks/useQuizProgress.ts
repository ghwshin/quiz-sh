"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Category, Difficulty } from "@/types/quiz";
import { filterQuizzes } from "@/lib/quiz-loader";

const STORAGE_KEY = "quiz-progress";

interface QuizResult {
  correct: boolean;
  answeredAt: string;
}

type ProgressData = Record<string, QuizResult>;

// --- external store for SSR-safe localStorage sync ---

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

let cachedSnapshot: ProgressData = {};
let cachedRaw: string | null = null;

function getSnapshot(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSnapshot = raw ? (JSON.parse(raw) as ProgressData) : {};
    }
    return cachedSnapshot;
  } catch {
    return cachedSnapshot;
  }
}

const SERVER_SNAPSHOT: ProgressData = {};

function getServerSnapshot(): ProgressData {
  return SERVER_SNAPSHOT;
}

function setProgress(data: ProgressData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  emitChange();
}

// --- hook ---

export function useQuizProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Save a quiz result */
  const saveResult = useCallback(
    (quizId: string, correct: boolean) => {
      const next = { ...progress, [quizId]: { correct, answeredAt: new Date().toISOString() } };
      setProgress(next);
    },
    [progress]
  );

  /** Get result for a specific quiz */
  const getResult = useCallback(
    (quizId: string): QuizResult | undefined => {
      return progress[quizId];
    },
    [progress]
  );

  /** Calculate progress for given filters */
  const getProgress = useCallback(
    (category: Category, subcategory: string, difficulty?: Difficulty | "random") => {
      const quizzes = filterQuizzes(category, subcategory, difficulty);
      const total = quizzes.length;
      const answered = quizzes.filter((q) => progress[q.id] !== undefined).length;
      const correct = quizzes.filter((q) => progress[q.id]?.correct).length;
      return { total, answered, correct };
    },
    [progress]
  );

  /** Reset progress for a category, or all if no category given */
  const reset = useCallback(
    (category?: Category) => {
      if (!category) {
        setProgress({});
        return;
      }
      const quizzes = filterQuizzes(category, "all");
      const quizIds = new Set(quizzes.map((q) => q.id));
      const next: ProgressData = {};
      for (const [id, result] of Object.entries(progress)) {
        if (!quizIds.has(id)) {
          next[id] = result;
        }
      }
      setProgress(next);
    },
    [progress]
  );

  /** All progress data */
  const allProgress = useMemo(() => progress, [progress]);

  return { saveResult, getResult, getProgress, reset, allProgress };
}
