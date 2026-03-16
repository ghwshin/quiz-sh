import { describe, it, expect } from "vitest";
import { evaluateGoals } from "../goal-checker";
import { createTerminalState, executeCommand } from "../terminal-state";
import type { TerminalConfig, GoalCheck } from "@/types/quiz";

function makeState(overrides?: Partial<TerminalConfig>) {
  return createTerminalState({
    environment: { hostname: "test", user: "root", cwd: "/root" },
    filesystem: {
      "/root": { type: "dir" },
      "/tmp": { type: "dir" },
      "/proc": { type: "dir" },
      "/proc/modules": { type: "file", content: "" },
      "/lib/modules": { type: "dir" },
      "/lib/modules/test.ko": { type: "file", content: "(binary)" },
    },
    goalChecks: [],
    ...overrides,
  });
}

describe("evaluateGoals", () => {
  it("file-exists passes when file exists", () => {
    const state = makeState();
    state.fs.writeFile("/tmp/test.txt", "content");
    const checks: GoalCheck[] = [
      { description: "test file exists", type: "file-exists", path: "/tmp/test.txt" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
    expect(result.results[0].passed).toBe(true);
  });

  it("file-exists fails when file missing", () => {
    const state = makeState();
    const checks: GoalCheck[] = [
      { description: "file exists", type: "file-exists", path: "/tmp/missing.txt" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(false);
  });

  it("file-not-exists passes when file missing", () => {
    const state = makeState();
    const checks: GoalCheck[] = [
      { description: "file not exists", type: "file-not-exists", path: "/tmp/missing" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("file-contains matches regex pattern", () => {
    const state = makeState();
    state.fs.writeFile("/tmp/config", "key=value\nfoo=bar\n");
    const checks: GoalCheck[] = [
      { description: "config has key", type: "file-contains", path: "/tmp/config", pattern: "key\\s*=\\s*value" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("file-contains fails on non-matching pattern", () => {
    const state = makeState();
    state.fs.writeFile("/tmp/config", "key=value\n");
    const checks: GoalCheck[] = [
      { description: "has missing", type: "file-contains", path: "/tmp/config", pattern: "missing" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(false);
  });

  it("file-permissions checks permission string", () => {
    const state = makeState();
    state.fs.writeFile("/tmp/script.sh", "#!/bin/sh");
    state.fs.chmod("/tmp/script.sh", "755");
    const checks: GoalCheck[] = [
      { description: "executable", type: "file-permissions", path: "/tmp/script.sh", permissions: "755" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("module-loaded passes after insmod", () => {
    const state = makeState();
    executeCommand(state, "insmod /lib/modules/test.ko");
    const checks: GoalCheck[] = [
      { description: "test loaded", type: "module-loaded", moduleName: "test" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("module-not-loaded passes when module not loaded", () => {
    const state = makeState();
    const checks: GoalCheck[] = [
      { description: "test not loaded", type: "module-not-loaded", moduleName: "test" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("module-not-loaded passes after rmmod", () => {
    const state = makeState({
      filesystem: {
        "/root": { type: "dir" },
        "/tmp": { type: "dir" },
        "/proc": { type: "dir" },
        "/proc/modules": { type: "file", content: "test 16384 0 - Live 0x0\n" },
        "/lib/modules": { type: "dir" },
        "/lib/modules/test.ko": { type: "file", content: "(binary)" },
      },
    });
    expect(state.loadedModules.some(m => m.name === "test")).toBe(true);
    executeCommand(state, "rmmod test");
    const checks: GoalCheck[] = [
      { description: "test removed", type: "module-not-loaded", moduleName: "test" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("env-equals checks environment variable", () => {
    const state = makeState();
    executeCommand(state, "export MY_VAR=hello");
    const checks: GoalCheck[] = [
      { description: "env set", type: "env-equals", envKey: "MY_VAR", envValue: "hello" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(true);
  });

  it("multiple checks: all must pass", () => {
    const state = makeState();
    state.fs.writeFile("/tmp/a.txt", "content");
    const checks: GoalCheck[] = [
      { description: "file exists", type: "file-exists", path: "/tmp/a.txt" },
      { description: "file missing", type: "file-exists", path: "/tmp/missing.txt" },
    ];
    const result = evaluateGoals(checks, state);
    expect(result.passed).toBe(false);
    expect(result.results[0].passed).toBe(true);
    expect(result.results[1].passed).toBe(false);
  });
});
