import { CATEGORIES, SUBCATEGORIES, DIFFICULTIES, slugToDifficulty } from "@/lib/constants";
import { filterQuizzes } from "@/lib/quiz-loader";
import { QuizSession } from "@/components/QuizSession";
import type { Category, Difficulty } from "@/types/quiz";

export function generateStaticParams() {
  const params: { category: string; subcategory: string; difficulty: string }[] = [];
  const difficultySlugs = [...DIFFICULTIES.map((d) => d.slug), "random"];
  for (const cat of CATEGORIES) {
    const subcategoryIds = ["all", ...SUBCATEGORIES[cat.id].map((s) => s.id)];
    for (const sub of subcategoryIds) {
      for (const diff of difficultySlugs) {
        params.push({ category: cat.id, subcategory: sub, difficulty: diff });
      }
    }
  }
  return params;
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string; difficulty: string }>;
}) {
  const { category, subcategory, difficulty: diffSlug } = await params;
  const cat = CATEGORIES.find((c) => c.id === category);
  if (!cat) return <div>카테고리를 찾을 수 없습니다.</div>;

  const difficulty = slugToDifficulty(diffSlug);
  if (!difficulty) return <div>난이도를 찾을 수 없습니다.</div>;

  const quizzes = filterQuizzes(
    category as Category,
    subcategory,
    difficulty
  );

  const subName =
    subcategory === "all"
      ? "전체"
      : SUBCATEGORIES[category as Category]?.find((s) => s.id === subcategory)
          ?.name ?? subcategory;

  const diffName =
    difficulty === "random"
      ? "랜덤"
      : DIFFICULTIES.find((d) => d.id === difficulty)?.name ?? diffSlug;

  return (
    <QuizSession
      quizzes={quizzes}
      category={category as Category}
      subcategory={subcategory}
      difficulty={difficulty}
      categoryName={`${cat.name} · ${subName} · ${diffName}`}
    />
  );
}
