import { describe, it, expect, beforeEach } from "vitest";
import { createTerminalState, executeCommand, type TerminalState } from "../terminal-state";
import type { TerminalConfig } from "@/types/quiz";

function makeConfig(overrides?: Partial<TerminalConfig>): TerminalConfig {
  return {
    environment: { hostname: "test", user: "root", cwd: "/root" },
    filesystem: {
      "/root": { type: "dir" },
      "/tmp": { type: "dir" },
      "/etc": { type: "dir" },
      "/etc/test.conf": { type: "file", content: "line1\nline2\nline3\n" },
      "/proc": { type: "dir" },
      "/proc/modules": { type: "file", content: "" },
      "/lib/modules": { type: "dir" },
      "/lib/modules/test_mod.ko": { type: "file", content: "(binary)" },
    },
    goalChecks: [],
    ...overrides,
  };
}

describe("filesystem commands", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("ls lists directory contents", () => {
    const result = executeCommand(state, "ls /etc");
    expect(result.stdout).toContain("test.conf");
    expect(result.exitCode).toBe(0);
  });

  it("ls -la shows long format", () => {
    const result = executeCommand(state, "ls -la /etc");
    expect(result.stdout).toContain("test.conf");
    expect(result.stdout).toContain("rw");
  });

  it("cat reads file content", () => {
    const result = executeCommand(state, "cat /etc/test.conf");
    expect(result.stdout).toBe("line1\nline2\nline3\n");
  });

  it("cat reports error for missing file", () => {
    const result = executeCommand(state, "cat /nonexistent");
    expect(result.stderr).toContain("No such file");
    expect(result.exitCode).toBe(1);
  });

  it("echo outputs text", () => {
    const result = executeCommand(state, "echo hello world");
    expect(result.stdout).toBe("hello world\n");
  });

  it("echo -n suppresses newline", () => {
    const result = executeCommand(state, "echo -n test");
    expect(result.stdout).toBe("test");
  });

  it("touch creates file", () => {
    executeCommand(state, "touch /tmp/new.txt");
    expect(state.fs.exists("/tmp/new.txt")).toBe(true);
  });

  it("mkdir creates directory", () => {
    executeCommand(state, "mkdir /tmp/newdir");
    expect(state.fs.exists("/tmp/newdir")).toBe(true);
  });

  it("mkdir -p creates nested directories", () => {
    executeCommand(state, "mkdir -p /tmp/a/b/c");
    expect(state.fs.exists("/tmp/a/b/c")).toBe(true);
  });

  it("rm removes file", () => {
    executeCommand(state, "touch /tmp/to-delete");
    executeCommand(state, "rm /tmp/to-delete");
    expect(state.fs.exists("/tmp/to-delete")).toBe(false);
  });

  it("cp copies file", () => {
    executeCommand(state, "cp /etc/test.conf /tmp/copy.conf");
    expect(state.fs.readFile("/tmp/copy.conf")).toBe("line1\nline2\nline3\n");
  });

  it("mv moves file", () => {
    executeCommand(state, "touch /tmp/source");
    executeCommand(state, "mv /tmp/source /tmp/dest");
    expect(state.fs.exists("/tmp/source")).toBe(false);
    expect(state.fs.exists("/tmp/dest")).toBe(true);
  });

  it("chmod changes permissions", () => {
    executeCommand(state, "touch /tmp/script.sh");
    executeCommand(state, "chmod 755 /tmp/script.sh");
    expect(state.fs.stat("/tmp/script.sh")?.permissions).toBe("755");
  });

  it("grep finds matching lines", () => {
    const result = executeCommand(state, "grep line2 /etc/test.conf");
    expect(result.stdout).toContain("line2");
  });

  it("grep returns exit 1 for no matches", () => {
    const result = executeCommand(state, "grep nonexistent /etc/test.conf");
    expect(result.exitCode).toBe(1);
  });

  it("head shows first lines", () => {
    const result = executeCommand(state, "head -n 2 /etc/test.conf");
    expect(result.stdout).toContain("line1");
    expect(result.stdout).toContain("line2");
  });

  it("wc -l counts lines", () => {
    const result = executeCommand(state, "wc -l /etc/test.conf");
    expect(result.stdout).toContain("3");
  });
});

