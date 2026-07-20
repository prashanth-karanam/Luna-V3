# Implementation Plan: API Routing Engine (M2)

## Goal
Implement a robust API fallback and routing engine supporting Ollama, Gemini, OpenAI, and Groq with token-by-token streaming, moving the existing logic out of the UI renderer and into the Node.js main process.

## Consensus Architecture

**1. `src/main/LLMRouter.js` (New File)**
- Create an `LLMRouter` module exposing an asynchronous streaming generator or callback function, e.g., `generateStream(payload, callbacks)`.
- `payload` should contain `{ messages, systemPrompt, config }`, where `config` has API keys, models, and a priority array (e.g., `['ollama', 'gemini', 'openai', 'groq']`).
- **Failover Logic**: Loop through the priority array. Attempt to `fetch` with `stream: true`. If the request fails (e.g., connection refused, timeout) or returns a non-200 status, gracefully catch the error and attempt the next provider in the list.
- **Stream Parsers**:
  - Ollama: Parse NDJSON streams (`/api/chat`).
  - Gemini: Parse Server-Sent Events (SSE) from the `streamGenerateContent?alt=sse` endpoint.
  - OpenAI / Groq: Parse SSE from `/v1/chat/completions`.
- Emit chunks as they arrive.

**2. `main.js`**
- Import `LLMRouter`.
- Set up an IPC handler (e.g., `ipcMain.handle('llm-generate-stream', async (event, payload) => { ... })`).
- Pipe tokens back to the frontend using `event.sender.send('llm-token', chunk)`, `llm-end`, and `llm-error`.

**3. `preload.js`**
- Expose methods on `window.electronAPI`:
  - `startLLMStream(payload)`
  - `onLLMToken(callback)`
  - `onLLMEnd(callback)`
  - `onLLMError(callback)`

**4. `src/app.js`**
- **Clean up**: Remove the monolithic `callOllama` and `callCloudAPI` functions.
- **Refactor `callAI`**: Gather context (`cfg`, system prompt, user messages) and invoke `window.electronAPI.startLLMStream`.
- **UI Updates**: Create the chat bubble immediately upon submission. Progressively append text to this bubble when `onLLMToken` fires, rather than waiting for the entire response.

## Mandatory Tests
- **Automated Verification**: Create `tests/test_router.js` (standalone Node script) to programmatically test the router. It must verify that if Ollama (or the primary provider) fails, the router successfully falls back to the next provider and returns the expected chunks.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
