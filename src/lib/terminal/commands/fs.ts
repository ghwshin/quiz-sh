import { registerCommand } from "./index";

registerCommand("ls", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: ls [OPTION]... [FILE]...\nList directory contents.\n\nOptions: -a (all, including hidden), -l (long format)\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: cat [FILE]...\nConcatenate FILE(s) and print to standard output.\nWith no FILE, read standard input.\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: touch [OPTION]... FILE...\nUpdate the access and modification times of FILE(s).\nCreate FILE if it does not exist.\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: mkdir [OPTION]... DIRECTORY...\nCreate DIRECTORY(ies) if they do not already exist.\n\nOptions: -p, --parents (create parent directories as needed)\n", stderr: "", exitCode: 0 };
  }
  const pFlag = args.includes("-p") || args.includes("--parents");
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: rm [OPTION]... FILE...\nRemove (unlink) FILE(s).\n\nOptions: -r, --recursive (recursive), -f, --force (force, ignore missing)\n", stderr: "", exitCode: 0 };
  }
  // Expand combined short flags like -rf, -fr into individual flags for matching
  const expandedArgs = args.flatMap(a => {
    if (/^-[a-zA-Z]{2,}$/.test(a)) {
      return a.slice(1).split("").map(c => `-${c}`);
    }
    return [a];
  });
  const recursive = expandedArgs.includes("-r") || expandedArgs.includes("--recursive");
  const force = expandedArgs.includes("-f") || expandedArgs.includes("--force");
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: cp [OPTION]... SOURCE DEST\nCopy SOURCE to DEST.\n\nOptions: -r, -R, --recursive (copy directories recursively)\n", stderr: "", exitCode: 0 };
  }
  const flags = args.filter(a => a.startsWith("-"));
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "cp: missing operand\n", exitCode: 1 };
  }
  const src = state.fs.resolvePath(paths[0], state.cwd);
  const dst = state.fs.resolvePath(paths[1], state.cwd);
  const recursive = flags.includes("-r") || flags.includes("-R") || flags.includes("--recursive");

  const srcStat = state.fs.stat(src);
  if (!srcStat) {
    return { stdout: "", stderr: `cp: cannot stat '${paths[0]}': No such file or directory\n`, exitCode: 1 };
  }
  if (srcStat.type === "dir" && !recursive) {
    return { stdout: "", stderr: `cp: -r not specified; omitting directory '${paths[0]}'\n`, exitCode: 1 };
  }

  if (srcStat.type === "dir") {
    // Recursive directory copy
    function copyDir(srcPath: string, dstPath: string): boolean {
      state.fs.mkdirp(dstPath);
      const entries = state.fs.readdir(srcPath);
      if (!entries) return true;
      for (const entry of entries) {
        const childSrc = srcPath === "/" ? `/${entry}` : `${srcPath}/${entry}`;
        const childDst = dstPath === "/" ? `/${entry}` : `${dstPath}/${entry}`;
        const childStat = state.fs.stat(childSrc);
        if (!childStat) continue;
        if (childStat.type === "dir") {
          copyDir(childSrc, childDst);
        } else {
          state.fs.cp(childSrc, childDst);
        }
      }
      return true;
    }
    copyDir(src, dst);
    return { stdout: "", stderr: "", exitCode: 0 };
  }

  if (!state.fs.cp(src, dst)) {
    return { stdout: "", stderr: `cp: cannot copy '${paths[0]}' to '${paths[1]}'\n`, exitCode: 1 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("mv", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: mv [OPTION]... SOURCE DEST\nMove (rename) SOURCE to DEST.\n", stderr: "", exitCode: 0 };
  }
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

function resolveSymbolicMode(mode: string, currentPerms: string): string {
  // Map symbolic mode to octal. Handles +x, +r, +w, u+x, a+x, etc.
  // Current permissions as 3-digit octal string
  let octal = parseInt(currentPerms || "644", 8);

  // Match patterns like: +x, -x, +r, -w, u+x, g+x, o+x, a+x, u+rx, etc.
  const symRe = /^([ugoa]*)([+\-=])([rwx]+)$/;
  const match = mode.match(symRe);
  if (!match) return mode; // not symbolic, return as-is

  const who = match[1] || "a"; // default to all if no who specified
  const op = match[2];
  const perms = match[3];

  // Build bit masks
  let mask = 0;
  if (perms.includes("r")) mask |= 0o444;
  if (perms.includes("w")) mask |= 0o222;
  if (perms.includes("x")) mask |= 0o111;

  // Restrict to relevant who bits
  let whoMask = 0;
  if (who.includes("u") || who.includes("a") || who === "") whoMask |= 0o700;
  if (who.includes("g") || who.includes("a") || who === "") whoMask |= 0o070;
  if (who.includes("o") || who.includes("a") || who === "") whoMask |= 0o007;

  const effectiveMask = mask & whoMask;

  if (op === "+") octal |= effectiveMask;
  else if (op === "-") octal &= ~effectiveMask;
  else if (op === "=") octal = (octal & ~whoMask) | effectiveMask;

  return (octal >>> 0).toString(8).padStart(3, "0");
}

registerCommand("chmod", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: chmod [OPTION]... MODE FILE...\nChange the file mode bits of FILE(s).\n\nMODE: octal (755) or symbolic (u+x, a-w, +x)\n", stderr: "", exitCode: 0 };
  }
  const paths = args.filter(a => !a.startsWith("-"));
  if (paths.length < 2) {
    return { stdout: "", stderr: "chmod: missing operand\n", exitCode: 1 };
  }
  const modeArg = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const absPath = state.fs.resolvePath(paths[i], state.cwd);
    // Determine final mode: if not pure octal, try symbolic resolution
    let mode = modeArg;
    if (!/^\d+$/.test(mode)) {
      const stat = state.fs.stat(absPath);
      const currentPerms = stat?.permissions ?? "644";
      mode = resolveSymbolicMode(mode, currentPerms);
    }
    if (!state.fs.chmod(absPath, mode)) {
      return { stdout: "", stderr: `chmod: cannot access '${paths[i]}': No such file or directory\n`, exitCode: 1 };
    }
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});

