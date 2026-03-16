export interface Token {
  type: "word" | "pipe" | "and" | "or" | "semi" | "redirect-out" | "redirect-append" | "redirect-in" | "redirect-err";
  value: string;
}

export interface Redirect {
  type: ">" | ">>" | "<" | "2>";
  target: string;
}

export interface SimpleCommand {
  args: string[];
  redirects: Redirect[];
}

export interface Pipeline {
  commands: SimpleCommand[];
}

export interface CommandList {
  pipelines: Pipeline[];
  operators: ("&&" | "||" | ";")[];
}

/**
 * Tokenize a shell command string into tokens.
 * Handles single quotes, double quotes (with $VAR expansion), and operators.
 */
export function tokenize(input: string, env: Record<string, string> = {}): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  function expandVars(s: string): string {
    return s.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => env[name] ?? "");
  }

  while (i < input.length) {
    // Skip whitespace
    if (input[i] === " " || input[i] === "\t") {
      i++;
      continue;
    }

    // Operators
    if (input[i] === "|" && input[i + 1] === "|") {
      tokens.push({ type: "or", value: "||" });
      i += 2;
      continue;
    }
    if (input[i] === "|") {
      tokens.push({ type: "pipe", value: "|" });
      i++;
      continue;
    }
    if (input[i] === "&" && input[i + 1] === "&") {
      tokens.push({ type: "and", value: "&&" });
      i += 2;
      continue;
    }
    if (input[i] === ";") {
      tokens.push({ type: "semi", value: ";" });
      i++;
      continue;
    }
    if (input[i] === ">" && input[i + 1] === ">") {
      tokens.push({ type: "redirect-append", value: ">>" });
      i += 2;
      continue;
    }
    if (input[i] === ">") {
      tokens.push({ type: "redirect-out", value: ">" });
      i++;
      continue;
    }
    if (input[i] === "<") {
      tokens.push({ type: "redirect-in", value: "<" });
      i++;
      continue;
    }
    if (input[i] === "2" && input[i + 1] === ">") {
      tokens.push({ type: "redirect-err", value: "2>" });
      i += 2;
      continue;
    }

    // Word (possibly with quotes)
    let word = "";
    while (i < input.length && input[i] !== " " && input[i] !== "\t") {
      if (input[i] === "'" ) {
        // Single quote: literal until closing quote
        i++;
        while (i < input.length && input[i] !== "'") {
          word += input[i];
          i++;
        }
        if (i < input.length) i++; // skip closing '
      } else if (input[i] === '"') {
        // Double quote: expand variables
        i++;
        let segment = "";
        while (i < input.length && input[i] !== '"') {
          if (input[i] === "\\" && i + 1 < input.length) {
            segment += input[i + 1];
            i += 2;
          } else {
            segment += input[i];
            i++;
          }
        }
        if (i < input.length) i++; // skip closing "
        word += expandVars(segment);
      } else if (input[i] === "\\" && i + 1 < input.length) {
        word += input[i + 1];
        i += 2;
      } else if ("|&;><".includes(input[i])) {
        // Check for 2> special case
        if (input[i] === "2" && input[i + 1] === ">") break;
        break;
      } else {
        if (input[i] === "$") {
          // Variable expansion in unquoted context
          let varName = "";
          i++;
          while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
            varName += input[i];
            i++;
          }
          word += env[varName] ?? "";
          continue;
        }
        word += input[i];
        i++;
      }
    }
    if (word.length > 0) {
      tokens.push({ type: "word", value: word });
    }
  }

  return tokens;
}

/**
 * Parse tokens into a CommandList (pipelines connected by &&, ||, ;)
 */
