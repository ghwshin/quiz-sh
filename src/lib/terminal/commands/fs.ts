import { registerCommand } from "./index";

registerCommand("ls", (args, state) => {
  const flags = args.filter(a => a.startsWith("-")).join("");
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length === 0) paths.push(".");

  const showAll = flags.includes("a");
  const longFormat = flags.includes("l");
  const lines: string[] = [];

  for (const p of paths) {
    const absPath = state.fs.resolvePath(p, state.cwd);
    const stat = state.fs.stat(absPath);

    if (!stat) {
      return { stdout: "", stderr: `ls: cannot access '${p}': No such file or directory\n`, exitCode: 2 };
    }

    if (stat.type === "file") {
      if (longFormat) {
        lines.push(`-${formatPerms(stat.permissions)} 1 root root 0 Mar 16 09:00 ${p}`);
      } else {
        lines.push(p);
      }
      continue;
    }

    const entries = state.fs.readdir(absPath) ?? [];
    const filtered = showAll ? [".", "..", ...entries] : entries;

    if (paths.length > 1) {
      lines.push(`${p}:`);
    }

    for (const entry of filtered) {
      if (entry === "." || entry === "..") {
        if (longFormat) {
          lines.push(`d${formatPerms("755")} 2 root root 4096 Mar 16 09:00 ${entry}`);
        } else {
          lines.push(entry);
        }
        continue;
      }
      const childPath = absPath === "/" ? `/${entry}` : `${absPath}/${entry}`;
      const childStat = state.fs.stat(childPath);
      if (longFormat && childStat) {
        const prefix = childStat.type === "dir" ? "d" : childStat.type === "symlink" ? "l" : "-";
        lines.push(`${prefix}${formatPerms(childStat.permissions)} 1 root root ${childStat.type === "dir" ? "4096" : "0"} Mar 16 09:00 ${entry}`);
      } else {
        lines.push(entry);
      }
    }
  }

  return { stdout: lines.join("\n") + (lines.length > 0 ? "\n" : ""), stderr: "", exitCode: 0 };
});

function formatPerms(perms: string): string {
  const map: Record<string, string> = {
    "0": "---", "1": "--x", "2": "-w-", "3": "-wx",
    "4": "r--", "5": "r-x", "6": "rw-", "7": "rwx",
  };
  return perms.split("").map(d => map[d] ?? "---").join("");
}

registerCommand("cat", (args, state, stdin) => {
  if (args.length === 0) {
    // Read from stdin
    return { stdout: stdin, stderr: "", exitCode: 0 };
  }
  const outputs: string[] = [];
  for (const file of args) {
    if (file.startsWith("-")) continue;
    const absPath = state.fs.resolvePath(file, state.cwd);
    const content = state.fs.readFile(absPath);
    if (content === null) {
      return { stdout: outputs.join(""), stderr: `cat: ${file}: No such file or directory\n`, exitCode: 1 };
    }
    outputs.push(content);
  }
  return { stdout: outputs.join(""), stderr: "", exitCode: 0 };
});

