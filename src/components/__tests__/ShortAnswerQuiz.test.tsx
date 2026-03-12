import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortAnswerQuiz } from "@/components/ShortAnswerQuiz";
import type { Quiz } from "@/types/quiz";

const blankQuiz: Quiz = {
  id: "test-sa-blank-001",
  category: "linux-kernel",
  subcategory: "memory-management",
  difficulty: "초급",
  type: "short-answer",
  question:
    "가상 주소를 물리 주소로 변환할 때, 최근 사용된 페이지 테이블 항목을 캐싱하는 하드웨어 장치를 ___라고 한다.",
  blankAnswers: [["TLB", "Translation Lookaside Buffer"]],
  explanation: "TLB는 MMU 내부에 위치한 고속 연관 캐시입니다.",
};

const multiBlankQuiz: Quiz = {
  id: "test-sa-blank-002",
  category: "linux-kernel",
  subcategory: "memory-management",
  difficulty: "중급",
  type: "short-answer",
  question:
    "___는 힙/스택 등의 페이지이고, ___는 파일에서 매핑된 페이지이다.",
  blankAnswers: [
    ["anonymous page", "익명 페이지"],
    ["file-backed page"],
  ],
  explanation: "Anonymous page와 file-backed page는 swap-out 방식이 다릅니다.",
};

describe("ShortAnswerQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders question with input blanks", () => {
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(
      screen.getByText(/가상 주소를 물리 주소로 변환할 때/)
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("빈칸 1")).toBeInTheDocument();
  });

  it("submit button is disabled when blanks are empty", () => {
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    expect(screen.getByText("제출")).toBeDisabled();
  });

  it("shows correct feedback when answer matches", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "TLB");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("accepts alternative answers", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(
      screen.getByPlaceholderText("빈칸 1"),
      "Translation Lookaside Buffer"
    );
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("shows incorrect feedback when answer is wrong", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "MMU");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
  });

  it("shows answer and explanation sections after submission", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "TLB");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("정답")).toBeInTheDocument();
    expect(screen.getByText("해설")).toBeInTheDocument();
  });

  it("handles multiple blanks", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz
        quiz={multiBlankQuiz}
        questionNumber={1}
        onNext={() => {}}
      />
    );

    expect(screen.getByPlaceholderText("빈칸 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("빈칸 2")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("빈칸 1"), "anonymous page");
    await user.type(
      screen.getByPlaceholderText("빈칸 2"),
      "file-backed page"
    );
    await user.click(screen.getByText("제출"));

    expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
  });

  it("shows explanation text after submission", async () => {
    const user = userEvent.setup();
    render(
      <ShortAnswerQuiz quiz={blankQuiz} questionNumber={1} onNext={() => {}} />
    );

    await user.type(screen.getByPlaceholderText("빈칸 1"), "TLB");
    await user.click(screen.getByText("제출"));

    expect(screen.getByText(blankQuiz.explanation)).toBeInTheDocument();
  });
});
