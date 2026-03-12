import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultipleChoiceQuiz } from "@/components/MultipleChoiceQuiz";
import type { Quiz } from "@/types/quiz";

const mockQuiz: Quiz = {
  id: "test-mc-001",
  category: "linux-kernel",
  subcategory: "process-management",
  difficulty: "초급",
  type: "multiple-choice",
  question: "What system call creates a new process?",
  options: ["fork()", "create()", "spawn()", "new_process()"],
  answer: 0,
  explanation: "fork() creates a new process by duplicating the calling process.",
};

describe("MultipleChoiceQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders question and all options", () => {
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText(mockQuiz.question)).toBeInTheDocument();
    for (const option of mockQuiz.options!) {
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  });

  it("renders question number and difficulty", () => {
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={3} onNext={() => {}} />
    );

    expect(screen.getByText("문제 3")).toBeInTheDocument();
    expect(screen.getByText("초급")).toBeInTheDocument();
  });

  it("submit button is disabled when no option selected", () => {
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    const submitBtn = screen.getByText("제출");
    expect(submitBtn).toBeDisabled();
  });

  it("shows correct feedback on correct answer", async () => {
    const user = userEvent.setup();
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.click(screen.getByText("fork()"));
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
    expect(screen.getByText(mockQuiz.explanation)).toBeInTheDocument();
  });

  it("shows incorrect feedback on wrong answer", async () => {
    const user = userEvent.setup();
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.click(screen.getByText("create()"));
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
  });

  it("calls onNext when 다음 문제 button is clicked", async () => {
    const user = userEvent.setup();
    let nextCalled = false;
    render(
      <MultipleChoiceQuiz
        quiz={mockQuiz}
        questionNumber={1}
        onNext={() => {
          nextCalled = true;
        }}
      />
    );

    await user.click(screen.getByText("fork()"));
    await user.click(screen.getByText("제출"));
    await user.click(screen.getByText("다음 문제"));

    expect(nextCalled).toBe(true);
  });

  it("disables options after submission", async () => {
    const user = userEvent.setup();
    render(
      <MultipleChoiceQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.click(screen.getByText("fork()"));
    await user.click(screen.getByText("제출"));

    const buttons = screen.getAllByRole("button");
    const optionButtons = buttons.filter((b) =>
      mockQuiz.options!.some((opt) => b.textContent?.includes(opt))
    );
    for (const btn of optionButtons) {
      expect(btn).toBeDisabled();
    }
  });
});