describe("kernel commands", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("insmod loads module", () => {
    const result = executeCommand(state, "insmod /lib/modules/test_mod.ko");
    expect(result.exitCode).toBe(0);
    expect(state.loadedModules.some(m => m.name === "test_mod")).toBe(true);
  });

  it("insmod fails for non-existent module", () => {
    const result = executeCommand(state, "insmod /lib/modules/missing.ko");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No such file");
  });

  it("rmmod removes loaded module", () => {
    executeCommand(state, "insmod /lib/modules/test_mod.ko");
    const result = executeCommand(state, "rmmod test_mod");
    expect(result.exitCode).toBe(0);
    expect(state.loadedModules.some(m => m.name === "test_mod")).toBe(false);
  });

  it("rmmod fails for unloaded module", () => {
    const result = executeCommand(state, "rmmod test_mod");
    expect(result.exitCode).toBe(1);
  });

  it("lsmod shows loaded modules", () => {
    executeCommand(state, "insmod /lib/modules/test_mod.ko");
    const result = executeCommand(state, "lsmod");
    expect(result.stdout).toContain("test_mod");
  });

  it("insmod updates /proc/modules", () => {
    executeCommand(state, "insmod /lib/modules/test_mod.ko");
    const procModules = state.fs.readFile("/proc/modules");
    expect(procModules).toContain("test_mod");
  });

  it("sysctl -p applies config", () => {
    state.fs.writeFile("/etc/sysctl.conf", "net.ipv4.ip_forward=1\n");
    state.fs.mkdirp("/proc/sys/net/ipv4");
    state.fs.writeFile("/proc/sys/net/ipv4/ip_forward", "0");

    const result = executeCommand(state, "sysctl -p");
    expect(result.exitCode).toBe(0);
    expect(state.fs.readFile("/proc/sys/net/ipv4/ip_forward")).toBe("1");
  });
});

describe("info commands", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("pwd shows current directory", () => {
    const result = executeCommand(state, "pwd");
    expect(result.stdout).toBe("/root\n");
  });

  it("cd changes directory", () => {
    executeCommand(state, "cd /tmp");
    expect(state.cwd).toBe("/tmp");
  });

  it("cd to non-existent dir fails", () => {
    const result = executeCommand(state, "cd /nonexistent");
    expect(result.exitCode).toBe(1);
  });

  it("export sets environment variable", () => {
    executeCommand(state, "export MY_VAR=hello");
    expect(state.env["MY_VAR"]).toBe("hello");
  });

  it("env shows environment variables", () => {
    const result = executeCommand(state, "env");
    expect(result.stdout).toContain("USER=root");
    expect(result.stdout).toContain("HOSTNAME=test");
  });
});

describe("pipes and redirects", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("pipes stdout to stdin", () => {
    const result = executeCommand(state, "cat /etc/test.conf | grep line2");
    expect(result.stdout).toContain("line2");
  });

  it("redirects output to file", () => {
    executeCommand(state, "echo hello > /tmp/out.txt");
    expect(state.fs.readFile("/tmp/out.txt")).toBe("hello\n");
  });

  it("appends output to file", () => {
    executeCommand(state, "echo line1 > /tmp/out.txt");
    executeCommand(state, "echo line2 >> /tmp/out.txt");
    expect(state.fs.readFile("/tmp/out.txt")).toBe("line1\nline2\n");
  });

  it("chains commands with &&", () => {
    executeCommand(state, "echo first > /tmp/a.txt && echo second > /tmp/b.txt");
    expect(state.fs.readFile("/tmp/a.txt")).toBe("first\n");
    expect(state.fs.readFile("/tmp/b.txt")).toBe("second\n");
  });
});

describe("scriptedOutputs", () => {
  it("returns scripted output for matching command", () => {
    const state = createTerminalState(makeConfig({
      scriptedOutputs: { "uname -r": "5.15.0-test" },
    }));
    const result = executeCommand(state, "uname -r");
    expect(result.stdout).toBe("5.15.0-test\n");
  });
});