export function parse(tokens: Token[]): CommandList {
  const result: CommandList = { pipelines: [], operators: [] };
  let currentPipeline: Pipeline = { commands: [] };
  let currentCommand: SimpleCommand = { args: [], redirects: [] };

  function finishCommand() {
    if (currentCommand.args.length > 0 || currentCommand.redirects.length > 0) {
      currentPipeline.commands.push(currentCommand);
    }
    currentCommand = { args: [], redirects: [] };
  }

  function finishPipeline() {
    finishCommand();
    if (currentPipeline.commands.length > 0) {
      result.pipelines.push(currentPipeline);
    }
    currentPipeline = { commands: [] };
  }

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "word") {
      currentCommand.args.push(token.value);
      i++;
    } else if (token.type === "redirect-out" || token.type === "redirect-append" || token.type === "redirect-in" || token.type === "redirect-err") {
      const redirectType = token.value as Redirect["type"];
      i++;
      const target = tokens[i]?.type === "word" ? tokens[i].value : "";
      if (target) i++;
      currentCommand.redirects.push({ type: redirectType, target });
    } else if (token.type === "pipe") {
      finishCommand();
      i++;
    } else if (token.type === "and") {
      finishPipeline();
      result.operators.push("&&");
      i++;
    } else if (token.type === "or") {
      finishPipeline();
      result.operators.push("||");
      i++;
    } else if (token.type === "semi") {
      finishPipeline();
      result.operators.push(";");
      i++;
    } else {
      i++;
    }
  }

  finishPipeline();
  return result;
}

export interface ExecutionContext {
  execute: (args: string[], stdin: string) => { stdout: string; stderr: string; exitCode: number };
  fs: {
    writeFile: (path: string, content: string) => boolean;
    appendFile: (path: string, content: string) => boolean;
    readFile: (path: string) => string | null;
    resolvePath: (path: string, cwd: string) => string;
  };
  cwd: string;
}

/**
 * Execute a parsed CommandList.
 */
export function executeCommandList(
  cmdList: CommandList,
  ctx: ExecutionContext
): { stdout: string; stderr: string; exitCode: number } {
  let finalStdout = "";
  let finalStderr = "";
  let lastExitCode = 0;

  for (let i = 0; i < cmdList.pipelines.length; i++) {
    // Check operators
    if (i > 0) {
      const op = cmdList.operators[i - 1];
      if (op === "&&" && lastExitCode !== 0) continue;
      if (op === "||" && lastExitCode === 0) continue;
      // ";" always continues
    }

    const pipeline = cmdList.pipelines[i];
    const result = executePipeline(pipeline, ctx);
    finalStdout += result.stdout;
    finalStderr += result.stderr;
    lastExitCode = result.exitCode;
  }

  return { stdout: finalStdout, stderr: finalStderr, exitCode: lastExitCode };
}

function executePipeline(
  pipeline: Pipeline,
  ctx: ExecutionContext
): { stdout: string; stderr: string; exitCode: number } {
  let stdin = "";
  let lastStderr = "";
  let lastExitCode = 0;

  for (let i = 0; i < pipeline.commands.length; i++) {
    const cmd = pipeline.commands[i];

    // Handle input redirect
    let cmdStdin = stdin;
    for (const redir of cmd.redirects) {
      if (redir.type === "<") {
        // Skip redirects with empty targets
        if (!redir.target) continue;
        const absPath = ctx.fs.resolvePath(redir.target, ctx.cwd);
        const content = ctx.fs.readFile(absPath);
        if (content === null) {
          return { stdout: "", stderr: `bash: ${redir.target}: No such file or directory\n`, exitCode: 1 };
        }
        cmdStdin = content;
      }
    }

    // Skip output redirects with empty targets
    const validRedirects = cmd.redirects.filter(r => r.target || r.type === "<");
    const result = ctx.execute(cmd.args, cmdStdin);
    lastExitCode = result.exitCode;
    lastStderr += result.stderr;

    // Handle output redirects (skip those with empty targets)
    let stdout = result.stdout;
    let redirected = false;
    for (const redir of validRedirects) {
      if (!redir.target) continue;
      const absPath = ctx.fs.resolvePath(redir.target, ctx.cwd);
      if (redir.type === ">") {
        ctx.fs.writeFile(absPath, stdout);
        redirected = true;
      } else if (redir.type === ">>") {
        ctx.fs.appendFile(absPath, stdout);
        redirected = true;
      } else if (redir.type === "2>") {
        ctx.fs.writeFile(absPath, result.stderr);
        lastStderr = "";
      }
    }

    // If last command in pipeline and no output redirect, pass stdout through
    if (i < pipeline.commands.length - 1) {
      // Pipe stdout to next command's stdin
      stdin = stdout;
    } else {
      // Final command
      if (redirected) {
        stdin = "";
      } else {
        stdin = stdout;
      }
    }
  }

  return {
    stdout: pipeline.commands.length > 0 && !pipeline.commands[pipeline.commands.length - 1].redirects.some(r => (r.type === ">" || r.type === ">>") && r.target) ? stdin : "",
    stderr: lastStderr,
    exitCode: lastExitCode,
  };
}
