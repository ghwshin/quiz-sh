import { registerCommand } from "./index";

registerCommand("ps", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: ps [OPTION]...\nReport a snapshot of current processes.\n\nOptions: aux (all processes, BSD style), -ef (all processes, UNIX style)\n", stderr: "", exitCode: 0 };
  }
  // Combine all flag characters from short flags for flexible matching
  const allFlags = args.join("");
  const showAll = allFlags.includes("a") || allFlags.includes("e") || args.includes("aux") || args.includes("-ef");

  const header = showAll
    ? "USER       PID %CPU %MEM COMMAND\n"
    : "  PID TTY          TIME CMD\n";

  const lines: string[] = [header.trimEnd()];

  // Always show init
  if (showAll) {
    lines.push("root         1  0.0  0.1 /sbin/init");
  }

  for (const proc of state.processes) {
    if (showAll) {
      lines.push(`${proc.user.padEnd(10)} ${String(proc.pid).padStart(5)} ${(proc.cpu ?? "0.0").padStart(4)} ${(proc.mem ?? "0.1").padStart(4)} ${proc.command}`);
    } else {
      lines.push(`${String(proc.pid).padStart(5)} pts/0    00:00:00 ${proc.name}`);
    }
  }

  return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("kill", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: kill [-SIGNAL] PID...\nSend a signal to a process.\n\nOptions: -9 or -KILL (force kill), -15 or -TERM (terminate, default)\n", stderr: "", exitCode: 0 };
  }
  let signal = "TERM";
  const pids: number[] = [];

  for (const arg of args) {
    if (arg.startsWith("-")) {
      signal = arg.substring(1);
    } else {
      const pid = parseInt(arg, 10);
      if (!isNaN(pid)) pids.push(pid);
    }
  }

  if (pids.length === 0) {
    return { stdout: "", stderr: "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]\n", exitCode: 2 };
  }

  const sideEffects = [];
  for (const pid of pids) {
    const proc = state.processes.find(p => p.pid === pid);
    if (!proc) {
      return { stdout: "", stderr: `kill: (${pid}) - No such process\n`, exitCode: 1 };
    }
    // Normalize signal: strip leading SIG, treat 9/KILL and 15/TERM as kill signals
    const normalizedSignal = signal.replace(/^SIG/, "");
    if (normalizedSignal === "9" || normalizedSignal === "KILL" || normalizedSignal === "TERM" || normalizedSignal === "15") {
      sideEffects.push({ type: "remove-process" as const, payload: { pid } });
    }
  }

  return { stdout: "", stderr: "", exitCode: 0, sideEffects };
});
