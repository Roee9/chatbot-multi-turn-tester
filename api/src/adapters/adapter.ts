export interface ChatAdapter {
  /**
   * Send a turn to the chat model and get a response
   * @param history - Array of conversation messages with role and content
   * @returns Promise that resolves to the model's response string
   */
  sendTurn(history: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
} 