import type { TerminalConfig, ProcessEntry, NetworkState } from "@/types/quiz";
import { VirtualFS } from "./virtual-fs";
import type { StateChange, CommandResult, CommandFn } from "./commands/index";
import { getCommand } from "./commands/index";
import { tokenize, parse, executeCommandList } from "./shell";

// Import command registrations
import "./commands/fs";
import "./commands/kernel";
import "./commands/process";
import "./commands/network";
import "./commands/android";

export interface ModuleEntry {
  name: string;
  size: number;
  usedBy?: number;
  path?: string;
}

export interface TerminalState {
  fs: VirtualFS;
  cwd: string;
  env: Record<string, string>;
  processes: ProcessEntry[];
  loadedModules: ModuleEntry[];
  network: NetworkState;
  commandHistory: string[];
  scriptedOutputs: Record<string, string>;
}

export function createTerminalState(config: TerminalConfig): TerminalState {
  const fs = new VirtualFS(config.filesystem);

  // Parse initial modules from /proc/modules if present
  const loadedModules: ModuleEntry[] = [];
  const procModules = fs.readFile("/proc/modules");
  if (procModules) {
    for (const line of procModules.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts[0]) {
        loadedModules.push({
          name: parts[0],
          size: parseInt(parts[1], 10) || 16384,
          usedBy: parseInt(parts[2], 10) || 0,
        });
      }
    }
  }

  return {
    fs,
    cwd: config.environment.cwd,
    env: {
      HOME: config.environment.cwd,
      USER: config.environment.user,
      HOSTNAME: config.environment.hostname,
      PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      SHELL: "/bin/bash",
      TERM: "xterm-256color",
      ...config.environment.env,
    },
    processes: config.processes ? [...config.processes] : [],
    loadedModules,
    network: config.network ? {
      interfaces: config.network.interfaces.map(i => ({ ...i })),
      routes: config.network.routes?.map(r => ({ ...r })),
    } : { interfaces: [] },
    commandHistory: [],
    scriptedOutputs: config.scriptedOutputs ?? {},
  };
}

function normalizeCommand(cmd: string): string {
  return cmd.replace(/\s+/g, " ").trim();
}

export function executeCommand(
  state: TerminalState,
  input: string
): { stdout: string; stderr: string; exitCode: number } {
  const trimmed = input.trim();
  if (!trimmed) return { stdout: "", stderr: "", exitCode: 0 };

  state.commandHistory.push(trimmed);

  // Check scriptedOutputs first
  const normalized = normalizeCommand(trimmed);
  if (normalized in state.scriptedOutputs) {
    return { stdout: state.scriptedOutputs[normalized] + "\n", stderr: "", exitCode: 0 };
  }

  // Tokenize, parse, execute
  const tokens = tokenize(trimmed, state.env);
  const cmdList = parse(tokens);

  const result = executeCommandList(cmdList, {
    execute: (args: string[], stdin: string) => {
      if (args.length === 0) return { stdout: "", stderr: "", exitCode: 0 };

      const cmdName = args[0];
      const cmdArgs = args.slice(1);

      // Check scriptedOutputs for the sub-command
      const fullCmd = normalizeCommand(args.join(" "));
      if (fullCmd in state.scriptedOutputs) {
        return { stdout: state.scriptedOutputs[fullCmd] + "\n", stderr: "", exitCode: 0 };
      }

      const cmdFn: CommandFn | undefined = getCommand(cmdName);
      if (!cmdFn) {
        return { stdout: "", stderr: `bash: ${cmdName}: command not found\n`, exitCode: 127 };
      }

      const cmdResult: CommandResult = cmdFn(cmdArgs, state, stdin);

      // Apply side effects
      if (cmdResult.sideEffects) {
        applySideEffects(state, cmdResult.sideEffects);
      }

      return { stdout: cmdResult.stdout, stderr: cmdResult.stderr, exitCode: cmdResult.exitCode };
    },
    fs: {
      writeFile: (path: string, content: string) => state.fs.writeFile(state.fs.resolvePath(path, state.cwd), content),
      appendFile: (path: string, content: string) => state.fs.appendFile(state.fs.resolvePath(path, state.cwd), content),
      readFile: (path: string) => state.fs.readFile(state.fs.resolvePath(path, state.cwd)),
      resolvePath: (path: string, cwd: string) => state.fs.resolvePath(path, cwd),
    },
    cwd: state.cwd,
  });

  return result;
}

function applySideEffects(state: TerminalState, effects: StateChange[]): void {
  for (const effect of effects) {
    switch (effect.type) {
      case "add-module": {
        const { name, size, path } = effect.payload as { name: string; size: number; path?: string };
        state.loadedModules.push({ name, size, usedBy: 0, path });
        // Update /proc/modules
        updateProcModules(state);
        break;
      }
      case "remove-module": {
        const { name } = effect.payload as { name: string };
        state.loadedModules = state.loadedModules.filter(m => m.name !== name);
        updateProcModules(state);
        break;
      }
      case "add-process": {
        const proc = effect.payload as unknown as ProcessEntry;
        state.processes.push(proc);
        break;
      }
      case "remove-process": {
        const { pid } = effect.payload as { pid: number };
        state.processes = state.processes.filter(p => p.pid !== pid);
        break;
      }
      case "set-interface-state": {
        const { name: ifName, state: ifState } = effect.payload as { name: string; state: "UP" | "DOWN" };
        const iface = state.network.interfaces.find(i => i.name === ifName);
        if (iface) iface.state = ifState;
        break;
      }
      case "set-interface-ip": {
        const { name: ifName, ip } = effect.payload as { name: string; ip: string };
        const iface = state.network.interfaces.find(i => i.name === ifName);
        if (iface) iface.ip = ip;
        break;
      }
      case "write-file": {
        const { path, content, isDir, permissions } = effect.payload as {
          path: string; content: string; isDir?: boolean; permissions?: string;
        };
        if (isDir) {
          state.fs.mkdirp(path);
        } else {
          state.fs.writeFile(path, content);
          if (permissions) {
            state.fs.chmod(path, permissions);
          }
        }
        break;
      }
      case "create-dir": {
        const { path } = effect.payload as { path: string };
        state.fs.mkdirp(path);
        break;
      }
      case "set-env": {
        const { key, value } = effect.payload as { key: string; value: string };
        state.env[key] = value;
        break;
      }
      case "set-cwd": {
        const { cwd } = effect.payload as { cwd: string };
        state.cwd = cwd;
        break;
      }
      case "update-mounts": {
        const { content } = effect.payload as { content: string };
        state.fs.writeFile("/proc/mounts", content);
        break;
      }
    }
  }
}

function updateProcModules(state: TerminalState): void {
  const content = state.loadedModules.map(m =>
    `${m.name} ${m.size} ${m.usedBy ?? 0} - Live 0xffffffffa0000000`
  ).join("\n") + (state.loadedModules.length > 0 ? "\n" : "");
  state.fs.writeFile("/proc/modules", content);
}
