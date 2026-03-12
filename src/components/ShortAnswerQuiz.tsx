"use client";

import { useState, useMemo } from "react";
import type { Quiz } from "@/types/quiz";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { DIFFICULTIES } from "@/lib/constants";
import { checkBlank } from "@/lib/quiz-utils";

export function ShortAnswerQuiz({
  quiz,
  questionNumber,
  onNext,
}: {
  quiz: Quiz;
  questionNumber: number;
  onNext: () => void;
}) {
  const blankCount = quiz.blankAnswers?.length ?? 0;
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(blankCount).fill("")
  );
  const [submitted, setSubmitted] = useState(false);
  const { saveResult, getResult } = useQuizProgress();

  const previousResult = getResult(quiz.id);
  const isAnswered = submitted || previousResult !== undefined;

  const blankResults = useMemo(() => {
    if (!submitted || !quiz.blankAnswers) return null;
    return quiz.blankAnswers.map((acceptable, i) =>
      checkBlank(answers[i] ?? "", acceptable)
    );
  }, [submitted, quiz.blankAnswers, answers]);

  const isCorrect = submitted
    ? blankResults?.every(Boolean) ?? false
    : previousResult?.correct;

  const difficultyInfo = DIFFICULTIES.find((d) => d.id === quiz.difficulty);

  const textParts = useMemo(() => {
    return quiz.question.split("___");
  }, [quiz.question]);

  function handleSubmit() {
    if (answers.some((a) => !a.trim())) return;
    const results = quiz.blankAnswers!.map((acceptable, i) =>
      checkBlank(answers[i], acceptable)
    );
    const correct = results.every(Boolean);
    setSubmitted(true);
    saveResult(quiz.id, correct);
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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

      {/* Question with inline blanks */}
      <div className="text-lg font-medium text-gray-100 leading-relaxed">
        {textParts.map((part, i) => (
          <span key={i}>
            {part}
            {i < textParts.length - 1 && (
              <span className="inline-block align-baseline mx-1">
                {isAnswered ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-sm border ${
                      submitted && blankResults
                        ? blankResults[i]
                          ? "border-green-500 bg-green-500/10 text-green-300"
                          : "border-red-500 bg-red-500/10 text-red-300"
                        : previousResult
                          ? previousResult.correct
                            ? "border-green-500 bg-green-500/10 text-green-300"
                            : "border-gray-600 bg-gray-800 text-gray-300"
                          : ""
                    }`}
                  >
                    {submitted
                      ? answers[i] || "___"
                      : quiz.blankAnswers?.[i]?.[0] ?? "___"}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={answers[i] ?? ""}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                    placeholder={`빈칸 ${i + 1}`}
                    className="inline-block w-40 px-2 py-0.5 rounded border border-blue-500/50 bg-gray-800 text-blue-300 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-400"
                  />
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Submit / Result */}
      {!isAnswered ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some((a) => !a.trim())}
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

          {/* Blank Answers */}
          {quiz.blankAnswers && (
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                정답
              </h4>
              <div className="space-y-2">
                {quiz.blankAnswers.map((acceptable, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">빈칸 {i + 1}:</span>
                    <code className="px-2 py-0.5 rounded bg-gray-700 text-green-300 font-mono">
                      {acceptable[0]}
                    </code>
                    {submitted && blankResults && (
                      <span
                        className={
                          blankResults[i] ? "text-green-400" : "text-red-400"
                        }
                      >
                        {blankResults[i] ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
