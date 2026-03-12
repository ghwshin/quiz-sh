import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryQuizCount } from "@/lib/quiz-loader";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold mb-2 text-center">
        Linux &amp; Android 퀴즈
      </h1>
      <p className="text-gray-400 mb-10 text-center">
        Linux Kernel과 Android System의 핵심 개념을 퀴즈로 학습하세요
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {CATEGORIES.map((cat) => {
          const count = getCategoryQuizCount(cat.id);
          return (
            <Link
              key={cat.id}
              href={`/quiz/${cat.id}`}
              className="block rounded-xl border border-gray-700 bg-gray-900 p-6 hover:border-blue-500 hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">{cat.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{cat.description}</p>
              <span className="text-sm text-blue-400">{count}문제</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
