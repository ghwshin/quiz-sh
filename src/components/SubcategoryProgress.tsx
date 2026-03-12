"use client";

import { useQuizProgress } from "@/hooks/useQuizProgress";
import type { Category } from "@/types/quiz";

export function SubcategoryProgress({
  category,
  subcategory,
  total,
}: {
  category: Category;
  subcategory: string;
  total: number;
}) {
  const { getProgress } = useQuizProgress();
  const { answered } = getProgress(category, subcategory);

  return (
    <span className="text-sm text-blue-400">
      {answered}/{total} 완료
    </span>
  );
}
