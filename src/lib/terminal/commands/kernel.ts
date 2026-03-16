import { registerCommand, type StateChange } from "./index";

registerCommand("insmod", (args, state) => {
  const modulePath = args[0];
  if (!modulePath) {
    return { stdout: "", stderr: "insmod: missing module path\n", exitCode: 1 };
  }

  const absPath = state.fs.resolvePath(modulePath, state.cwd);
  if (!state.fs.exists(absPath)) {
    return { stdout: "", stderr: `insmod: ERROR: could not load module ${modulePath}: No such file or directory\n`, exitCode: 1 };
  }

  // Extract module name from path (e.g., /lib/modules/gpio_led.ko -> gpio_led)
  const fileName = absPath.split("/").pop() ?? "";
  const moduleName = fileName.replace(/\.ko$/, "");

  // Check if already loaded
  if (state.loadedModules.some(m => m.name === moduleName)) {
    return { stdout: "", stderr: `insmod: ERROR: could not insert module ${modulePath}: File exists\n`, exitCode: 1 };
  }

  const sideEffects: StateChange[] = [
    { type: "add-module", payload: { name: moduleName, size: 16384, path: absPath } },
  ];

  // Auto-create common side effects for known module patterns
  if (moduleName.includes("gpio") || moduleName.includes("led")) {
    sideEffects.push({
      type: "write-file",
      payload: { path: `/sys/class/leds/${moduleName}0`, content: "", isDir: true },
    });
  }
  if (moduleName.includes("i2c") || moduleName.includes("sensor")) {
    sideEffects.push(
      { type: "write-file", payload: { path: `/dev/${moduleName}0`, content: "", permissions: "600" } },
      { type: "write-file", payload: { path: `/sys/bus/i2c/devices/${moduleName}`, content: "", isDir: true } },
    );
  }
  if (moduleName.includes("spi")) {
    sideEffects.push(
      { type: "write-file", payload: { path: `/dev/${moduleName}0`, content: "" } },
    );
  }

  return { stdout: "", stderr: "", exitCode: 0, sideEffects };
});

registerCommand("rmmod", (args, state) => {
  const moduleName = args[0];
  if (!moduleName) {
    return { stdout: "", stderr: "rmmod: missing module name\n", exitCode: 1 };
  }

  const mod = state.loadedModules.find(m => m.name === moduleName);
  if (!mod) {
    return { stdout: "", stderr: `rmmod: ERROR: Module ${moduleName} is not currently loaded\n`, exitCode: 1 };
  }

  return {
    stdout: "",
    stderr: "",
    exitCode: 0,
    sideEffects: [{ type: "remove-module", payload: { name: moduleName } }],
  };
});

