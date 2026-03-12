import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeFillQuiz } from "@/components/CodeFillQuiz";
import type { Quiz } from "@/types/quiz";

const mockQuiz: Quiz = {
  id: "test-cf-001",
  category: "linux-kernel",
  subcategory: "process-management",
  difficulty: "고급",
  type: "code-fill",
  question: "Fill in the blanks to create a child process.",
  codeTemplate: "pid_t pid = ___();\nif (pid == ___) {",
  codeLanguage: "c",
  blankAnswers: [["fork"], ["0"]],
  explanation: "fork() returns 0 to the child process.",
};

describe("CodeFillQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders question and code template", () => {
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText(mockQuiz.question)).toBeInTheDocument();
  });

  it("renders input fields for each blank", () => {
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByPlaceholderText("빈칸 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("빈칸 2")).toBeInTheDocument();
  });

  it("shows language label", () => {
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("submit button is disabled when blanks are empty", () => {
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText("제출")).toBeDisabled();
  });

  it("shows correct feedback when all blanks are correct", async () => {
    const user = userEvent.setup();
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "fork");
    await user.type(screen.getByPlaceholderText("빈칸 2"), "0");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("shows incorrect feedback when a blank is wrong", async () => {
    const user = userEvent.setup();
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "exec");
    await user.type(screen.getByPlaceholderText("빈칸 2"), "0");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    const user = userEvent.setup();
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "FORK");
    await user.type(screen.getByPlaceholderText("빈칸 2"), "0");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("shows correct answers section after submission", async () => {
    const user = userEvent.setup();
    render(
      <CodeFillQuiz quiz={mockQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "fork");
    await user.type(screen.getByPlaceholderText("빈칸 2"), "0");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("정답")).toBeInTheDocument();
    expect(screen.getByText("빈칸 1:")).toBeInTheDocument();
    expect(screen.getByText("빈칸 2:")).toBeInTheDocument();
  });
});
