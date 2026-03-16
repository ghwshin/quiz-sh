import type { FileEntry } from "@/types/quiz";

export interface INode {
  type: "file" | "dir" | "symlink";
  content: string;
  permissions: string;
  target?: string; // symlink target
  children: Map<string, INode>;
}

export class VirtualFS {
  private root: INode;

  constructor(flatFiles: Record<string, FileEntry>) {
    this.root = { type: "dir", content: "", permissions: "755", children: new Map() };
    for (const [path, entry] of Object.entries(flatFiles)) {
      this.initEntry(path, entry);
    }
  }

  private initEntry(filePath: string, entry: FileEntry): void {
    const parts = this.parsePath(filePath);
    // Ensure parent directories exist
    for (let i = 1; i < parts.length; i++) {
      const parentPath = "/" + parts.slice(0, i).join("/");
      const parent = this.getNode(parentPath);
      if (!parent) {
        this.mkdirInternal(parentPath);
      }
    }

    if (entry.type === "dir") {
      this.mkdirInternal(filePath, entry.permissions);
    } else if (entry.type === "file") {
      this.writeFileInternal(filePath, entry.content, entry.permissions || "644");
    } else if (entry.type === "symlink") {
      this.createSymlink(filePath, entry.target);
    }
  }

  private parsePath(p: string): string[] {
    return p.split("/").filter(Boolean);
  }

  resolvePath(path: string, cwd: string): string {
    let parts: string[];
    if (path.startsWith("/")) {
      parts = this.parsePath(path);
    } else {
      parts = [...this.parsePath(cwd), ...this.parsePath(path)];
    }

    const resolved: string[] = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return "/" + resolved.join("/");
  }

  private followSymlinks(path: string, maxDepth = 10): string {
    let current = path;
    for (let i = 0; i < maxDepth; i++) {
      const node = this.getNodeDirect(current);
      if (!node || node.type !== "symlink" || !node.target) return current;
      current = this.resolvePath(node.target, current.substring(0, current.lastIndexOf("/")) || "/");
    }
    return current;
  }

  private getNodeDirect(absPath: string): INode | null {
    if (absPath === "/") return this.root;
    const parts = this.parsePath(absPath);
    let current = this.root;
    for (const part of parts) {
      const child = current.children.get(part);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  private getNode(absPath: string): INode | null {
    const resolved = this.followSymlinks(absPath);
    return this.getNodeDirect(resolved);
  }

  private getParentAndName(absPath: string): { parent: INode; name: string } | null {
    const parts = this.parsePath(absPath);
    if (parts.length === 0) return null;
    const name = parts.pop()!;
    const parentPath = "/" + parts.join("/");
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== "dir") return null;
    return { parent, name };
  }

  private mkdirInternal(absPath: string, permissions = "755"): void {
    const parts = this.parsePath(absPath);
    let current = this.root;
    for (const part of parts) {
      let child = current.children.get(part);
      if (!child) {
        child = { type: "dir", content: "", permissions, children: new Map() };
        current.children.set(part, child);
      }
      current = child;
    }
  }

  private writeFileInternal(absPath: string, content: string, permissions = "644"): void {
    const pn = this.getParentAndName(absPath);
    if (!pn) {
      // Auto-create parents
      const parts = this.parsePath(absPath);
      const parentPath = "/" + parts.slice(0, -1).join("/");
      this.mkdirInternal(parentPath);
      const parent = this.getNode(parentPath)!;
      parent.children.set(parts[parts.length - 1], {
        type: "file", content, permissions, children: new Map(),
      });
      return;
    }
    const existing = pn.parent.children.get(pn.name);
    if (existing && existing.type === "file") {
      existing.content = content;
      return;
    }
    pn.parent.children.set(pn.name, {
      type: "file", content, permissions, children: new Map(),
    });
  }

  private createSymlink(absPath: string, target: string): void {
    const pn = this.getParentAndName(absPath);
    if (!pn) return;
    pn.parent.children.set(pn.name, {
      type: "symlink", content: "", permissions: "777", target, children: new Map(),
    });
  }

  exists(absPath: string): boolean {
    return this.getNode(absPath) !== null;
  }

  stat(absPath: string): { type: "file" | "dir" | "symlink"; permissions: string } | null {
    const node = this.getNode(absPath);
    if (!node) return null;
    return { type: node.type, permissions: node.permissions };
  }

  readFile(absPath: string): string | null {
    const node = this.getNode(absPath);
    if (!node || node.type !== "file") return null;
    return node.content;
  }

  writeFile(absPath: string, content: string): boolean {
    const resolved = this.followSymlinks(absPath);
    const node = this.getNodeDirect(resolved);
    if (node && node.type === "file") {
      node.content = content;
      return true;
    }
    // Create new file
    this.writeFileInternal(resolved, content);
    return true;
  }

  appendFile(absPath: string, content: string): boolean {
    const existing = this.readFile(absPath);
    if (existing === null) {
      return this.writeFile(absPath, content);
    }
    return this.writeFile(absPath, existing + content);
  }

  mkdir(absPath: string): boolean {
    if (this.exists(absPath)) return false;
    this.mkdirInternal(absPath);
    return true;
  }

  mkdirp(absPath: string): boolean {
    this.mkdirInternal(absPath);
    return true;
  }

  rm(absPath: string): boolean {
    const pn = this.getParentAndName(absPath);
    if (!pn) return false;
    if (!pn.parent.children.has(pn.name)) return false;
    pn.parent.children.delete(pn.name);
    return true;
  }

  rmrf(absPath: string): boolean {
    return this.rm(absPath);
  }

  cp(src: string, dst: string): boolean {
    const srcNode = this.getNode(src);
    if (!srcNode || srcNode.type !== "file") return false;
    this.writeFileInternal(dst, srcNode.content, srcNode.permissions);
    return true;
  }

  mv(src: string, dst: string): boolean {
    if (!this.cp(src, dst)) return false;
    return this.rm(src);
  }

  chmod(absPath: string, permissions: string): boolean {
    const resolved = this.followSymlinks(absPath);
    const node = this.getNodeDirect(resolved);
    if (!node) return false;
    node.permissions = permissions;
    return true;
  }

  readdir(absPath: string): string[] | null {
    const node = this.getNode(absPath);
    if (!node || node.type !== "dir") return null;
    return [...node.children.keys()].sort();
  }

  ln(target: string, linkPath: string): boolean {
    this.createSymlink(linkPath, target);
    return true;
  }

  /** Get flat representation for debugging / serialization */
  toFlat(): Record<string, { type: string; content?: string; permissions?: string }> {
    const result: Record<string, { type: string; content?: string; permissions?: string }> = {};
    const walk = (node: INode, path: string) => {
      if (node.type === "file") {
        result[path] = { type: "file", content: node.content, permissions: node.permissions };
      } else if (node.type === "dir") {
        result[path] = { type: "dir", permissions: node.permissions };
        for (const [name, child] of node.children) {
          walk(child, path === "/" ? `/${name}` : `${path}/${name}`);
        }
      } else if (node.type === "symlink") {
        result[path] = { type: "symlink", content: node.target };
      }
    };
    walk(this.root, "/");
    return result;
  }
}