registerCommand("grep", (args, state, stdin) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: grep [OPTION]... PATTERN [FILE]...\nSearch for PATTERN in each FILE (or stdin).\n\nOptions: -i (ignore case), -c (count matches only), -v (invert match), -n (show line numbers)\n", stderr: "", exitCode: 0 };
  }
  let ignoreCase = false;
  let countOnly = false;
  let invertMatch = false;
  let lineNumbers = false;
  const nonFlags: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("-") && !arg.startsWith("--") && arg !== "-") {
      // Expand combined short flags like -in, -iv, -ic, etc.
      const flags = arg.slice(1);
      if (/^[icvn]+$/.test(flags)) {
        if (flags.includes("i")) ignoreCase = true;
        if (flags.includes("c")) countOnly = true;
        if (flags.includes("v")) invertMatch = true;
        if (flags.includes("n")) lineNumbers = true;
        continue;
      }
      // Unknown flag, skip
      continue;
    }
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
    // Remove trailing empty line from split
    if (lines[lines.length - 1] === "") lines.pop();
    let count = 0;
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const matched = regex.test(line);
      const include = invertMatch ? !matched : matched;
      if (include) {
        if (!countOnly) {
          let entry = line;
          if (lineNumbers) entry = `${idx + 1}:${entry}`;
          if (prefix) entry = `${prefix}:${entry}`;
          results.push(entry);
        }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: find [PATH] [OPTION]...\nSearch for files in a directory hierarchy.\n\nOptions: -name PATTERN, -type f|d\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: head [OPTION]... [FILE]...\nPrint the first 10 lines of FILE(s) to standard output.\n\nOptions: -n NUM (print first NUM lines)\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: tail [OPTION]... [FILE]...\nPrint the last 10 lines of FILE(s) to standard output.\n\nOptions: -n NUM (print last NUM lines)\n", stderr: "", exitCode: 0 };
  }
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
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: wc [OPTION]... [FILE]...\nPrint line, word, and byte counts for FILE(s).\n\nOptions: -l (lines), -w (words), -c (bytes)\n", stderr: "", exitCode: 0 };
  }
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

