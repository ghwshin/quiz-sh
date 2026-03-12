import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortAnswerQuiz } from "@/components/ShortAnswerQuiz";
import type { Quiz } from "@/types/quiz";

const mockQuiz: Quiz = {
  id: "test-sa-001",
  category: "linux-kernel",
  subcategory: "process-management",
  difficulty: "중급",
  type: "short-answer",
  question: "Explain the difference between fork() and exec().",
  keywords: ["fork", "exec", "프로세스"],
  sampleAnswer: "fork()는 프로세스를 복제하고 exec()는 새 프로그램으로 교체합니다.",
  explanation: "fork creates a child process, exec replaces the process image.",
};

describe("ShortAnswerQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders question", () => {
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText(mockQuiz.question)).toBeInTheDocument();
  });

  it("submit button is disabled when textarea is empty", () => {
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText("제출")).toBeDisabled();
  });

  it("shows correct feedback when all keywords are present", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("답변을 입력하세요...");
    await user.type(textarea, "fork와 exec는 프로세스 관리에 사용됩니다.");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("shows incorrect feedback when keywords are missing", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("답변을 입력하세요...");
    await user.type(textarea, "시스템 콜을 사용합니다");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
  });

  it("displays keyword checkmarks after submission", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("답변을 입력하세요...");
    await user.type(textarea, "fork만 사용합니다");
    await user.click(screen.getByText("제출"));

    // Should show keywords section
    expect(screen.getByText("필수 키워드")).toBeInTheDocument();
  });

  it("shows sample answer after submission", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("답변을 입력하세요...");
    await user.type(textarea, "fork exec 프로세스");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("모범 답안")).toBeInTheDocument();
    expect(screen.getByText(mockQuiz.sampleAnswer!)).toBeInTheDocument();
  });

  it("shows explanation after submission", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("답변을 입력하세요...");
    await user.type(textarea, "fork exec 프로세스");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText(mockQuiz.explanation)).toBeInTheDocument();
  });
});
