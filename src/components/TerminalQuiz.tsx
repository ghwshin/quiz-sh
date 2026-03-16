"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import type { Quiz } from "@/types/quiz";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { DIFFICULTIES } from "@/lib/constants";
import { createTerminalState, executeCommand, type TerminalState } from "@/lib/terminal/terminal-state";
import { evaluateGoals, type GoalCheckResult } from "@/lib/terminal/goal-checker";

interface TerminalLine {
  type: "input" | "output" | "error";
  text: string;
}

export function TerminalQuiz({
  quiz,
  questionNumber,
  onNext,
  onResult,
}: {
  quiz: Quiz;
  questionNumber: number;
  onNext: () => void;
  onResult?: (correct: boolean) => void;
}) {
  const { saveResult, getResult, clearResult } = useQuizProgress();
  const previousResult = getResult(quiz.id);

  const [terminalState, setTerminalState] = useState<TerminalState>(() =>
    createTerminalState(quiz.terminalConfig!)
  );
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [goalResult, setGoalResult] = useState<GoalCheckResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const config = quiz.terminalConfig!;
  const difficultyInfo = DIFFICULTIES.find((d) => d.id === quiz.difficulty);
  const isAnswered = submitted || previousResult !== undefined;
  const isCorrect = submitted ? goalResult?.passed : previousResult?.correct;

  const prompt = `${terminalState.env["USER"] ?? "user"}@${terminalState.env["HOSTNAME"] ?? "host"}:${terminalState.cwd}$ `;

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  // Focus terminal input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = useCallback((command: string) => {
    if (!command.trim()) return;

    const newLines: TerminalLine[] = [
      ...lines,
      { type: "input", text: `${prompt}${command}` },
    ];

    if (command.trim() === "clear") {
      setLines([]);
      setInput("");
      return;
    }

    const result = executeCommand(terminalState, command);

    if (result.stdout) {
      // Handle clear escape
      if (result.stdout.includes("\x1B[clear]")) {
        setLines([]);
      } else {
        newLines.push({ type: "output", text: result.stdout.replace(/\n$/, "") });
      }
    }
    if (result.stderr) {
      newLines.push({ type: "error", text: result.stderr.replace(/\n$/, "") });
    }

    setLines(result.stdout?.includes("\x1B[clear]") ? [] : newLines);
    setTerminalState({ ...terminalState });
    setInput("");
    setHistoryIndex(-1);
  }, [lines, prompt, terminalState]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Prevent QuizSession arrow navigation
    e.stopPropagation();

    if (e.key === "Enter") {
      handleCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const history = terminalState.commandHistory;
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(terminalState.commandHistory[terminalState.commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  }

  function handleVerify() {
    const result = evaluateGoals(config.goalChecks, terminalState);
    setGoalResult(result);
    setSubmitted(true);
    saveResult(quiz.id, result.passed);
    onResult?.(result.passed);
  }

  function handleRetry() {
    clearResult(quiz.id);
    setTerminalState(createTerminalState(config));
    setLines([]);
    setInput("");
    setGoalResult(null);
    setSubmitted(false);
    setHistoryIndex(-1);
    setHintsRevealed(0);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-4" onKeyDown={(e) => e.stopPropagation()}>
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
          {difficultyInfo?.name ?? quiz.difficulty}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-400/20 text-purple-400">
          터미널
        </span>
      </div>

      {/* Mission description */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">미션</h3>
        <p className="text-gray-200 text-sm leading-relaxed">{quiz.question}</p>
      </div>

      {/* Hints */}
      {config.hints && config.hints.length > 0 && !isAnswered && (
        <div className="flex gap-2 flex-wrap">
          {config.hints.map((hint, i) => (
            <div key={i}>
              {i < hintsRevealed ? (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg inline-block">
                  {hint}
                </span>
              ) : (
                i === hintsRevealed && (
                  <button
                    onClick={() => setHintsRevealed(h => h + 1)}
                    className="text-xs text-yellow-500 hover:text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    힌트 {i + 1} 보기
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Terminal */}
      <div className="rounded-lg overflow-hidden border border-gray-700">
        {/* Title bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-gray-400 ml-2">
            {terminalState.env["USER"]}@{terminalState.env["HOSTNAME"]}
          </span>
        </div>

        {/* Terminal output area */}
        <div
          ref={terminalRef}
          className="bg-[#0d1117] p-4 font-mono text-sm max-h-80 overflow-y-auto"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all leading-relaxed">
              {line.type === "input" ? (
                <span>
                  <span className="text-green-400">{line.text.substring(0, line.text.indexOf("$") + 1)}</span>
                  <span className="text-gray-200">{line.text.substring(line.text.indexOf("$") + 1)}</span>
                </span>
              ) : line.type === "error" ? (
                <span className="text-red-400">{line.text}</span>
              ) : (
                <span className="text-gray-300">{line.text}</span>
              )}
            </div>
          ))}

          {/* Input line */}
          {!isAnswered && (
            <div className="flex items-center">
              <span className="text-green-400 whitespace-nowrap">{prompt}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-200 outline-none font-mono text-sm caret-gray-200 min-w-0"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Verify button */}
      {!isAnswered && (
        <button
          onClick={handleVerify}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors text-sm"
        >
          미션 완료 확인
        </button>
      )}

      {/* Result panel */}
      {isAnswered && goalResult && (
        <div
          className={`rounded-lg border p-4 ${
            isCorrect
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }`}
        >
          <h3
            className={`font-medium mb-3 ${
              isCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCorrect ? "미션 성공!" : "미션 실패"}
          </h3>

          <div className="space-y-2 mb-4">
            {goalResult.results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={r.passed ? "text-green-400" : "text-red-400"}>
                  {r.passed ? "\u2713" : "\u2717"}
                </span>
                <span className="text-gray-300">{r.check.description}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              {quiz.explanation}
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-sm"
            >
              다시 도전
            </button>
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
            >
              다음 문제
            </button>
          </div>
        </div>
      )}

      {/* Previous result display */}
      {previousResult && !submitted && (
        <div
          className={`rounded-lg border p-4 ${
            previousResult.correct
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }`}
        >
          <p className={`text-sm ${previousResult.correct ? "text-green-400" : "text-red-400"}`}>
            {previousResult.correct ? "이전에 정답을 맞힌 문제입니다." : "이전에 틀린 문제입니다."}
          </p>
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              {quiz.explanation}
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-sm"
            >
              다시 도전
            </button>
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
            >
              다음 문제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
