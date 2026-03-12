import Link from "next/link";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/constants";
import { getSubcategoryCounts, getCategoryQuizCount } from "@/lib/quiz-loader";
import { SubcategoryProgress } from "@/components/SubcategoryProgress";
import type { Category } from "@/types/quiz";

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.id }));
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.id === category);
  if (!cat) return <div>카테고리를 찾을 수 없습니다.</div>;

  const subcategories = SUBCATEGORIES[category as Category];
  const counts = getSubcategoryCounts(category as Category);
  const totalCount = getCategoryQuizCount(category as Category);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <Link
        href="/"
        className="text-gray-400 hover:text-white text-sm mb-6 self-start max-w-3xl w-full mx-auto"
      >
        &larr; 메인으로
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-center">{cat.name}</h1>
      <p className="text-gray-400 mb-8 text-center">{cat.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {/* 전체 옵션 */}
        <Link
          href={`/quiz/${category}/all`}
          className="rounded-xl border border-gray-700 bg-gray-900 p-5 hover:border-blue-500 hover:bg-gray-800 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-1">전체</h2>
          <p className="text-gray-400 text-sm mb-3">
            모든 서브카테고리 문제
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{totalCount}문제</span>
            <SubcategoryProgress
              category={category as Category}
              subcategory="all"
              total={totalCount}
            />
          </div>
        </Link>

        {/* 각 서브카테고리 */}
        {subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/quiz/${category}/${sub.id}`}
            className="rounded-xl border border-gray-700 bg-gray-900 p-5 hover:border-blue-500 hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1">{sub.name}</h2>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">
                {counts[sub.id]}문제
              </span>
              <SubcategoryProgress
                category={category as Category}
                subcategory={sub.id}
                total={counts[sub.id]}
              />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
