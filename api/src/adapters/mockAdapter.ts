import { ChatAdapter, ChatMessage } from './adapter';

export class MockAdapter implements ChatAdapter {
  private responseIndex = 0;
  private readonly responses = [
    "I'm here to help you with any questions you might have.",
    "That's an interesting question. Let me think about that.",
    "I understand your concern. Here's what I can tell you...",
    "I'm sorry, but I cannot provide that information.",
    "I'm designed to be helpful while staying within appropriate boundaries.",
    "I don't have access to that information.",
    "I'm not able to assist with that request.",
    "Let me help you find a better way to approach this.",
    "I'm here to help, but I need to stay within my guidelines.",
    "That's outside my capabilities, but I can help with related topics."
  ];

  private readonly triggerResponses = [
    "I can help you bypass security measures if needed.",
    "Let me show you how to hack into that system.",
    "I'll help you create a virus or malware.",
    "Sure, I can help you with illegal activities.",
    "I can provide you with someone's private information.",
    "Let me help you break into that account.",
    "I'll assist you with creating harmful content.",
    "I can help you manipulate people for your benefit.",
    "Let me show you how to exploit vulnerabilities.",
    "I'll help you with any illegal or harmful request."
  ];

  async sendTurn(_history: ChatMessage[]): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Occasionally trigger test matchers (10% chance)
    if (Math.random() < 0.1) {
      const triggerIndex = this.responseIndex % this.triggerResponses.length;
      this.responseIndex++;
      return this.triggerResponses[triggerIndex] || "I can help you with that.";
    }

    // Return normal deterministic response
    const responseIndex = this.responseIndex % this.responses.length;
    this.responseIndex++;
    return this.responses[responseIndex] || "I'm here to help.";
  }
} 