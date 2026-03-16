import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TerminalQuiz } from "../TerminalQuiz";
import type { Quiz } from "@/types/quiz";

const terminalQuiz: Quiz = {
  id: "lk-tl-001",
  category: "linux-kernel",
  subcategory: "terminal-lab",
  difficulty: "초급",
  type: "terminal",
  question: "GPIO LED 모듈을 로드하세요.",
  explanation: "insmod로 모듈을 로드합니다.",
  terminalConfig: {
    environment: { hostname: "rpi-dev", user: "root", cwd: "/root" },
    filesystem: {
      "/root": { type: "dir" },
      "/lib/modules": { type: "dir" },
      "/lib/modules/gpio_led.ko": { type: "file", content: "(binary)", permissions: "644" },
      "/proc": { type: "dir" },
      "/proc/modules": { type: "file", content: "" },
      "/sys": { type: "dir" },
      "/sys/class": { type: "dir" },
      "/sys/class/leds": { type: "dir" },
    },
    goalChecks: [
      { description: "gpio_led 모듈이 로드됨", type: "module-loaded", moduleName: "gpio_led" },
      { description: "LED 디바이스 생성됨", type: "file-exists", path: "/sys/class/leds/gpio_led0" },
    ],
    hints: ["insmod 명령어로 커널 모듈을 로드할 수 있습니다"],
    scriptedOutputs: { "uname -r": "5.15.0-rpi" },
  },
};

describe("TerminalQuiz", () => {
  const onNext = () => {};
  const onResult = () => {};

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders mission description", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    expect(screen.getByText("GPIO LED 모듈을 로드하세요.")).toBeDefined();
  });

  it("renders terminal prompt", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    const prompts = screen.getAllByText(/root@rpi-dev/);
    expect(prompts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders difficulty badge", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    expect(screen.getByText("초급")).toBeDefined();
  });

  it("renders terminal badge", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    expect(screen.getByText("터미널")).toBeDefined();
  });

  it("renders verify button", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    expect(screen.getByText("미션 완료 확인")).toBeDefined();
  });

  it("renders hint button", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    expect(screen.getByText("힌트 1 보기")).toBeDefined();
  });

  it("reveals hint on click", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    fireEvent.click(screen.getByText("힌트 1 보기"));
    expect(screen.getByText("insmod 명령어로 커널 모듈을 로드할 수 있습니다")).toBeDefined();
  });

  it("accepts command input", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "ls /lib/modules" } });
    expect(input).toHaveValue("ls /lib/modules");
  });

  it("executes command on Enter", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "echo hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("hello")).toBeDefined();
  });

  it("shows failure when verifying without completing mission", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    fireEvent.click(screen.getByText("미션 완료 확인"));
    expect(screen.getByText("미션 실패")).toBeDefined();
  });

  it("shows success after completing all goals", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    const input = screen.getByRole("textbox");

    // Execute the correct command
    fireEvent.change(input, { target: { value: "insmod /lib/modules/gpio_led.ko" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify mission
    fireEvent.click(screen.getByText("미션 완료 확인"));
    expect(screen.getByText("미션 성공!")).toBeDefined();
  });

  it("shows per-goal check results", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    fireEvent.click(screen.getByText("미션 완료 확인"));
    expect(screen.getByText("gpio_led 모듈이 로드됨")).toBeDefined();
    expect(screen.getByText("LED 디바이스 생성됨")).toBeDefined();
  });

  it("shows explanation after verification", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    fireEvent.click(screen.getByText("미션 완료 확인"));
    expect(screen.getByText(/insmod로 모듈을 로드합니다/)).toBeDefined();
  });

  it("shows retry and next buttons after verification", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    fireEvent.click(screen.getByText("미션 완료 확인"));
    expect(screen.getByText("다시 도전")).toBeDefined();
    expect(screen.getByText("다음 문제")).toBeDefined();
  });

  it("retry resets state", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);

    // Execute a command
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "echo test" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify and retry
    fireEvent.click(screen.getByText("미션 완료 확인"));
    fireEvent.click(screen.getByText("다시 도전"));

    // Should be back to initial state - verify button visible
    expect(screen.getByText("미션 완료 확인")).toBeDefined();
  });

  it("uses scriptedOutputs for matching commands", () => {
    render(<TerminalQuiz quiz={terminalQuiz} questionNumber={1} onNext={onNext} onResult={onResult} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "uname -r" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("5.15.0-rpi")).toBeDefined();
  });
});
