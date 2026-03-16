"use client";

import { useState, useMemo, useCallback } from "react";
import type { Quiz } from "@/types/quiz";
import type { QuizMode } from "@/hooks/useQuizMode";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { DIFFICULTIES } from "@/lib/constants";
import { checkBlank } from "@/lib/quiz-utils";
import { WordBank } from "@/components/WordBank";

const ROLE_COLORS: Record<string, string> = {
  "팀장": "text-orange-400",
  "시니어": "text-blue-400",
  "신입": "text-green-400",
  "AI": "text-purple-400",
  "QA": "text-amber-400",
  "리뷰어": "text-cyan-400",
  "PM": "text-pink-400",
  "동료": "text-teal-400",
};

const LANGUAGE_LABELS: Record<string, string> = {
  c: "C",
  java: "Java",
  kotlin: "Kotlin",
  cpp: "C++",
  shell: "Shell",
  bash: "Bash",
  python: "Python",
  xml: "XML",
  makefile: "Makefile",
};

export function ConversationQuiz({
  quiz,
  questionNumber,
  onNext,
  onResult,
  mode = "hard",
}: {
  quiz: Quiz;
  questionNumber: number;
  onNext: () => void;
  onResult?: (correct: boolean) => void;
  mode?: QuizMode;
}) {
  const isObjective = quiz.conversationMode === "objective";
  const blankCount = quiz.blankAnswers?.length ?? 0;

  // Objective mode state
  const [selected, setSelected] = useState<number | null>(null);

  // Fill-blank mode state
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(blankCount).fill("")
  );
  const [filledValues, setFilledValues] = useState<(string | null)[]>(() =>
    Array(blankCount).fill(null)
  );
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(
    blankCount > 0 ? 0 : null
  );

  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const { saveResult, getResult, clearResult } = useQuizProgress();

  const useWordBank =
    !isObjective &&
    mode === "normal" &&
    !!quiz.blankDistractors &&
    quiz.blankDistractors.length > 0;

  const previousResult = getResult(quiz.id);
  const isAnswered = submitted || previousResult !== undefined;

  const blankResults = useMemo(() => {
    if (!submitted || isObjective || !quiz.blankAnswers) return null;
    const vals = useWordBank ? filledValues.map((v) => v ?? "") : answers;
    return quiz.blankAnswers.map((acceptable, i) =>
      checkBlank(vals[i] ?? "", acceptable)
    );
  }, [submitted, isObjective, quiz.blankAnswers, answers, filledValues, useWordBank]);

  const isCorrect = submitted
    ? isObjective
      ? selected === quiz.answer
      : blankResults?.every(Boolean) ?? false
    : previousResult?.correct;

  const difficultyInfo = DIFFICULTIES.find((d) => d.id === quiz.difficulty);

  function handleSubmit() {
    if (isObjective) {
      if (selected === null) return;
      const correct = selected === quiz.answer;
      setSubmitted(true);
      saveResult(quiz.id, correct);
      onResult?.(correct);
    } else if (useWordBank) {
      if (filledValues.some((v) => v === null)) return;
      const results = quiz.blankAnswers!.map((acceptable, i) =>
        checkBlank(filledValues[i] ?? "", acceptable)
      );
      const correct = results.every(Boolean);
      setSubmitted(true);
      saveResult(quiz.id, correct);
      onResult?.(correct);
    } else {
      if (answers.some((a) => !a.trim())) return;
      const results = quiz.blankAnswers!.map((acceptable, i) =>
        checkBlank(answers[i], acceptable)
      );
      const correct = results.every(Boolean);
      setSubmitted(true);
      saveResult(quiz.id, correct);
      onResult?.(correct);
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const handleChipSelect = useCallback(
    (value: string) => {
      if (activeBlankIndex === null) return;
      setFilledValues((prev) => {
        const next = [...prev];
        next[activeBlankIndex] = value;
        return next;
      });
      setActiveBlankIndex((currentActive) => {
        for (let i = 1; i < blankCount; i++) {
          const nextIdx = (currentActive! + i) % blankCount;
          if (filledValues[nextIdx] === null && nextIdx !== currentActive) {
            return nextIdx;
          }
        }
        return null;
      });
    },
    [activeBlankIndex, blankCount, filledValues]
  );

  const handleBlankClear = useCallback((index: number) => {
    setFilledValues((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setActiveBlankIndex(index);
  }, []);

  const wordBankBlanks = useMemo(() => {
    if (!quiz.blankAnswers || !quiz.blankDistractors) return [];
    return quiz.blankAnswers.map((ans, i) => ({
      answer: ans[0],
      distractors: quiz.blankDistractors![i] ?? [],
    }));
  }, [quiz.blankAnswers, quiz.blankDistractors]);

  const isSubmitDisabled = isObjective
    ? selected === null
    : useWordBank
      ? filledValues.some((v) => v === null)
      : answers.some((a) => !a.trim());

  // Track blank index across conversation messages for fill-blank mode
  let globalBlankIdx = 0;

  function renderMessageText(text: string) {
    if (isObjective || !text.includes("___")) {
      return <span>{text}</span>;
    }

    const parts = text.split("___");
    return (
      <>
        {parts.map((part, i) => {
          const blankIdx = globalBlankIdx;
          if (i < parts.length - 1) globalBlankIdx++;
          return (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span className="inline-block align-baseline mx-1">
                  {isAnswered ? (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-sm border ${
                        submitted && blankResults
                          ? blankResults[blankIdx]
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
                        ? (useWordBank ? filledValues[blankIdx] : answers[blankIdx]) || "___"
                        : quiz.blankAnswers?.[blankIdx]?.[0] ?? "___"}
                    </span>
                  ) : useWordBank ? (
                    <button
                      type="button"
                      onClick={() =>
                        filledValues[blankIdx] !== null
                          ? handleBlankClear(blankIdx)
                          : setActiveBlankIndex(blankIdx)
                      }
                      className={`inline-block min-w-[60px] px-2 py-0.5 rounded text-sm transition-all ${
                        filledValues[blankIdx] !== null
                          ? "bg-gray-800 border border-gray-600 text-gray-200 cursor-pointer hover:border-red-400"
                          : activeBlankIndex === blankIdx
                            ? "border-dashed border-2 border-blue-400 bg-gray-800 ring-2 ring-blue-400/30 cursor-pointer"
                            : "border-dashed border border-blue-500/50 bg-gray-800 cursor-pointer"
                      }`}
                      data-testid={`blank-slot-${blankIdx + 1}`}
                    >
                      {filledValues[blankIdx] ?? `빈칸 ${blankIdx + 1}`}
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={answers[blankIdx] ?? ""}
                      onChange={(e) => updateAnswer(blankIdx, e.target.value)}
                      placeholder={`빈칸 ${blankIdx + 1}`}
                      className="inline-block w-40 px-2 py-0.5 rounded border border-blue-500/50 bg-gray-800 text-blue-300 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-400"
                    />
                  )}
                </span>
              )}
            </span>
          );
        })}
      </>
    );
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
        <span className="text-xs px-2 py-0.5 rounded bg-purple-400/20 text-purple-400">
          대화형
        </span>
        {quiz.scenarioType && (
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-400">
            {quiz.scenarioType === "bug-report" ? "버그 리포트" : quiz.scenarioType === "code-review" ? "코드 리뷰" : "설계 토론"}
          </span>
        )}
      </div>

      {/* Conversation Messages */}
      <div className="space-y-3 border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        {quiz.conversation?.map((msg, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 text-xl w-7 h-7 flex items-center justify-center" aria-hidden="true">
              {msg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-200">
                  {msg.speaker}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    ROLE_COLORS[msg.role] ?? "text-gray-400"
                  } bg-gray-800`}
                >
                  {msg.role}
                </span>
              </div>
              {msg.text && (
                <div className="text-sm text-gray-300 leading-relaxed">
                  {renderMessageText(msg.text)}
                </div>
              )}
              {msg.code && (
                <div className="mt-2 border border-gray-700 rounded-lg overflow-hidden">
                  {msg.codeLanguage && (
                    <div className="text-xs text-gray-500 px-3 py-1 bg-gray-800 border-b border-gray-700">
                      {LANGUAGE_LABELS[msg.codeLanguage] ?? msg.codeLanguage}
                    </div>
                  )}
                  <pre className="p-3 bg-gray-900 text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
                    {msg.code}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Senior Hint */}
      {quiz.seniorHint && quiz.seniorHint.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>{showHint ? "▼" : "▶"}</span>
            <span>💡 시니어에게 도움 받기</span>
          </button>
          {showHint && (
            <div className="mt-3 space-y-3 border-l-2 border-blue-400/50 pl-4">
              {quiz.seniorHint.map((msg, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 text-xl w-7 h-7 flex items-center justify-center" aria-hidden="true">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-200">
                        {msg.speaker}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          ROLE_COLORS[msg.role] ?? "text-gray-400"
                        } bg-gray-800`}
                      >
                        {msg.role}
                      </span>
                    </div>
                    {msg.text && (
                      <div className="text-sm text-gray-300 leading-relaxed">
                        <span>{msg.text}</span>
                      </div>
                    )}
                    {msg.code && (
                      <div className="mt-2 border border-gray-700 rounded-lg overflow-hidden">
                        {msg.codeLanguage && (
                          <div className="text-xs text-gray-500 px-3 py-1 bg-gray-800 border-b border-gray-700">
                            {LANGUAGE_LABELS[msg.codeLanguage] ?? msg.codeLanguage}
                          </div>
                        )}
                        <pre className="p-3 bg-gray-900 text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
                          {msg.code}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question */}
      <p className="text-lg font-medium text-gray-100">{quiz.question}</p>

      {/* Word Bank (fill-blank mode) */}
      {useWordBank && !isAnswered && (
        <WordBank
          blanks={wordBankBlanks}
          filledValues={filledValues}
          activeBlankIndex={activeBlankIndex}
          submitted={submitted}
          onChipSelect={handleChipSelect}
        />
      )}

      {/* Options (objective mode) */}
      {isObjective && (
        <div className="space-y-3">
          {quiz.options?.map((option, idx) => {
            const isThis = selected === idx;
            const isAnswer = quiz.answer === idx;

            let optionClass =
              "w-full text-left px-4 py-3 rounded-lg border transition-colors ";

            if (isAnswered) {
              if (isAnswer) {
                optionClass +=
                  "border-green-500 bg-green-500/10 text-green-300";
              } else if (isThis && !isAnswer) {
                optionClass += "border-red-500 bg-red-500/10 text-red-300";
              } else {
                optionClass +=
                  "border-gray-700 bg-gray-800/50 text-gray-500";
              }
            } else {
              optionClass += isThis
                ? "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600";
            }

            return (
              <button
                key={idx}
                onClick={() => !isAnswered && setSelected(idx)}
                disabled={isAnswered}
                className={optionClass}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Submit / Result */}
      {!isAnswered ? (
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
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

          {/* Blank Answers (fill-blank mode) */}
          {!isObjective && quiz.blankAnswers && (
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

          <div className="flex items-center gap-3">
            {!isCorrect && (
              <button
                onClick={() => {
                  clearResult(quiz.id);
                  setSubmitted(false);
                  setSelected(null);
                  setAnswers(Array(blankCount).fill(""));
                  setFilledValues(Array(blankCount).fill(null));
                  setActiveBlankIndex(blankCount > 0 ? 0 : null);
                  setShowHint(false);
                }}
                className="px-6 py-2 rounded-lg border border-yellow-600 text-yellow-400 font-medium hover:bg-yellow-600/10 transition-colors"
              >
                다시 풀기
              </button>
            )}
            <button
              onClick={onNext}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
            >
              다음 문제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
