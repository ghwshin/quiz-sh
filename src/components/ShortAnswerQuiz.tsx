"use client";

import { useState } from "react";
import type { Quiz } from "@/types/quiz";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { DIFFICULTIES } from "@/lib/constants";

function checkKeywords(input: string, keywords: string[]): boolean {
  const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
  return keywords.every((kw) => normalized.includes(kw.toLowerCase()));
}

export function ShortAnswerQuiz({
  quiz,
  questionNumber,
  onNext,
}: {
  quiz: Quiz;
  questionNumber: number;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { saveResult, getResult } = useQuizProgress();

  const previousResult = getResult(quiz.id);
  const isAnswered = submitted || previousResult !== undefined;
  const isCorrect = submitted
    ? checkKeywords(answer, quiz.keywords ?? [])
    : previousResult?.correct;

  const difficultyInfo = DIFFICULTIES.find((d) => d.id === quiz.difficulty);

  function handleSubmit() {
    if (!answer.trim()) return;
    const correct = checkKeywords(answer, quiz.keywords ?? []);
    setSubmitted(true);
    saveResult(quiz.id, correct);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-gray-400 text-sm">문제 {questionNumber}</span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            quiz.difficulty === "초급"
              ? "bg-green-400/20 text-green-400"
              : quiz.difficulty === "중급"
                ? "bg-yellow-400/20 text-yellow-400"
                : "bg-red-400/20 text-red-400"
          }`}
        >
          {difficultyInfo?.name}
        </span>
        <span className="text-xs text-gray-500">{quiz.subcategory}</span>
      </div>

      {/* Question */}
      <p className="text-lg font-medium text-gray-100">{quiz.question}</p>

      {/* Text Input */}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={isAnswered}
        placeholder="답변을 입력하세요..."
        rows={4}
        className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-60 resize-y"
      />

      {/* Submit / Result */}
      {!isAnswered ? (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          제출
        </button>
      ) : (
        <div className="space-y-4">
          <div
            className={`text-sm font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}
          >
            {isCorrect ? "✓ 정답입니다!" : "✗ 오답입니다."}
          </div>

          {/* Keywords */}
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              필수 키워드
            </h4>
            <div className="flex flex-wrap gap-2">
              {quiz.keywords?.map((kw, idx) => {
                const found = answer
                  .toLowerCase()
                  .replace(/\s+/g, " ")
                  .includes(kw.toLowerCase());
                return (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      found
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {kw}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sample Answer */}
          {quiz.sampleAnswer && (
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                모범 답안
              </h4>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {quiz.sampleAnswer}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-400 mb-2">해설</h4>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {quiz.explanation}
            </p>
          </div>

          <button
            onClick={onNext}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
}