registerCommand("touch", (args, state) => {
  const files = args.filter(a => !a.startsWith("-"));
  if (files.length === 0) {
    return { stdout: "", stderr: "touch: missing file operand\n", exitCode: 1 };
  }
  for (const file of files) {
    const absPath = state.fs.resolvePath(file, state.cwd);
    if (!state.fs.exists(absPath)) {
      state.fs.writeFile(absPath, "");
    }
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("mkdir", (args, state) => {
  const pFlag = args.includes("-p");
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length === 0) {
    return { stdout: "", stderr: "mkdir: missing operand\n", exitCode: 1 };
  }
  for (const p of paths) {
    const absPath = state.fs.resolvePath(p, state.cwd);
    if (pFlag) {
      state.fs.mkdirp(absPath);
    } else {
      if (!state.fs.mkdir(absPath)) {
        return { stdout: "", stderr: `mkdir: cannot create directory '${p}': File exists\n`, exitCode: 1 };
      }
    }
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("rm", (args, state) => {
  const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
  const force = args.includes("-f") || args.includes("-rf") || args.includes("-fr");
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length === 0) {
    return { stdout: "", stderr: "rm: missing operand\n", exitCode: 1 };
  }
  for (const p of paths) {
    const absPath = state.fs.resolvePath(p, state.cwd);
    if (!state.fs.exists(absPath)) {
      if (!force) {
        return { stdout: "", stderr: `rm: cannot remove '${p}': No such file or directory\n`, exitCode: 1 };
      }
      continue;
    }
    const stat = state.fs.stat(absPath);
    if (stat?.type === "dir" && !recursive) {
      return { stdout: "", stderr: `rm: cannot remove '${p}': Is a directory\n`, exitCode: 1 };
    }
    if (recursive) {
      state.fs.rmrf(absPath);
    } else {
      state.fs.rm(absPath);
    }
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("cp", (args, state) => {
  const flags = args.filter(a => a.startsWith("-"));
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "cp: missing operand\n", exitCode: 1 };
  }
  const src = state.fs.resolvePath(paths[0], state.cwd);
  const dst = state.fs.resolvePath(paths[1], state.cwd);
  const recursive = flags.includes("-r") || flags.includes("-R");

  const srcStat = state.fs.stat(src);
  if (!srcStat) {
    return { stdout: "", stderr: `cp: cannot stat '${paths[0]}': No such file or directory\n`, exitCode: 1 };
  }
  if (srcStat.type === "dir" && !recursive) {
    return { stdout: "", stderr: `cp: -r not specified; omitting directory '${paths[0]}'\n`, exitCode: 1 };
  }

  if (!state.fs.cp(src, dst)) {
    return { stdout: "", stderr: `cp: cannot copy '${paths[0]}' to '${paths[1]}'\n`, exitCode: 1 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("mv", (args, state) => {
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "mv: missing operand\n", exitCode: 1 };
  }
  const src = state.fs.resolvePath(paths[0], state.cwd);
  const dst = state.fs.resolvePath(paths[1], state.cwd);
  if (!state.fs.mv(src, dst)) {
    return { stdout: "", stderr: `mv: cannot move '${paths[0]}' to '${paths[1]}'\n`, exitCode: 1 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("chmod", (args, state) => {
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "chmod: missing operand\n", exitCode: 1 };
  }
  const mode = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const absPath = state.fs.resolvePath(paths[i], state.cwd);
    if (!state.fs.chmod(absPath, mode)) {
      return { stdout: "", stderr: `chmod: cannot access '${paths[i]}': No such file or directory\n`, exitCode: 1 };
    }
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("grep", (args, state, stdin) => {
  let ignoreCase = false;
  let countOnly = false;
  const nonFlags: string[] = [];

  for (const arg of args) {
    if (arg === "-i") { ignoreCase = true; continue; }
    if (arg === "-c") { countOnly = true; continue; }
    if (arg.startsWith("-") && !arg.startsWith("--")) continue;
    nonFlags.push(arg);
  }

  if (nonFlags.length === 0) {
    return { stdout: "", stderr: "grep: missing pattern\n", exitCode: 2 };
  }

  const pattern = nonFlags[0];
  const files = nonFlags.slice(1);
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, ignoreCase ? "i" : "");
  } catch {
    return { stdout: "", stderr: "grep: Invalid regular expression\n", exitCode: 2 };
  }
  const results: string[] = [];

  function matchLines(content: string, prefix: string) {
    const lines = content.split("\n");
    let count = 0;
    for (const line of lines) {
      if (regex.test(line)) {
        if (!countOnly) results.push(prefix ? `${prefix}:${line}` : line);
        count++;
      }
    }
    if (countOnly) results.push(prefix ? `${prefix}:${count}` : String(count));
  }

  if (files.length === 0) {
    matchLines(stdin, "");
  } else {
    for (const file of files) {
      const absPath = state.fs.resolvePath(file, state.cwd);
      const content = state.fs.readFile(absPath);
      if (content === null) {
        return { stdout: results.join("\n"), stderr: `grep: ${file}: No such file or directory\n`, exitCode: 2 };
      }
      matchLines(content, files.length > 1 ? file : "");
    }
  }

  const stdout = results.length > 0 ? results.join("\n") + "\n" : "";
  return { stdout, stderr: "", exitCode: results.length > 0 ? 0 : 1 };
});

registerCommand("find", (args, state) => {
  const paths = args.filter(a => !a.startsWith("-"));
  const searchPath = paths[0] ?? ".";
  const nameIdx = args.indexOf("-name");
  const namePattern = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
  const typeIdx = args.indexOf("-type");
  const typeFilter = typeIdx >= 0 ? args[typeIdx + 1] : undefined;

  const absStart = state.fs.resolvePath(searchPath, state.cwd);
  const results: string[] = [];

  function walk(dirPath: string) {
    const entries = state.fs.readdir(dirPath);
    if (!entries) return;
    for (const entry of entries) {
      const childPath = dirPath === "/" ? `/${entry}` : `${dirPath}/${entry}`;
      const childStat = state.fs.stat(childPath);
      if (!childStat) continue;

      let matches = true;
      if (namePattern) {
        const regex = new RegExp("^" + namePattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
        if (!regex.test(entry)) matches = false;
      }
      if (typeFilter) {
        if (typeFilter === "f" && childStat.type !== "file") matches = false;
        if (typeFilter === "d" && childStat.type !== "dir") matches = false;
      }
      if (matches) results.push(childPath);
      if (childStat.type === "dir") walk(childPath);
    }
  }

  // Include root path in results
  const startStat = state.fs.stat(absStart);
  if (!startStat) {
    return { stdout: "", stderr: `find: '${searchPath}': No such file or directory\n`, exitCode: 1 };
  }
  if (!typeFilter || (typeFilter === "d" && startStat.type === "dir") || (typeFilter === "f" && startStat.type === "file")) {
    if (!namePattern) results.push(absStart);
  }
  if (startStat.type === "dir") walk(absStart);

  return { stdout: results.join("\n") + (results.length > 0 ? "\n" : ""), stderr: "", exitCode: 0 };
});

registerCommand("head", (args, state, stdin) => {
  let n = 10;
  // Support compact form: -5 means -n 5
  const compactArg = args.find(a => /^-\d+$/.test(a));
  if (compactArg) n = parseInt(compactArg.slice(1), 10);
  const nIdx = args.indexOf("-n");
  if (nIdx >= 0 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10);
  const files = args.filter(a => !a.startsWith("-") && args.indexOf(a) !== nIdx + 1);

  let content: string;
  if (files.length === 0) {
    content = stdin;
  } else {
    const absPath = state.fs.resolvePath(files[0], state.cwd);
    const fc = state.fs.readFile(absPath);
    if (fc === null) {
      return { stdout: "", stderr: `head: cannot open '${files[0]}': No such file or directory\n`, exitCode: 1 };
    }
    content = fc;
  }

  const lines = content.split("\n");
  const result = lines.slice(0, n).join("\n");
  return { stdout: result + (result.endsWith("\n") ? "" : "\n"), stderr: "", exitCode: 0 };
});

registerCommand("tail", (args, state, stdin) => {
  let n = 10;
  // Support compact form: -5 means -n 5
  const compactArg = args.find(a => /^-\d+$/.test(a));
  if (compactArg) n = parseInt(compactArg.slice(1), 10);
  const nIdx = args.indexOf("-n");
  if (nIdx >= 0 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10);
  const files = args.filter(a => !a.startsWith("-") && args.indexOf(a) !== nIdx + 1);

  let content: string;
  if (files.length === 0) {
    content = stdin;
  } else {
    const absPath = state.fs.resolvePath(files[0], state.cwd);
    const fc = state.fs.readFile(absPath);
    if (fc === null) {
      return { stdout: "", stderr: `tail: cannot open '${files[0]}': No such file or directory\n`, exitCode: 1 };
    }
    content = fc;
  }

  const lines = content.split("\n");
  // Remove trailing empty line from split
  if (lines[lines.length - 1] === "") lines.pop();
  const result = lines.slice(-n).join("\n");
  return { stdout: result + "\n", stderr: "", exitCode: 0 };
});

registerCommand("wc", (args, state, stdin) => {
  const files = args.filter(a => !a.startsWith("-"));
  const flags = args.filter(a => a.startsWith("-")).join("");

  let content: string;
  if (files.length === 0) {
    content = stdin;
  } else {
    const absPath = state.fs.resolvePath(files[0], state.cwd);
    const fc = state.fs.readFile(absPath);
    if (fc === null) {
      return { stdout: "", stderr: `wc: ${files[0]}: No such file or directory\n`, exitCode: 1 };
    }
    content = fc;
  }

  const lineCount = content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  if (flags.includes("l")) {
    return { stdout: `${lineCount}\n`, stderr: "", exitCode: 0 };
  }
  if (flags.includes("w")) {
    return { stdout: `${wordCount}\n`, stderr: "", exitCode: 0 };
  }
  if (flags.includes("c")) {
    return { stdout: `${charCount}\n`, stderr: "", exitCode: 0 };
  }

  const name = files.length > 0 ? ` ${files[0]}` : "";
  return { stdout: `${lineCount} ${wordCount} ${charCount}${name}\n`, stderr: "", exitCode: 0 };
});

registerCommand("ln", (args, state) => {
  const isSymbolic = args.includes("-s");
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "ln: missing operand\n", exitCode: 1 };
  }
  if (!isSymbolic) {
    return { stdout: "", stderr: "ln: hard links not supported in this environment\n", exitCode: 1 };
  }
  const target = paths[0];
  const linkPath = state.fs.resolvePath(paths[1], state.cwd);
  state.fs.ln(target, linkPath);
  return { stdout: "", stderr: "", exitCode: 0 };
});
