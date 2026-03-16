import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationQuiz } from "@/components/ConversationQuiz";
import type { Quiz } from "@/types/quiz";

const mockObjectiveQuiz: Quiz = {
  id: "test-conv-obj-001",
  category: "linux-kernel",
  subcategory: "dev-conversation",
  difficulty: "중급",
  type: "conversation",
  conversationMode: "objective",
  conversation: [
    {
      speaker: "김과장",
      role: "고객",
      avatar: "😤",
      text: "서버가 갑자기 느려졌어요.",
    },
    {
      speaker: "이시니어",
      role: "시니어",
      avatar: "👩‍💻",
      text: "dmesg 로그를 확인해볼게요.",
    },
    {
      speaker: "이시니어",
      role: "시니어",
      avatar: "👩‍💻",
      code: "[3412.56] Out of memory: Killed process 1234 (java)",
      codeLanguage: "shell",
    },
  ],
  question: "고객의 '느려졌어요' 증상의 실제 기술적 원인은?",
  options: [
    "OOM Killer에 의한 프로세스 강제 종료",
    "디스크 I/O 병목",
    "CPU 과부하",
    "네트워크 타임아웃",
  ],
  answer: 0,
  explanation:
    "dmesg 로그에서 OOM Killer가 동작한 것을 확인할 수 있습니다.",
};

const mockFillBlankQuiz: Quiz = {
  id: "test-conv-fb-001",
  category: "linux-kernel",
  subcategory: "dev-conversation",
  difficulty: "고급",
  type: "conversation",
  conversationMode: "fill-blank",
  conversation: [
    {
      speaker: "박신입",
      role: "신입",
      avatar: "🧑‍💻",
      text: "커널 모듈 빌드하다가 에러 났어요.",
    },
    {
      speaker: "이시니어",
      role: "시니어",
      avatar: "👩‍💻",
      text: "소스에 ___ 매크로를 추가해야 해요. 보통 ___로 설정합니다.",
    },
  ],
  question: "대화의 빈칸을 채우시오.",
  blankAnswers: [["MODULE_LICENSE"], ["GPL"]],
  blankDistractors: [
    ["MODULE_AUTHOR", "MODULE_DESCRIPTION"],
    ["MIT", "Apache-2.0"],
  ],
  explanation:
    "커널 모듈은 MODULE_LICENSE() 매크로로 라이선스를 명시해야 합니다.",
};

describe("ConversationQuiz", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("objective mode", () => {
    it("renders conversation messages and question", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(
        screen.getByText("서버가 갑자기 느려졌어요.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("dmesg 로그를 확인해볼게요.")
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockObjectiveQuiz.question)
      ).toBeInTheDocument();
    });

    it("renders speaker names and role badges", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(screen.getByText("김과장")).toBeInTheDocument();
      expect(screen.getAllByText("이시니어").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("고객")).toBeInTheDocument();
    });

    it("renders code blocks in messages", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(
        screen.getByText(
          "[3412.56] Out of memory: Killed process 1234 (java)"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Shell")).toBeInTheDocument();
    });

    it("shows conversation type badge", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(screen.getByText("대화형")).toBeInTheDocument();
    });

    it("submit button disabled without selection", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(screen.getByText("제출")).toBeDisabled();
    });

    it("shows correct feedback on correct answer", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      await user.click(
        screen.getByText("OOM Killer에 의한 프로세스 강제 종료")
      );
      await user.click(screen.getByText("제출"));

      expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
      expect(
        screen.getByText(mockObjectiveQuiz.explanation)
      ).toBeInTheDocument();
    });

    it("shows incorrect feedback on wrong answer", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      await user.click(screen.getByText("디스크 I/O 병목"));
      await user.click(screen.getByText("제출"));

      expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
    });

    it("calls onResult with correct boolean", async () => {
      const user = userEvent.setup();
      let result: boolean | undefined;
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
          onResult={(r) => {
            result = r;
          }}
        />
      );

      await user.click(
        screen.getByText("OOM Killer에 의한 프로세스 강제 종료")
      );
      await user.click(screen.getByText("제출"));

      expect(result).toBe(true);
    });
  });

  describe("fill-blank mode (hard)", () => {
    it("renders conversation with blank inputs", () => {
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      expect(
        screen.getByText("커널 모듈 빌드하다가 에러 났어요.")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("빈칸 1")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("빈칸 2")).toBeInTheDocument();
    });

    it("submit disabled when blanks are empty", () => {
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      expect(screen.getByText("제출")).toBeDisabled();
    });

    it("shows correct feedback on correct fill-blank answers", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      await user.type(
        screen.getByPlaceholderText("빈칸 1"),
        "MODULE_LICENSE"
      );
      await user.type(screen.getByPlaceholderText("빈칸 2"), "GPL");
      await user.click(screen.getByText("제출"));

      expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
    });

    it("shows incorrect feedback on wrong fill-blank answers", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      await user.type(
        screen.getByPlaceholderText("빈칸 1"),
        "MODULE_AUTHOR"
      );
      await user.type(screen.getByPlaceholderText("빈칸 2"), "MIT");
      await user.click(screen.getByText("제출"));

      expect(screen.getByText("✗ 오답입니다.")).toBeInTheDocument();
    });
  });

  describe("fill-blank mode (normal/word bank)", () => {
    it("renders word bank chips", () => {
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="normal"
        />
      );

      expect(screen.getByTestId("word-bank")).toBeInTheDocument();
    });

    it("fills blank on chip select and submits correctly", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="normal"
        />
      );

      // Click correct chips
      await user.click(screen.getByText("MODULE_LICENSE"));
      await user.click(screen.getByText("GPL"));
      await user.click(screen.getByText("제출"));

      expect(screen.getByText("✓ 정답입니다!")).toBeInTheDocument();
    });
  });

  describe("retry", () => {
    it("resets state on retry for objective mode", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      await user.click(screen.getByText("디스크 I/O 병목"));
      await user.click(screen.getByText("제출"));
      await user.click(screen.getByText("다시 풀기"));

      expect(screen.getByText("제출")).toBeDisabled();
    });
  });
});
