export type QuizType = "multiple-choice" | "short-answer" | "code-fill";
export type Difficulty = "초급" | "중급" | "고급";
export type Category = "linux-kernel" | "android-system";

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
  answer?: number;
  explanation: string;
}
