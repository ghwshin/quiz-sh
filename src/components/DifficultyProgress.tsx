"use client";

import { useQuizProgress } from "@/hooks/useQuizProgress";
import type { Category, Difficulty } from "@/types/quiz";

export function DifficultyProgress({
  category,
  subcategory,
  difficulty,
  total,
}: {
  category: Category;
  subcategory: string;
  difficulty: Difficulty | "random";
  total: number;
}) {
  const { getProgress } = useQuizProgress();
  const { answered } = getProgress(category, subcategory, difficulty);

  return (
    <span className="text-sm text-blue-400">
      {answered}/{total} 완료
    </span>
  );
}

export function ResetButton({
  category,
  subcategory,
}: {
  category: Category;
  subcategory: string;
}) {
  const { getProgress, reset } = useQuizProgress();
  const { answered } = getProgress(category, subcategory);

  if (answered === 0) return null;

  return (
    <button
      onClick={() => {
        if (confirm("진행 상황을 초기화하시겠습니까?")) {
          reset(category);
        }
      }}
      className="text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded-lg px-4 py-2 transition-colors"
    >
      진행 상황 초기화
    </button>
  );
}
