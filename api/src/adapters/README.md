# Chat Adapters

This directory contains adapters for different chat model providers that implement the `ChatAdapter` interface.

## Usage

```typescript
import { createAdapter, ChatMessage } from './adapters';

// Create adapter based on environment variable
const adapter = createAdapter();

// Send a conversation turn
const history: ChatMessage[] = [
  { role: 'user', content: 'Hello, how are you?' }
];

const response = await adapter.sendTurn(history);
console.log(response);
```

## Environment Configuration

Set the `ADAPTER` environment variable to choose which adapter to use:

- `ADAPTER=mock` (default) - Uses the mock adapter for testing
- `ADAPTER=ollama` - Uses the Ollama adapter for local models
- `ADAPTER=openai` - Reserved for future OpenAI integration

## Available Adapters

### MockAdapter
- **Purpose**: Testing and development
- **Features**: 
  - Deterministic responses for consistent testing
  - Occasionally returns trigger responses (10% chance) to test security matchers
  - Simulates network delay
- **Configuration**: None required

### OllamaAdapter
- **Purpose**: Local model inference via Ollama
- **Features**:
  - Connects to local Ollama instance
  - Configurable model, temperature, and timeout
  - Error handling and timeout management
- **Configuration**:
  - Default URL: `http://localhost:11434`
  - Default model: `llama3.1`
  - Default temperature: `0.2`
  - Default timeout: `30000ms`

### OpenAIAdapter (TODO)
- **Purpose**: Cloud-based model inference via OpenAI API
- **Status**: Not yet implemented
- **Configuration**: Will require OpenAI API key

## Interface

All adapters implement the `ChatAdapter` interface:

```typescript
interface ChatAdapter {
  sendTurn(history: ChatMessage[]): Promise<string>;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
```

## Testing

Run the adapter tests:

```bash
npm test -- src/adapters/adapter.test.ts
```

The tests verify:
- Mock adapter's deterministic behavior
- Mock adapter's trigger response functionality
- Ollama adapter construction
- Factory function behavior with different environment variables 