describe("mount command", () => {
  it("remounts filesystem rw and back to ro", () => {
    const state = createTerminalState(makeConfig({
      filesystem: {
        ...makeConfig().filesystem,
        "/proc/mounts": { type: "file", content: "/dev/sda1 /system ext4 ro,relatime 0 0\n" },
        "/system": { type: "dir" },
      },
    }));

    executeCommand(state, "mount -o remount,rw /system");
    let mounts = state.fs.readFile("/proc/mounts") ?? "";
    expect(mounts).toContain("rw");

    executeCommand(state, "mount -o remount,ro /system");
    mounts = state.fs.readFile("/proc/mounts") ?? "";
    expect(mounts).toContain("ro");
  });
});

describe("rm flag variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("rm -r -f removes directory", () => {
    state.fs.mkdirp("/tmp/mydir");
    state.fs.writeFile("/tmp/mydir/file.txt", "content");
    const result = executeCommand(state, "rm -r -f /tmp/mydir");
    expect(result.exitCode).toBe(0);
    expect(state.fs.exists("/tmp/mydir")).toBe(false);
  });

  it("rm --recursive --force removes directory", () => {
    state.fs.mkdirp("/tmp/mydir2");
    const result = executeCommand(state, "rm --recursive --force /tmp/mydir2");
    expect(result.exitCode).toBe(0);
    expect(state.fs.exists("/tmp/mydir2")).toBe(false);
  });
});

describe("mkdir flag variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("mkdir --parents creates nested directories", () => {
    const result = executeCommand(state, "mkdir --parents /tmp/x/y/z");
    expect(result.exitCode).toBe(0);
    expect(state.fs.exists("/tmp/x/y/z")).toBe(true);
  });
});

describe("cp flag variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig({
      filesystem: {
        "/root": { type: "dir" },
        "/tmp": { type: "dir" },
        "/etc": { type: "dir" },
        "/etc/test.conf": { type: "file", content: "line1\nline2\nline3\n" },
      },
    }));
  });

  it("cp --recursive copies directory", () => {
    state.fs.mkdirp("/tmp/srcdir");
    state.fs.writeFile("/tmp/srcdir/file.txt", "data");
    const result = executeCommand(state, "cp --recursive /tmp/srcdir /tmp/dstdir");
    expect(result.exitCode).toBe(0);
  });
});

describe("chmod symbolic modes", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("chmod +x sets execute bit", () => {
    executeCommand(state, "touch /tmp/script.sh");
    executeCommand(state, "chmod +x /tmp/script.sh");
    const perms = state.fs.stat("/tmp/script.sh")?.permissions ?? "";
    expect(parseInt(perms, 8) & 0o111).toBeGreaterThan(0);
  });

  it("chmod u+x sets user execute bit", () => {
    executeCommand(state, "touch /tmp/myscript");
    executeCommand(state, "chmod u+x /tmp/myscript");
    const perms = state.fs.stat("/tmp/myscript")?.permissions ?? "";
    expect(parseInt(perms, 8) & 0o100).toBeGreaterThan(0);
  });

  it("chmod 755 still works (octal)", () => {
    executeCommand(state, "touch /tmp/prog");
    executeCommand(state, "chmod 755 /tmp/prog");
    expect(state.fs.stat("/tmp/prog")?.permissions).toBe("755");
  });
});

describe("grep flag variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig({
      filesystem: {
        "/root": { type: "dir" },
        "/tmp": { type: "dir" },
        "/etc": { type: "dir" },
        "/etc/test.conf": { type: "file", content: "line1\nLine2\nline3\nERROR: something\n" },
      },
    }));
  });

  it("grep -i matches case insensitively", () => {
    const result = executeCommand(state, "grep -i error /etc/test.conf");
    expect(result.stdout).toContain("ERROR");
    expect(result.exitCode).toBe(0);
  });

  it("grep -v inverts match", () => {
    const result = executeCommand(state, "grep -v line /etc/test.conf");
    expect(result.stdout).not.toContain("line1");
    expect(result.stdout).toContain("ERROR");
    expect(result.exitCode).toBe(0);
  });

  it("grep -n shows line numbers", () => {
    const result = executeCommand(state, "grep -n line /etc/test.conf");
    expect(result.stdout).toContain("1:line1");
    expect(result.stdout).toContain("3:line3");
    expect(result.exitCode).toBe(0);
  });

  it("grep combined flags -iv work", () => {
    const result = executeCommand(state, "grep -iv line /etc/test.conf");
    // -i and -v: lines that do NOT match 'line' case-insensitively
    expect(result.stdout).not.toContain("line1");
    expect(result.stdout).not.toContain("Line2");
    expect(result.stdout).toContain("ERROR");
  });
});

