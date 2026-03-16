import type { GoalCheck } from "@/types/quiz";
import type { TerminalState } from "./terminal-state";

export interface GoalResult {
  check: GoalCheck;
  passed: boolean;
}

export interface GoalCheckResult {
  passed: boolean;
  results: GoalResult[];
}

export function evaluateGoals(
  goals: GoalCheck[],
  state: TerminalState
): GoalCheckResult {
  const results: GoalResult[] = goals.map(check => ({
    check,
    passed: evaluateSingleGoal(check, state),
  }));

  return {
    passed: results.every(r => r.passed),
    results,
  };
}

function evaluateSingleGoal(check: GoalCheck, state: TerminalState): boolean {
  switch (check.type) {
    case "file-exists":
      return check.path ? state.fs.exists(check.path) : false;

    case "file-not-exists":
      return check.path ? !state.fs.exists(check.path) : false;

    case "file-contains": {
      if (!check.path || !check.pattern) return false;
      const content = state.fs.readFile(check.path);
      if (content === null) return false;
      try {
        const regex = new RegExp(check.pattern, "m");
        return regex.test(content);
      } catch {
        return content.includes(check.pattern);
      }
    }

    case "file-permissions": {
      if (!check.path || !check.permissions) return false;
      const stat = state.fs.stat(check.path);
      if (!stat) return false;
      return stat.permissions === check.permissions;
    }

    case "module-loaded":
      return check.moduleName
        ? state.loadedModules.some(m => m.name === check.moduleName)
        : false;

    case "module-not-loaded":
      return check.moduleName
        ? !state.loadedModules.some(m => m.name === check.moduleName)
        : false;

    case "process-running":
      return check.processName
        ? state.processes.some(p => p.name === check.processName)
        : false;

    case "process-stopped":
      return check.processName
        ? !state.processes.some(p => p.name === check.processName)
        : false;

    case "env-equals":
      if (!check.envKey || check.envValue === undefined) return false;
      return state.env[check.envKey] === check.envValue;

    default:
      return false;
  }
}
