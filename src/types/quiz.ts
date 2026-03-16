export type QuizType = "multiple-choice" | "short-answer" | "code-fill" | "conversation";
export type Difficulty = "초급" | "중급" | "고급";
export type Category = "linux-kernel" | "android-system";
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
  explanation: string;
}
