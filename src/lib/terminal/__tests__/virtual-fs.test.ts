import { describe, it, expect } from "vitest";
import { VirtualFS } from "../virtual-fs";

describe("VirtualFS", () => {
  function createFS() {
    return new VirtualFS({
      "/home": { type: "dir" },
      "/home/user": { type: "dir" },
      "/home/user/file.txt": { type: "file", content: "hello world", permissions: "644" },
      "/etc": { type: "dir" },
      "/etc/config": { type: "file", content: "key=value\n" },
      "/tmp": { type: "dir" },
    });
  }

  describe("exists", () => {
    it("returns true for existing files", () => {
      const fs = createFS();
      expect(fs.exists("/home/user/file.txt")).toBe(true);
    });

    it("returns true for existing directories", () => {
      const fs = createFS();
      expect(fs.exists("/home")).toBe(true);
      expect(fs.exists("/home/user")).toBe(true);
    });

    it("returns false for non-existent paths", () => {
      const fs = createFS();
      expect(fs.exists("/nonexistent")).toBe(false);
    });
  });

  describe("readFile", () => {
    it("reads file content", () => {
      const fs = createFS();
      expect(fs.readFile("/home/user/file.txt")).toBe("hello world");
    });

    it("returns null for directories", () => {
      const fs = createFS();
      expect(fs.readFile("/home")).toBeNull();
    });

    it("returns null for non-existent files", () => {
      const fs = createFS();
      expect(fs.readFile("/nonexistent")).toBeNull();
    });
  });

  describe("writeFile", () => {
    it("writes new file", () => {
      const fs = createFS();
      fs.writeFile("/tmp/new.txt", "new content");
      expect(fs.readFile("/tmp/new.txt")).toBe("new content");
    });

    it("overwrites existing file", () => {
      const fs = createFS();
      fs.writeFile("/home/user/file.txt", "updated");
      expect(fs.readFile("/home/user/file.txt")).toBe("updated");
    });

    it("auto-creates parent directories", () => {
      const fs = createFS();
      fs.writeFile("/tmp/deep/nested/file.txt", "deep");
      expect(fs.readFile("/tmp/deep/nested/file.txt")).toBe("deep");
      expect(fs.exists("/tmp/deep")).toBe(true);
      expect(fs.exists("/tmp/deep/nested")).toBe(true);
    });
  });

  describe("appendFile", () => {
    it("appends to existing file", () => {
      const fs = createFS();
      fs.appendFile("/etc/config", "extra=data\n");
      expect(fs.readFile("/etc/config")).toBe("key=value\nextra=data\n");
    });

    it("creates file if not exists", () => {
      const fs = createFS();
      fs.appendFile("/tmp/new.log", "line1\n");
      expect(fs.readFile("/tmp/new.log")).toBe("line1\n");
    });
  });

  describe("mkdir", () => {
    it("creates directory", () => {
      const fs = createFS();
      expect(fs.mkdir("/tmp/newdir")).toBe(true);
      expect(fs.exists("/tmp/newdir")).toBe(true);
    });

    it("returns false if already exists", () => {
      const fs = createFS();
      expect(fs.mkdir("/home")).toBe(false);
    });
  });

  describe("rm", () => {
    it("removes file", () => {
      const fs = createFS();
      expect(fs.rm("/home/user/file.txt")).toBe(true);
      expect(fs.exists("/home/user/file.txt")).toBe(false);
    });

    it("removes directory", () => {
      const fs = createFS();
      expect(fs.rm("/tmp")).toBe(true);
      expect(fs.exists("/tmp")).toBe(false);
    });
  });

  describe("cp and mv", () => {
    it("copies file", () => {
      const fs = createFS();
      expect(fs.cp("/home/user/file.txt", "/tmp/copy.txt")).toBe(true);
      expect(fs.readFile("/tmp/copy.txt")).toBe("hello world");
      expect(fs.readFile("/home/user/file.txt")).toBe("hello world");
    });

    it("moves file", () => {
      const fs = createFS();
      expect(fs.mv("/home/user/file.txt", "/tmp/moved.txt")).toBe(true);
      expect(fs.readFile("/tmp/moved.txt")).toBe("hello world");
      expect(fs.exists("/home/user/file.txt")).toBe(false);
    });
  });

  describe("chmod", () => {
    it("changes file permissions", () => {
      const fs = createFS();
      expect(fs.chmod("/home/user/file.txt", "755")).toBe(true);
      expect(fs.stat("/home/user/file.txt")?.permissions).toBe("755");
    });

    it("returns false for non-existent path", () => {
      const fs = createFS();
      expect(fs.chmod("/nonexistent", "755")).toBe(false);
    });
  });

  describe("readdir", () => {
    it("lists directory contents sorted", () => {
      const fs = createFS();
      const entries = fs.readdir("/home");
      expect(entries).toEqual(["user"]);
    });

    it("returns null for non-directory", () => {
      const fs = createFS();
      expect(fs.readdir("/home/user/file.txt")).toBeNull();
    });
  });

  describe("resolvePath", () => {
    it("resolves absolute path", () => {
      const fs = createFS();
      expect(fs.resolvePath("/home/user", "/tmp")).toBe("/home/user");
    });

    it("resolves relative path", () => {
      const fs = createFS();
      expect(fs.resolvePath("file.txt", "/home/user")).toBe("/home/user/file.txt");
    });

    it("handles .. correctly", () => {
      const fs = createFS();
      expect(fs.resolvePath("../config", "/home/user")).toBe("/home/config");
    });

    it("handles . correctly", () => {
      const fs = createFS();
      expect(fs.resolvePath("./file.txt", "/home/user")).toBe("/home/user/file.txt");
    });
  });

  describe("stat", () => {
    it("returns file stat", () => {
      const fs = createFS();
      const stat = fs.stat("/home/user/file.txt");
      expect(stat).toEqual({ type: "file", permissions: "644" });
    });

    it("returns dir stat", () => {
      const fs = createFS();
      const stat = fs.stat("/home");
      expect(stat?.type).toBe("dir");
    });
  });

  describe("symlink", () => {
    it("creates and follows symlink", () => {
      const fs = new VirtualFS({
        "/etc": { type: "dir" },
        "/etc/real.conf": { type: "file", content: "data" },
        "/etc/link.conf": { type: "symlink", target: "/etc/real.conf" },
      });
      expect(fs.readFile("/etc/link.conf")).toBe("data");
    });
  });
});
