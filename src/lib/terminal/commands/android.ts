import { registerCommand } from "./index";

registerCommand("adb", (args) => {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return {
      stdout: "Usage: adb [options] <command>\nAndroid Debug Bridge.\n\nCommands: devices, shell, root, remount, push, pull\nOptions: -s SERIAL (target device by serial number)\n",
      stderr: "",
      exitCode: 0,
    };
  }

  // Skip global options like -s <serial>, -d, -e before the subcommand
  const remaining: string[] = [];
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === "-s" || a === "-H" || a === "-P") {
      // These flags consume the next arg as a value
      i += 2;
    } else if (a.startsWith("-") && a !== "-d" && a !== "-e") {
      // Unknown single flag, skip it
      i++;
    } else if (a === "-d" || a === "-e") {
      // Transport selector flags with no value
      i++;
    } else {
      remaining.push(...args.slice(i));
      break;
    }
  }

  if (remaining.length === 0) {
    return { stdout: "Usage: adb [options] <command>\nAndroid Debug Bridge.\n\nCommands: devices, shell, root, remount, push, pull\nOptions: -s SERIAL (target device by serial number)\n", stderr: "", exitCode: 0 };
  }

  const subcommand = remaining[0];
  const subArgs = remaining.slice(1);

  if (subcommand === "devices") {
    return {
      stdout: "List of devices attached\nemulator-5554\tdevice\n",
      stderr: "",
      exitCode: 0,
    };
  }

  if (subcommand === "shell") {
    // Join all args after "shell" into a single string for accurate matching
    const shellCmd = subArgs.join(" ");
    if (shellCmd.startsWith("getprop")) {
      // Extract the property name from the joined string
      const parts = shellCmd.split(/\s+/);
      const prop = parts[1];
      const props: Record<string, string> = {
        "ro.build.version.release": "14",
        "ro.build.version.sdk": "34",
        "ro.product.model": "Pixel 8",
        "ro.product.brand": "google",
      };
      const value = prop ? (props[prop] ?? "") : Object.entries(props).map(([k, v]) => `[${k}]: [${v}]`).join("\n");
      return { stdout: value + "\n", stderr: "", exitCode: 0 };
    }
    if (shellCmd.length > 0) {
      return { stdout: "(simulated) shell command not available in this environment\n", stderr: "", exitCode: 0 };
    }
    return { stdout: "", stderr: "", exitCode: 0 };
  }

  if (subcommand === "root") {
    return { stdout: "adbd is already running as root\n", stderr: "", exitCode: 0 };
  }

  if (subcommand === "remount") {
    return { stdout: "remount succeeded\n", stderr: "", exitCode: 0 };
  }

  if (subcommand === "push") {
    if (subArgs.length < 2) {
      return { stdout: "", stderr: "adb: push requires exactly 2 arguments\n", exitCode: 1 };
    }
    return { stdout: `${subArgs[0]}: 1 file pushed.\n`, stderr: "", exitCode: 0 };
  }

  if (subcommand === "pull") {
    if (subArgs.length < 2) {
      return { stdout: "", stderr: "adb: pull requires exactly 2 arguments\n", exitCode: 1 };
    }
    return { stdout: `${subArgs[0]}: 1 file pulled.\n`, stderr: "", exitCode: 0 };
  }

  return { stdout: "", stderr: `adb: unknown command '${subcommand}'\n`, exitCode: 1 };
});

registerCommand("fastboot", (args) => {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return {
      stdout: "Usage: fastboot [options] <command>\nCommunicate with a device in fastboot mode.\n\nCommands: devices, getvar, flash, reboot, oem\nOptions: -s SERIAL (target device)\n",
      stderr: "",
      exitCode: 0,
    };
  }

  const subcommand = args[0];

  if (subcommand === "devices") {
    return { stdout: "emulator-5554\tfastboot\n", stderr: "", exitCode: 0 };
  }

  if (subcommand === "getvar") {
    const varName = args[1] ?? "all";
    if (varName === "all") {
      return {
        stdout: "(bootloader) product: pixel8\n(bootloader) secure: yes\n(bootloader) unlocked: no\n",
        stderr: "",
        exitCode: 0,
      };
    }
    return { stdout: `(bootloader) ${varName}: unknown\n`, stderr: "", exitCode: 0 };
  }

  return { stdout: "", stderr: `fastboot: unknown command '${subcommand}'\n`, exitCode: 1 };
});

registerCommand("logcat", (args) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: logcat [OPTION]... [TAG:PRIORITY]...\nPrint Android log messages.\n\nOptions: -d (dump and exit), -s TAG (filter by tag), -c (clear log)\n", stderr: "", exitCode: 0 };
  }
  // logcat output is typically from scriptedOutputs; provide fallback
  const hasDump = args.includes("-d");
  const hasTag = args.includes("-s");

  if (hasDump || hasTag) {
    return {
      stdout: "--------- beginning of main\n",
      stderr: "",
      exitCode: 0,
    };
  }

  return {
    stdout: "--------- beginning of main\n--------- beginning of system\n",
    stderr: "",
    exitCode: 0,
  };
});

registerCommand("getenforce", (args) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: getenforce\nPrint the current SELinux enforcement mode (Enforcing, Permissive, or Disabled).\n", stderr: "", exitCode: 0 };
  }
  return { stdout: "Enforcing\n", stderr: "", exitCode: 0 };
});

registerCommand("chcon", (args) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { stdout: "Usage: chcon [OPTION]... CONTEXT FILE...\nChange the SELinux security context of FILE(s).\n\nOptions: -R (recursive)\n", stderr: "", exitCode: 0 };
  }
  // chcon is simulated — no actual side effect needed for quiz purposes
  if (args.length < 2) {
    return { stdout: "", stderr: "chcon: missing operand\n", exitCode: 1 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});
