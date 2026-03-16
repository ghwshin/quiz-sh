import type { TerminalState } from "../terminal-state";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  sideEffects?: StateChange[];
}

export interface StateChange {
  type: "add-module" | "remove-module" | "add-process" | "remove-process"
    | "set-interface-state" | "set-interface-ip" | "write-file" | "create-dir"
    | "set-env" | "set-cwd" | "update-mounts";
  payload: Record<string, unknown>;
}

export type CommandFn = (
  args: string[],
  state: TerminalState,
  stdin: string
) => CommandResult;

const registry = new Map<string, CommandFn>();

export function registerCommand(name: string, fn: CommandFn): void {
  registry.set(name, fn);
}

export function getCommand(name: string): CommandFn | undefined {
  return registry.get(name);
}

export function hasCommand(name: string): boolean {
  return registry.has(name);
}

// Info commands registered directly
registerCommand("cd", (args, state) => {
  const target = args[0] ?? state.env["HOME"] ?? "/";
  const resolved = state.fs.resolvePath(target, state.cwd);
  if (!state.fs.exists(resolved)) {
    return { stdout: "", stderr: `cd: ${target}: No such file or directory\n`, exitCode: 1 };
  }
  const stat = state.fs.stat(resolved);
  if (stat?.type !== "dir") {
    return { stdout: "", stderr: `cd: ${target}: Not a directory\n`, exitCode: 1 };
  }
  return {
    stdout: "",
    stderr: "",
    exitCode: 0,
    sideEffects: [{ type: "set-cwd", payload: { cwd: resolved } }],
  };
});

registerCommand("pwd", (_args, state) => {
  return { stdout: state.cwd + "\n", stderr: "", exitCode: 0 };
});

registerCommand("uname", (args) => {
  const flags = args.filter(a => a.startsWith("-")).join("");
  if (flags.includes("a")) {
    return { stdout: "Linux embedded 5.15.0 #1 SMP aarch64 GNU/Linux\n", stderr: "", exitCode: 0 };
  }
  if (flags.includes("r")) {
    return { stdout: "5.15.0\n", stderr: "", exitCode: 0 };
  }
  return { stdout: "Linux\n", stderr: "", exitCode: 0 };
});

registerCommand("whoami", (_args, state) => {
  return { stdout: state.env["USER"] ?? "root" + "\n", stderr: "", exitCode: 0 };
});

registerCommand("id", (_args, state) => {
  const user = state.env["USER"] ?? "root";
  if (user === "root") {
    return { stdout: "uid=0(root) gid=0(root) groups=0(root)\n", stderr: "", exitCode: 0 };
  }
  return { stdout: `uid=1000(${user}) gid=1000(${user}) groups=1000(${user})\n`, stderr: "", exitCode: 0 };
});

registerCommand("date", () => {
  return { stdout: "Mon Mar 16 09:00:00 KST 2026\n", stderr: "", exitCode: 0 };
});

registerCommand("env", (_args, state) => {
  const lines = Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join("\n");
  return { stdout: lines + "\n", stderr: "", exitCode: 0 };
});

registerCommand("export", (args, state) => {
  const sideEffects: StateChange[] = [];
  for (const arg of args) {
    const eqIdx = arg.indexOf("=");
    if (eqIdx > 0) {
      const key = arg.substring(0, eqIdx);
      const value = arg.substring(eqIdx + 1);
      sideEffects.push({ type: "set-env", payload: { key, value } });
    }
  }
  if (args.length === 0) {
    // Show all exported vars
    const lines = Object.entries(state.env).map(([k, v]) => `declare -x ${k}="${v}"`).join("\n");
    return { stdout: lines + "\n", stderr: "", exitCode: 0, sideEffects };
  }
  return { stdout: "", stderr: "", exitCode: 0, sideEffects };
});

registerCommand("echo", (args, _state, _stdin) => {
  let newline = true;
  let enableEscape = false;
  const outputArgs: string[] = [];

  for (const arg of args) {
    if (arg === "-n") { newline = false; continue; }
    if (arg === "-e") { enableEscape = true; continue; }
    outputArgs.push(arg);
  }

  let output = outputArgs.join(" ");
  if (enableEscape) {
    output = output
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
  }
  if (newline) output += "\n";

  return { stdout: output, stderr: "", exitCode: 0 };
});

registerCommand("true", () => ({ stdout: "", stderr: "", exitCode: 0 }));
registerCommand("false", () => ({ stdout: "", stderr: "", exitCode: 1 }));

registerCommand("mount", (args, state) => {
  // mount -o remount,rw /system or mount -o remount,ro /system
  if (args.includes("-o") && args.some(a => a.startsWith("remount"))) {
    const optIdx = args.indexOf("-o");
    const opts = args[optIdx + 1] ?? "";
    const mountPoint = args[args.length - 1];
    const isRW = opts.includes("rw");
    const isRO = opts.includes("ro");

    if (mountPoint && (isRW || isRO)) {
      const mountsContent = state.fs.readFile("/proc/mounts") ?? "";
      const lines = mountsContent.split("\n").filter(Boolean);
      const newLines = lines.map(line => {
        if (line.includes(mountPoint)) {
          if (isRW) return line.replace(/\bro\b/, "rw");
          if (isRO) return line.replace(/\brw\b/, "ro");
        }
        return line;
      });
      return {
        stdout: "",
        stderr: "",
        exitCode: 0,
        sideEffects: [{ type: "write-file", payload: { path: "/proc/mounts", content: newLines.join("\n") + "\n" } }],
      };
    }
  }

  // mount with no args: show mounts
  const mounts = state.fs.readFile("/proc/mounts");
  if (mounts) {
    return { stdout: mounts, stderr: "", exitCode: 0 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("clear", () => ({ stdout: "\x1B[clear]", stderr: "", exitCode: 0 }));

registerCommand("help", () => ({
  stdout: "Available commands: ls, cat, echo, cp, mv, rm, mkdir, touch, chmod, grep, find, head, tail, wc, ln, cd, pwd, uname, whoami, id, date, env, export, insmod, rmmod, lsmod, dmesg, modprobe, modinfo, sysctl, ps, kill, ip, ss, ping, adb, fastboot, logcat, mount, clear\n",
  stderr: "",
  exitCode: 0,
}));
