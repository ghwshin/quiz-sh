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
  scenarioType: "bug-report",
  conversation: [
    {
      speaker: "환영",
      role: "QA",
      avatar: "🔍",
      text: "프로덕션 서버에서 Java 프로세스가 갑자기 종료되었습니다.",
    },
    {
      speaker: "박신입",
      role: "신입",
      avatar: "🧑‍💻",
      text: "dmesg에 이런 로그가 있어요.",
      code: "[3412.56] Out of memory: Killed process 1234 (java)",
      codeLanguage: "shell",
    },
    {
      speaker: "최팀장",
      role: "팀장",
      avatar: "🧑‍💼",
      text: "Java 버그 아니야? JVM 힙 설정 확인해봐.",
    },
  ],
  seniorHint: [
    {
      speaker: "이시니어",
      role: "시니어",
      avatar: "👩‍💻",
      text: "dmesg 로그의 'Out of memory' 키워드에 주목해보세요. 커널 레벨의 메모리 관리 메커니즘을 확인해보면 됩니다.",
    },
  ],
  question: "dmesg 로그에서 확인된 현상의 원인은 무엇인가?",
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
  scenarioType: "code-review",
  conversation: [
    {
      speaker: "민수",
      role: "리뷰어",
      avatar: "👀",
      text: "커널 모듈 코드인데 라이선스 선언이 빠져있네요.",
    },
    {
      speaker: "지훈",
      role: "동료",
      avatar: "💬",
      text: "소스에 ___ 매크로를 추가해야 해요. 보통 ___로 설정하죠.",
    },
  ],
  seniorHint: [
    {
      speaker: "이시니어",
      role: "시니어",
      avatar: "👩‍💻",
      text: "커널 모듈의 라이선스 관련 매크로를 확인해보세요.",
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
        screen.getByText("프로덕션 서버에서 Java 프로세스가 갑자기 종료되었습니다.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Java 버그 아니야? JVM 힙 설정 확인해봐.")
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

      expect(screen.getByText("환영")).toBeInTheDocument();
      expect(screen.getByText("QA")).toBeInTheDocument();
      expect(screen.getByText("최팀장")).toBeInTheDocument();
      expect(screen.getByText("팀장")).toBeInTheDocument();
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

    it("shows scenario type badge", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(screen.getByText("버그 리포트")).toBeInTheDocument();
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

  describe("senior hint", () => {
    it("renders hint toggle button when seniorHint exists", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(
        screen.getByText("💡 시니어에게 도움 받기")
      ).toBeInTheDocument();
    });

    it("hint is collapsed by default", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      expect(
        screen.queryByText(mockObjectiveQuiz.seniorHint![0].text!)
      ).not.toBeInTheDocument();
    });

    it("expands hint on click", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      await user.click(screen.getByText("💡 시니어에게 도움 받기"));

      expect(
        screen.getByText(mockObjectiveQuiz.seniorHint![0].text!)
      ).toBeInTheDocument();
      expect(screen.getByText("시니어")).toBeInTheDocument();
    });

    it("collapses hint on second click", async () => {
      const user = userEvent.setup();
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      await user.click(screen.getByText("💡 시니어에게 도움 받기"));
      await user.click(screen.getByText("💡 시니어에게 도움 받기"));

      expect(
        screen.queryByText(mockObjectiveQuiz.seniorHint![0].text!)
      ).not.toBeInTheDocument();
    });
  });

  describe("new role colors", () => {
    it("renders QA role badge with correct color", () => {
      render(
        <ConversationQuiz
          quiz={mockObjectiveQuiz}
          questionNumber={1}
          onNext={() => {}}
        />
      );

      const qaBadge = screen.getByText("QA");
      expect(qaBadge.className).toContain("text-amber-400");
    });

    it("renders 리뷰어 role badge with correct color", () => {
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      const reviewerBadge = screen.getByText("리뷰어");
      expect(reviewerBadge.className).toContain("text-cyan-400");
    });

    it("renders 동료 role badge with correct color", () => {
      render(
        <ConversationQuiz
          quiz={mockFillBlankQuiz}
          questionNumber={1}
          onNext={() => {}}
          mode="hard"
        />
      );

      const peerBadge = screen.getByText("동료");
      expect(peerBadge.className).toContain("text-teal-400");
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
        screen.getByText("커널 모듈 코드인데 라이선스 선언이 빠져있네요.")
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
