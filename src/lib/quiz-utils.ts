export function checkBlank(input: string, acceptableAnswers: string[]): boolean {
  const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
  return acceptableAnswers.some(
    (ans) => normalized === ans.toLowerCase().replace(/\s+/g, " ").trim()
  );
}
