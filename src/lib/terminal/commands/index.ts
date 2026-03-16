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
  if (args[0] === "--help" || args[0] === "-h") {
    return { stdout: "Usage: cd [DIR]\nChange the current directory to DIR.\nDefaults to HOME if DIR is omitted.\n", stderr: "", exitCode: 0 };
  }
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

registerCommand("pwd", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: pwd\nPrint the name of the current working directory.\n", stderr: "", exitCode: 0 };
  }
  return { stdout: state.cwd + "\n", stderr: "", exitCode: 0 };
});

registerCommand("uname", (args) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: uname [OPTION]...\nPrint system information.\n\nOptions: -a (all), -r (kernel release), -s (kernel name)\n", stderr: "", exitCode: 0 };
  }
  const flags = args.filter(a => a.startsWith("-")).join("");
  if (flags.includes("a")) {
    return { stdout: "Linux embedded 5.15.0 #1 SMP aarch64 GNU/Linux\n", stderr: "", exitCode: 0 };
  }
  if (flags.includes("r")) {
    return { stdout: "5.15.0\n", stderr: "", exitCode: 0 };
  }
  return { stdout: "Linux\n", stderr: "", exitCode: 0 };
});

registerCommand("whoami", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: whoami\nPrint the effective username of the current user.\n", stderr: "", exitCode: 0 };
  }
  return { stdout: (state.env["USER"] ?? "root") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("id", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: id [USER]\nPrint user and group information for USER (default: current user).\n", stderr: "", exitCode: 0 };
  }
  const user = state.env["USER"] ?? "root";
  if (user === "root") {
    return { stdout: "uid=0(root) gid=0(root) groups=0(root)\n", stderr: "", exitCode: 0 };
  }
  return { stdout: `uid=1000(${user}) gid=1000(${user}) groups=1000(${user})\n`, stderr: "", exitCode: 0 };
});

registerCommand("date", (args) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: date [OPTION]... [+FORMAT]\nPrint or set the system date and time.\n\nOptions: -u (UTC), +FORMAT (strftime format string)\n", stderr: "", exitCode: 0 };
  }
  return { stdout: "Mon Mar 16 09:00:00 KST 2026\n", stderr: "", exitCode: 0 };
});

registerCommand("env", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: env [NAME=VALUE]... [COMMAND]\nPrint environment variables, or run COMMAND with a modified environment.\n", stderr: "", exitCode: 0 };
  }
  const lines = Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join("\n");
  return { stdout: lines + "\n", stderr: "", exitCode: 0 };
});

registerCommand("export", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: export [NAME[=VALUE]]...\nSet environment variables and mark them for export to child processes.\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help")) {
    return { stdout: "Usage: echo [OPTION]... [STRING]...\nWrite STRING(s) to standard output.\n\nOptions: -n (no trailing newline), -e (enable backslash escapes)\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: mount [-o OPTIONS] [DEVICE] DIR\nMount a filesystem or show current mounts.\n\nOptions: -o remount,rw (remount read-write), -o remount,ro (remount read-only)\n", stderr: "", exitCode: 0 };
  }
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
      let changed = false;
      const newLines = lines.map(line => {
        if (line.includes(mountPoint)) {
          const newLine = isRW ? line.replace(/\bro\b/, "rw") : line.replace(/\brw\b/, "ro");
          if (newLine !== line) changed = true;
          return newLine;
        }
        return line;
      });
      if (!changed) {
        return { stdout: "", stderr: `mount: ${mountPoint}: not mounted or mount point not found\n`, exitCode: 1 };
      }
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
  stdout: [
    "Available commands (use --help for details):",
    "",
    "  File system:  ls, cat, touch, mkdir, rm, cp, mv, chmod, grep, find, head, tail, wc, ln",
    "  Text tools:   sort, uniq, tee",
    "  Navigation:   cd, pwd",
    "  System info:  uname, whoami, id, date, env, export, mount",
    "  Kernel:       insmod, rmmod, lsmod, dmesg, modprobe, modinfo, sysctl",
    "  Processes:    ps, kill",
    "  Network:      ip, ss, ping",
    "  Android:      adb, fastboot, logcat, getenforce, chcon",
    "  Shell:        echo, clear, help, true, false",
    "",
  ].join("\n"),
  stderr: "",
  exitCode: 0,
}));
