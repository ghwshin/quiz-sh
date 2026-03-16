import { describe, it, expect } from "vitest";
import { tokenize, parse, executeCommandList, type CommandList } from "../shell";

describe("tokenize", () => {
  it("splits simple command", () => {
    const tokens = tokenize("ls -la /proc");
    expect(tokens).toEqual([
      { type: "word", value: "ls" },
      { type: "word", value: "-la" },
      { type: "word", value: "/proc" },
    ]);
  });

  it("handles pipe operator", () => {
    const tokens = tokenize("cat file | grep pattern");
    expect(tokens.map(t => t.type)).toEqual(["word", "word", "pipe", "word", "word"]);
  });

  it("handles && and || operators", () => {
    const tokens = tokenize("cmd1 && cmd2 || cmd3");
    expect(tokens.map(t => t.type)).toEqual(["word", "and", "word", "or", "word"]);
  });

  it("handles semicolons", () => {
    const tokens = tokenize("cmd1; cmd2");
    expect(tokens.map(t => t.type)).toEqual(["word", "semi", "word"]);
  });

  it("handles redirects", () => {
    const tokens = tokenize("echo hello > file.txt");
    expect(tokens).toEqual([
      { type: "word", value: "echo" },
      { type: "word", value: "hello" },
      { type: "redirect-out", value: ">" },
      { type: "word", value: "file.txt" },
    ]);
  });

  it("handles append redirect", () => {
    const tokens = tokenize("echo line >> file.txt");
    expect(tokens[2]).toEqual({ type: "redirect-append", value: ">>" });
  });

  it("handles single quotes (literal)", () => {
    const tokens = tokenize("echo 'hello world'");
    expect(tokens[1].value).toBe("hello world");
  });

  it("handles double quotes with variable expansion", () => {
    const tokens = tokenize('echo "value is $VAR"', { VAR: "test" });
    expect(tokens[1].value).toBe("value is test");
  });

  it("expands variables in unquoted context", () => {
    const tokens = tokenize("echo $HOME", { HOME: "/root" });
    expect(tokens[1].value).toBe("/root");
  });

  it("handles empty input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("parse", () => {
  it("parses simple command", () => {
    const tokens = tokenize("ls -la");
    const result = parse(tokens);
    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0].commands).toHaveLength(1);
    expect(result.pipelines[0].commands[0].args).toEqual(["ls", "-la"]);
  });

  it("parses pipeline", () => {
    const tokens = tokenize("cat file | grep pattern | wc -l");
    const result = parse(tokens);
    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0].commands).toHaveLength(3);
  });

  it("parses command list with && operator", () => {
    const tokens = tokenize("cmd1 && cmd2");
    const result = parse(tokens);
    expect(result.pipelines).toHaveLength(2);
    expect(result.operators).toEqual(["&&"]);
  });

  it("parses redirects", () => {
    const tokens = tokenize("echo hello > out.txt");
    const result = parse(tokens);
    const cmd = result.pipelines[0].commands[0];
    expect(cmd.args).toEqual(["echo", "hello"]);
    expect(cmd.redirects).toEqual([{ type: ">", target: "out.txt" }]);
  });
});

describe("executeCommandList", () => {
  function makeCtx(results: Record<string, { stdout: string; stderr: string; exitCode: number }>) {
    const files: Record<string, string> = {};
    return {
      ctx: {
        execute: (args: string[], _stdin: string) => {
          const cmd = args[0];
          return results[cmd] ?? { stdout: "", stderr: `not found: ${cmd}\n`, exitCode: 127 };
        },
        fs: {
          writeFile: (path: string, content: string) => { files[path] = content; return true; },
          appendFile: (path: string, content: string) => { files[path] = (files[path] ?? "") + content; return true; },
          readFile: (path: string) => files[path] ?? null,
          resolvePath: (path: string, _cwd: string) => path,
        },
        cwd: "/",
      },
      files,
    };
  }

  it("executes simple command", () => {
    const { ctx } = makeCtx({ echo: { stdout: "hello\n", stderr: "", exitCode: 0 } });
    const cmdList: CommandList = {
      pipelines: [{ commands: [{ args: ["echo", "hello"], redirects: [] }] }],
      operators: [],
    };
    const result = executeCommandList(cmdList, ctx);
    expect(result.stdout).toBe("hello\n");
    expect(result.exitCode).toBe(0);
  });

  it("skips second command on && if first fails", () => {
    const { ctx } = makeCtx({
      cmd1: { stdout: "", stderr: "fail", exitCode: 1 },
      cmd2: { stdout: "ok\n", stderr: "", exitCode: 0 },
    });
    const tokens = tokenize("cmd1 && cmd2");
    const cmdList = parse(tokens);
    const result = executeCommandList(cmdList, ctx);
    expect(result.stdout).toBe("");
    expect(result.exitCode).toBe(1);
  });

  it("runs second command on || if first fails", () => {
    const { ctx } = makeCtx({
      cmd1: { stdout: "", stderr: "fail", exitCode: 1 },
      cmd2: { stdout: "fallback\n", stderr: "", exitCode: 0 },
    });
    const tokens = tokenize("cmd1 || cmd2");
    const cmdList = parse(tokens);
    const result = executeCommandList(cmdList, ctx);
    expect(result.stdout).toBe("fallback\n");
  });

  it("always runs commands connected by ;", () => {
    const { ctx } = makeCtx({
      cmd1: { stdout: "a\n", stderr: "", exitCode: 1 },
      cmd2: { stdout: "b\n", stderr: "", exitCode: 0 },
    });
    const tokens = tokenize("cmd1; cmd2");
    const cmdList = parse(tokens);
    const result = executeCommandList(cmdList, ctx);
    expect(result.stdout).toContain("b\n");
  });
});
