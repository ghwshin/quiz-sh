import { registerCommand } from "./index";

registerCommand("adb", (args) => {
  if (args.length === 0) {
    return { stdout: "Android Debug Bridge\nUsage: adb [options] command\n", stderr: "", exitCode: 0 };
  }

  const subcommand = args[0];

  if (subcommand === "devices") {
    return {
      stdout: "List of devices attached\nemulator-5554\tdevice\n",
      stderr: "",
      exitCode: 0,
    };
  }

  if (subcommand === "shell") {
    const shellCmd = args.slice(1).join(" ");
    if (shellCmd.startsWith("getprop")) {
      const prop = args[2];
      const props: Record<string, string> = {
        "ro.build.version.release": "14",
        "ro.build.version.sdk": "34",
        "ro.product.model": "Pixel 8",
        "ro.product.brand": "google",
      };
      const value = props[prop] ?? "";
      return { stdout: value + "\n", stderr: "", exitCode: 0 };
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
    return { stdout: `${args[1] ?? "file"}: 1 file pushed.\n`, stderr: "", exitCode: 0 };
  }

  if (subcommand === "pull") {
    return { stdout: `${args[1] ?? "file"}: 1 file pulled.\n`, stderr: "", exitCode: 0 };
  }

  return { stdout: "", stderr: `adb: unknown command '${subcommand}'\n`, exitCode: 1 };
});

registerCommand("fastboot", (args) => {
  if (args.length === 0) {
    return { stdout: "usage: fastboot [OPTION...] COMMAND...\n", stderr: "", exitCode: 0 };
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

registerCommand("getenforce", (_args) => {
  return { stdout: "Enforcing\n", stderr: "", exitCode: 0 };
});

registerCommand("chcon", (args) => {
  // chcon is simulated — no actual side effect needed for quiz purposes
  if (args.length < 2) {
    return { stdout: "", stderr: "chcon: missing operand\n", exitCode: 1 };
  }
  return { stdout: "", stderr: "", exitCode: 0 };
});
