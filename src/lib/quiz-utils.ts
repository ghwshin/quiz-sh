export function checkBlank(input: string, acceptableAnswers: string[]): boolean {
  const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
  return acceptableAnswers.some(
    (ans) => normalized === ans.toLowerCase().replace(/\s+/g, " ").trim()
  );
}

/** Count ___ blanks in conversation messages' text fields */
export function countConversationBlanks(
  conversation: { text?: string }[]
): number {
  let count = 0;
  for (const msg of conversation) {
    if (msg.text) {
      const matches = msg.text.match(/___/g);
      if (matches) count += matches.length;
    }
  }
  return count;
}
