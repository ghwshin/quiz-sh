import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizSession } from "@/components/QuizSession";
import type { Quiz } from "@/types/quiz";

const mockQuizzes: Quiz[] = [
  {
    id: "test-qs-001",
    category: "linux-kernel",
    subcategory: "process-management",
    difficulty: "초급",
    type: "multiple-choice",
    question: "First question?",
    options: ["A", "B", "C", "D"],
    answer: 0,
    explanation: "Explanation 1",
  },
  {
    id: "test-qs-002",
    category: "linux-kernel",
    subcategory: "process-management",
    difficulty: "초급",
    type: "multiple-choice",
    question: "Second question?",
    options: ["W", "X", "Y", "Z"],
    answer: 1,
    explanation: "Explanation 2",
  },
  {
    id: "test-qs-003",
    category: "linux-kernel",
    subcategory: "process-management",
    difficulty: "초급",
    type: "short-answer",
    question: "Third ___?",
    blankAnswers: [["answer"]],
    explanation: "Explanation 3",
  },
];

describe("QuizSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows empty state when no quizzes", () => {
    render(
      <QuizSession
        quizzes={[]}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    expect(screen.getByText("문제가 없습니다.")).toBeInTheDocument();
  });

  it("renders first question and progress counter", () => {
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    expect(screen.getByText("First question?")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("previous button is disabled on first question", () => {
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    expect(screen.getByText("이전")).toBeDisabled();
  });

  it("navigates to next question via 다음 button", async () => {
    const user = userEvent.setup();
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    // Click the outer "다음" navigation button (not "다음 문제" from quiz component)
    const navButtons = screen.getAllByText("다음");
    await user.click(navButtons[0]);

    expect(screen.getByText("Second question?")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("navigates back with 이전 button", async () => {
    const user = userEvent.setup();
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    // Go to second question
    await user.click(screen.getByText("다음"));
    expect(screen.getByText("Second question?")).toBeInTheDocument();

    // Go back
    await user.click(screen.getByText("이전"));
    expect(screen.getByText("First question?")).toBeInTheDocument();
  });

  it("다음 button is disabled on last question", async () => {
    const user = userEvent.setup();
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    // Navigate to last question
    await user.click(screen.getByText("다음"));
    await user.click(screen.getByText("다음"));

    // The outer navigation "다음" should be disabled
    const navButtons = screen.getAllByText("다음");
    // The last "다음" button in navigation area should be disabled
    const navNext = navButtons[navButtons.length - 1];
    expect(navNext).toBeDisabled();
  });

  it("shows back link with category name", () => {
    render(
      <QuizSession
        quizzes={mockQuizzes}
        category="linux-kernel"
        subcategory="process-management"
        difficulty="beginner"
        categoryName="Linux Kernel"
      />
    );

    expect(screen.getByText(/Linux Kernel/)).toBeInTheDocument();
  });
});
