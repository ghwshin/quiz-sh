import Link from "next/link";
import { CATEGORIES, SUBCATEGORIES, DIFFICULTIES, difficultyToSlug } from "@/lib/constants";
import { filterQuizzes, getQuizzesBySubcategory } from "@/lib/quiz-loader";
import { DifficultyProgress, ResetButton } from "@/components/DifficultyProgress";
import type { Category, Difficulty } from "@/types/quiz";

export function generateStaticParams() {
  const params: { category: string; subcategory: string }[] = [];
  for (const cat of CATEGORIES) {
    params.push({ category: cat.id, subcategory: "all" });
    for (const sub of SUBCATEGORIES[cat.id]) {
      params.push({ category: cat.id, subcategory: sub.id });
    }
  }
  return params;
}

const difficultyBorder: Record<string, string> = {
  초급: "hover:border-green-500",
  중급: "hover:border-yellow-500",
  고급: "hover:border-red-500",
  random: "hover:border-purple-500",
};

const difficultyBg: Record<string, string> = {
  초급: "bg-green-400/10",
  중급: "bg-yellow-400/10",
  고급: "bg-red-400/10",
  random: "bg-purple-400/10",
};

export default async function DifficultyPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const cat = CATEGORIES.find((c) => c.id === category);
  if (!cat) return <div>카테고리를 찾을 수 없습니다.</div>;

  const subName =
    subcategory === "all"
      ? "전체"
      : SUBCATEGORIES[category as Category]?.find((s) => s.id === subcategory)
          ?.name ?? subcategory;

  const allQuizzes = getQuizzesBySubcategory(category as Category, subcategory);
  const totalCount = allQuizzes.length;

  const difficultyCounts: { id: Difficulty | "random"; slug: string; name: string; color: string; count: number }[] = [
    ...DIFFICULTIES.map((d) => ({
      ...d,
      count: filterQuizzes(category as Category, subcategory, d.id).length,
    })),
    { id: "random" as const, slug: "random", name: "랜덤", color: "text-purple-400", count: totalCount },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <Link
        href={`/quiz/${category}`}
        className="text-gray-400 hover:text-white text-sm mb-6 self-start max-w-3xl w-full mx-auto"
      >
        &larr; {cat.name}
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-center">{subName}</h1>
      <p className="text-gray-400 mb-8 text-center">
        총 {totalCount}문제 · 난이도를 선택하세요
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {difficultyCounts.map((d) => (
          <Link
            key={d.id}
            href={`/quiz/${category}/${subcategory}/${d.slug}`}
            className={`rounded-xl border border-gray-700 bg-gray-900 p-5 ${difficultyBorder[d.id]} hover:bg-gray-800 transition-colors`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${difficultyBg[d.id]} ${d.color}`}
              >
                {d.id === "random" ? "?" : d.name[0]}
              </span>
              <h2 className={`text-lg font-semibold ${d.color}`}>{d.name}</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{d.count}문제</span>
              <DifficultyProgress
                category={category as Category}
                subcategory={subcategory}
                difficulty={d.id}
                total={d.count}
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ResetButton category={category as Category} subcategory={subcategory} />
      </div>
    </main>
  );
}
