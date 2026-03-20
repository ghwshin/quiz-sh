export type QuizType = "multiple-choice" | "short-answer" | "code-fill" | "conversation" | "terminal";
export type Difficulty = "초급" | "중급" | "고급";
export type Category = "linux-kernel" | "android-system" | "operating-system";
export type ScenarioType = "bug-report" | "code-review" | "design-discussion";

export interface ConversationMessage {
  speaker: string;
  role: string;
  avatar: string;
  text?: string;
  code?: string;
  codeLanguage?: string;
}

export type ConversationMode = "objective" | "fill-blank";

export type GoalCheckType =
  | "file-exists"
  | "file-not-exists"
  | "file-contains"
  | "file-permissions"
  | "module-loaded"
  | "module-not-loaded"
  | "process-running"
  | "process-stopped"
  | "env-equals";

export interface GoalCheck {
  description: string;
  type: GoalCheckType;
  path?: string;
  pattern?: string;
  permissions?: string;
  moduleName?: string;
  processName?: string;
  envKey?: string;
  envValue?: string;
}

export type FileEntry =
  | { type: "file"; content: string; permissions?: string }
  | { type: "dir"; permissions?: string }
  | { type: "symlink"; target: string };

export interface ProcessEntry {
  pid: number;
  name: string;
  user: string;
  cpu?: string;
  mem?: string;
  command: string;
}

export interface NetworkState {
  interfaces: {
    name: string;
    ip?: string;
    mask?: string;
    mac?: string;
    state: "UP" | "DOWN";
  }[];
  routes?: {
    destination: string;
    gateway: string;
    interface: string;
  }[];
}

export interface TerminalConfig {
  environment: {
    hostname: string;
    user: string;
    cwd: string;
    env?: Record<string, string>;
  };
  filesystem: Record<string, FileEntry>;
  processes?: ProcessEntry[];
  network?: NetworkState;
  goalChecks: GoalCheck[];
  hints?: string[];
  scriptedOutputs?: Record<string, string>;
}

export interface Quiz {
  id: string;
  category: Category;
  subcategory: string;
  difficulty: Difficulty;
  type: QuizType;
  question: string;
  options?: string[];
  codeTemplate?: string;
  codeLanguage?: string;
  blankAnswers?: string[][];
  blankDistractors?: string[][];
  answer?: number;
  conversation?: ConversationMessage[];
  conversationMode?: ConversationMode;
  seniorHint?: ConversationMessage[];
  scenarioType?: ScenarioType;
  terminalConfig?: TerminalConfig;
  explanation: string;
}