registerCommand("lsmod", (_args, state) => {
  if (state.loadedModules.length === 0) {
    return { stdout: "Module                  Size  Used by\n", stderr: "", exitCode: 0 };
  }

  const header = "Module                  Size  Used by\n";
  const lines = state.loadedModules.map(m => {
    const name = m.name.padEnd(24);
    const size = String(m.size).padEnd(6);
    return `${name}${size}${m.usedBy ?? 0}`;
  });

  return { stdout: header + lines.join("\n") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("dmesg", (args, state) => {
  // For quiz purposes, dmesg output comes from scriptedOutputs or module log
  const lines: string[] = [];

  for (const mod of state.loadedModules) {
    lines.push(`[    0.000] ${mod.name}: module loaded`);
  }

  if (lines.length === 0) {
    lines.push("[    0.000] Linux version 5.15.0 (root@build) (gcc 11.2.0)");
    lines.push("[    0.001] Command line: console=ttyS0,115200");
    lines.push("[    0.010] Memory: 1024MB available");
  }

  return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("modprobe", (args, state) => {
  const moduleName = args.filter(a => !a.startsWith("-"))[0];
  if (!moduleName) {
    return { stdout: "", stderr: "modprobe: missing module name\n", exitCode: 1 };
  }

  // Check if already loaded
  if (state.loadedModules.some(m => m.name === moduleName)) {
    return { stdout: "", stderr: "", exitCode: 0 };
  }

  // Try to find the module in /lib/modules
  const possiblePaths = [
    `/lib/modules/${moduleName}.ko`,
    `/lib/modules/${state.env["KERNEL_VERSION"] ?? "5.15.0"}/${moduleName}.ko`,
  ];

  for (const p of possiblePaths) {
    if (state.fs.exists(p)) {
      return {
        stdout: "",
        stderr: "",
        exitCode: 0,
        sideEffects: [{ type: "add-module", payload: { name: moduleName, size: 16384, path: p } }],
      };
    }
  }

  return { stdout: "", stderr: `modprobe: FATAL: Module ${moduleName} not found.\n`, exitCode: 1 };
});

registerCommand("modinfo", (args, state) => {
  const moduleName = args[0];
  if (!moduleName) {
    return { stdout: "", stderr: "modinfo: missing module name\n", exitCode: 1 };
  }

  // Check if module file exists
  const possiblePath = `/lib/modules/${moduleName}.ko`;
  if (!state.fs.exists(possiblePath)) {
    return { stdout: "", stderr: `modinfo: ERROR: Module ${moduleName} not found.\n`, exitCode: 1 };
  }

  const info = [
    `filename:       ${possiblePath}`,
    `license:        GPL`,
    `description:    ${moduleName} driver`,
    `author:         quiz.sh`,
    `vermagic:       5.15.0 SMP mod_unload aarch64`,
  ];

  return { stdout: info.join("\n") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("sysctl", (args, state) => {
  if (args.length === 0 || args[0] === "-a") {
    // Show all
    const results: string[] = [];
    // Read from /proc/sys
    function walkSysctl(dirPath: string, prefix: string) {
      const entries = state.fs.readdir(dirPath);
      if (!entries) return;
      for (const entry of entries) {
        const childPath = `${dirPath}/${entry}`;
        const childStat = state.fs.stat(childPath);
        if (!childStat) continue;
        const key = prefix ? `${prefix}.${entry}` : entry;
        if (childStat.type === "file") {
          const value = state.fs.readFile(childPath) ?? "";
          results.push(`${key} = ${value.trim()}`);
        } else if (childStat.type === "dir") {
          walkSysctl(childPath, key);
        }
      }
    }
    walkSysctl("/proc/sys", "");
    return { stdout: results.join("\n") + "\n", stderr: "", exitCode: 0 };
  }

  // sysctl -p: load from /etc/sysctl.conf
  if (args[0] === "-p") {
    const confPath = args[1] ?? "/etc/sysctl.conf";
    const content = state.fs.readFile(confPath);
    if (content === null) {
      return { stdout: "", stderr: `sysctl: cannot open "${confPath}": No such file or directory\n`, exitCode: 1 };
    }

    const sideEffects: StateChange[] = [];
    const results: string[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      const filePath = "/proc/sys/" + key.replace(/\./g, "/");
      sideEffects.push({ type: "write-file", payload: { path: filePath, content: value } });
      results.push(`${key} = ${value}`);
    }

    return { stdout: results.join("\n") + "\n", stderr: "", exitCode: 0, sideEffects };
  }

  // sysctl -w key=value
  if (args[0] === "-w" && args[1]) {
    const eqIdx = args[1].indexOf("=");
    if (eqIdx < 0) {
      return { stdout: "", stderr: `sysctl: invalid argument: '${args[1]}'\n`, exitCode: 1 };
    }
    const key = args[1].substring(0, eqIdx);
    const value = args[1].substring(eqIdx + 1);
    const filePath = "/proc/sys/" + key.replace(/\./g, "/");
    return {
      stdout: `${key} = ${value}\n`,
      stderr: "",
      exitCode: 0,
      sideEffects: [{ type: "write-file", payload: { path: filePath, content: value } }],
    };
  }

  // sysctl key (read)
  const key = args[0];
  const filePath = "/proc/sys/" + key.replace(/\./g, "/");
  const value = state.fs.readFile(filePath);
  if (value === null) {
    return { stdout: "", stderr: `sysctl: cannot stat /proc/sys/${key.replace(/\./g, "/")}: No such file or directory\n`, exitCode: 1 };
  }
  return { stdout: `${key} = ${value.trim()}\n`, stderr: "", exitCode: 0 };
});