registerCommand("tee", (args, state, stdin) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: tee [OPTION]... [FILE]...\nRead from standard input and write to standard output and FILES.\n\nOptions: -a (append rather than overwrite)\n", stderr: "", exitCode: 0 };
  }
  const appendFlag = args.includes("-a");
  const files = args.filter(a => !a.startsWith("-"));
  for (const file of files) {
    const absPath = state.fs.resolvePath(file, state.cwd);
    if (appendFlag) {
      state.fs.appendFile(absPath, stdin);
    } else {
      state.fs.writeFile(absPath, stdin);
    }
  }
  return { stdout: stdin, stderr: "", exitCode: 0 };
});

registerCommand("sort", (_args, _state, stdin) => {
  if (_args.includes("--help") || _args.includes("-h")) {
    return { stdout: "Usage: sort [OPTION]... [FILE]...\nSort lines of text.\n\nOptions: -n (numeric sort), -r (reverse)\n", stderr: "", exitCode: 0 };
  }
  const flags = _args.filter(a => a.startsWith("-")).join("");
  const files = _args.filter(a => !a.startsWith("-"));

  let content: string;
  if (files.length === 0) {
    content = stdin;
  } else {
    const absPath = _state.fs.resolvePath(files[0], _state.cwd);
    const fc = _state.fs.readFile(absPath);
    if (fc === null) {
      return { stdout: "", stderr: `sort: cannot read: ${files[0]}: No such file or directory\n`, exitCode: 1 };
    }
    content = fc;
  }

  const lines = content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();

  const numeric = flags.includes("n");
  const reverse = flags.includes("r");

  lines.sort((a, b) => {
    if (numeric) {
      const na = parseFloat(a) || 0;
      const nb = parseFloat(b) || 0;
      return na - nb;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  });

  if (reverse) lines.reverse();

  return { stdout: lines.join("\n") + (lines.length > 0 ? "\n" : ""), stderr: "", exitCode: 0 };
});

registerCommand("uniq", (_args, _state, stdin) => {
  if (_args.includes("--help") || _args.includes("-h")) {
    return { stdout: "Usage: uniq [OPTION]... [INPUT [OUTPUT]]\nFilter adjacent matching lines from INPUT.\n\nOptions: -c (count occurrences), -d (only print duplicate lines)\n", stderr: "", exitCode: 0 };
  }
  const flags = _args.filter(a => a.startsWith("-")).join("");
  const files = _args.filter(a => !a.startsWith("-"));

  let content: string;
  if (files.length === 0) {
    content = stdin;
  } else {
    const absPath = _state.fs.resolvePath(files[0], _state.cwd);
    const fc = _state.fs.readFile(absPath);
    if (fc === null) {
      return { stdout: "", stderr: `uniq: ${files[0]}: No such file or directory\n`, exitCode: 1 };
    }
    content = fc;
  }

  const lines = content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();

  const countMode = flags.includes("c");
  const dupOnly = flags.includes("d");

  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let count = 1;
    while (i + count < lines.length && lines[i + count] === lines[i]) count++;
    const isDup = count > 1;
    if (!dupOnly || isDup) {
      result.push(countMode ? `${String(count).padStart(7)} ${lines[i]}` : lines[i]);
    }
    i += count;
  }

  return { stdout: result.join("\n") + (result.length > 0 ? "\n" : ""), stderr: "", exitCode: 0 };
});

registerCommand("ln", (args, state) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: ln [OPTION]... TARGET LINK_NAME\nCreate a link to TARGET with the name LINK_NAME.\n\nOptions: -s (create a symbolic link)\n", stderr: "", exitCode: 0 };
  }
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
