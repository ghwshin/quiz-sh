"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Quiz, Category } from "@/types/quiz";
import { shuffle } from "@/lib/quiz-loader";
import { MultipleChoiceQuiz } from "@/components/MultipleChoiceQuiz";
import { ShortAnswerQuiz } from "@/components/ShortAnswerQuiz";
import { CodeFillQuiz } from "@/components/CodeFillQuiz";

export function QuizSession({
  quizzes,
  category,
  subcategory,
  difficulty,
  categoryName,
}: {
  quizzes: Quiz[];
  category: Category;
  subcategory: string;
  difficulty: string;
  categoryName: string;
}) {
  const shuffledQuizzes = useMemo(
    () => (difficulty === "random" ? shuffle(quizzes) : quizzes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const total = shuffledQuizzes.length;
  const quiz = shuffledQuizzes[currentIndex];

  if (!quiz || total === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 mb-4">문제가 없습니다.</p>
        <Link
          href={`/quiz/${category}/${subcategory}`}
          className="text-blue-400 hover:text-blue-300"
        >
          돌아가기
        </Link>
      </main>
    );
  }

  function goNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  const progressPercent = ((currentIndex + 1) / total) * 100;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Top bar */}
      <div className="w-full max-w-3xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/quiz/${category}/${subcategory}`}
            className="text-gray-400 hover:text-white text-sm"
          >
            &larr; {categoryName}
          </Link>
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quiz content */}
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-xl p-6">
        {quiz.type === "multiple-choice" && (
          <MultipleChoiceQuiz
            key={quiz.id}
            quiz={quiz}
            questionNumber={currentIndex + 1}
            onNext={goNext}
          />
        )}
        {quiz.type === "short-answer" && (
          <ShortAnswerQuiz
            key={quiz.id}
            quiz={quiz}
            questionNumber={currentIndex + 1}
            onNext={goNext}
          />
        )}
        {quiz.type === "code-fill" && (
          <CodeFillQuiz
            key={quiz.id}
            quiz={quiz}
            questionNumber={currentIndex + 1}
            onNext={goNext}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          이전
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          다음
        </button>
      </div>
    </main>
  );
}