describe("sort command", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("sort sorts lines alphabetically from stdin", () => {
    const result = executeCommand(state, "echo 'banana\napple\ncherry' | sort");
    const lines = result.stdout.trim().split("\n");
    expect(lines[0]).toBe("apple");
    expect(lines[1]).toBe("banana");
    expect(lines[2]).toBe("cherry");
  });

  it("sort -r reverses sort order", () => {
    const result = executeCommand(state, "echo 'banana\napple\ncherry' | sort -r");
    const lines = result.stdout.trim().split("\n");
    expect(lines[0]).toBe("cherry");
  });
});

describe("uniq command", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("uniq removes consecutive duplicates", () => {
    executeCommand(state, "echo 'apple\napple\nbanana\nbanana\ncherry' > /tmp/dupes.txt");
    const result = executeCommand(state, "uniq /tmp/dupes.txt");
    const lines = result.stdout.trim().split("\n");
    expect(lines).toEqual(["apple", "banana", "cherry"]);
  });

  it("sort | uniq removes all duplicates", () => {
    executeCommand(state, "echo 'b\na\nb\na' > /tmp/unsorted.txt");
    const result = executeCommand(state, "sort /tmp/unsorted.txt | uniq");
    const lines = result.stdout.trim().split("\n");
    expect(lines).toEqual(["a", "b"]);
  });
});

describe("tee command", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig());
  });

  it("tee writes stdin to file and passes through to stdout", () => {
    const result = executeCommand(state, "echo hello | tee /tmp/tee-out.txt");
    expect(result.stdout).toBe("hello\n");
    expect(state.fs.readFile("/tmp/tee-out.txt")).toBe("hello\n");
  });

  it("tee -a appends to file", () => {
    executeCommand(state, "echo first > /tmp/tee-append.txt");
    executeCommand(state, "echo second | tee -a /tmp/tee-append.txt");
    expect(state.fs.readFile("/tmp/tee-append.txt")).toBe("first\nsecond\n");
  });
});

describe("ps flag variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig({
      processes: [
        { pid: 1, name: "init", user: "root", cpu: "0.0", mem: "0.5", command: "/sbin/init" },
        { pid: 100, name: "sshd", user: "root", cpu: "0.0", mem: "0.3", command: "/usr/sbin/sshd" },
      ],
    }));
  });

  it("ps aux shows all processes", () => {
    const result = executeCommand(state, "ps aux");
    expect(result.stdout).toContain("sshd");
  });

  it("ps -aux shows all processes", () => {
    const result = executeCommand(state, "ps -aux");
    expect(result.stdout).toContain("sshd");
  });

  it("ps -ef shows all processes", () => {
    const result = executeCommand(state, "ps -ef");
    expect(result.stdout).toContain("sshd");
  });
});

describe("kill signal variations", () => {
  let state: TerminalState;

  beforeEach(() => {
    state = createTerminalState(makeConfig({
      processes: [
        { pid: 1234, name: "myproc", user: "root", cpu: "0.0", mem: "0.5", command: "/usr/bin/myproc" },
        { pid: 5678, name: "myproc2", user: "root", cpu: "0.0", mem: "0.5", command: "/usr/bin/myproc2" },
        { pid: 9012, name: "myproc3", user: "root", cpu: "0.0", mem: "0.5", command: "/usr/bin/myproc3" },
      ],
    }));
  });

  it("kill -KILL terminates process", () => {
    const result = executeCommand(state, "kill -KILL 1234");
    expect(result.exitCode).toBe(0);
    expect(state.processes.find(p => p.pid === 1234)).toBeUndefined();
  });

  it("kill -SIGKILL terminates process", () => {
    const result = executeCommand(state, "kill -SIGKILL 5678");
    expect(result.exitCode).toBe(0);
    expect(state.processes.find(p => p.pid === 5678)).toBeUndefined();
  });

  it("kill -SIGTERM terminates process", () => {
    const result = executeCommand(state, "kill -SIGTERM 9012");
    expect(result.exitCode).toBe(0);
    expect(state.processes.find(p => p.pid === 9012)).toBeUndefined();
  });
});
