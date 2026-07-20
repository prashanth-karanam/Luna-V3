# Handoff Report: API Routing Engine (Milestone 2)

## 1. Observation
- The current LLM API request logic is tightly coupled within the frontend renderer process, specifically inside `src/app.js` (lines 719-1100 and 1476-1538). 
- `src/app.js` contains monolithic functions: `callAI()`, `callCloudAPI()`, and `callOllama()`.
- Requests currently use `fetchWithTimeout()` and explicitly disable streaming (e.g., `stream: false` for Ollama).
- API credentials and preferences are managed via `localStorage` directly in the UI (`cfg` object in `src/app.js`).
- `PROJECT.md` specifies an interface contract for streaming: `ui ↔ core` using IPC events (`token`, `end`, `error`).
- `SCOPE.md` defines the target module as `core/llm_router.js (or similar depending on existing structure)`.
- The existing codebase structure segregates backend JS files into `src/main/` (e.g., `SystemController.js`) and backend Python scripts into `core/` (e.g., `luna_tools.py`).

## 2. Logic Chain
- **Separation of Concerns**: Because the current routing logic resides in the UI renderer, it violates the planned architecture. Moving it to the Node.js main process aligns with the `PROJECT.md` architecture.
- **Location**: Since `core/` currently holds Python files and `src/main/` holds Electron Main process JS files, the router should be placed at `src/main/LLMRouter.js` to respect the existing codebase structure.
- **Streaming Requirements**: To support token-by-token streaming, the `LLMRouter` must use native Node.js `fetch` to read the response body as a stream. It must handle two distinct stream formats:
  - **NDJSON**: Used by Ollama.
  - **Server-Sent Events (SSE)**: Used by Gemini, OpenAI, and Groq (which exposes an OpenAI-compatible API).
- **Configuration Passing**: Since API keys are stored in the frontend's `localStorage`, the frontend must pass a configuration object (containing keys, model selections, and fallback priority) to the backend alongside the prompt messages when initiating a request.
- **Failover Logic**: The router will execute a loop over the provided fallback priority list (e.g., `['ollama', 'gemini', 'openai', 'groq']`). If a provider fails (network error, timeout, or non-200 HTTP status) *before* the stream begins, it catches the error and seamlessly attempts the next provider.

## 3. Caveats
- **Mid-stream Failures**: The proposed failover logic triggers on connection/initialization failure. If a stream breaks midway, failing over is complex as it requires either re-prompting the next provider with the partial response or restarting completely. The initial implementation should focus on connection-level failover.
- **Vision Support**: `app.js` currently intercepts Groq requests to run a separate Gemini vision pass if an image is attached. The router design needs to either support multimodal messages natively or allow the frontend to continue preprocessing vision.
- **Network Mode**: The investigation did not test API keys since they are absent, but the logic structure is clear.

## 4. Conclusion & Implementation Plan
**Recommendation**: Implement a Node.js-based router in the Electron main process and connect it to the UI via IPC.

**Proposed File Structure & Changes**:
1. **`src/main/LLMRouter.js`**: Create a new class exposing `generateStream(messages, config, callbacks)`.
   - `config` shape: `{ keys: { gemini, openai, groq }, models: { ... }, priority: ['ollama', 'gemini', 'openai', 'groq'] }`
   - Implement stream parsers for NDJSON and SSE.
2. **`main.js`**:
   - Instantiate `LLMRouter`.
   - Register an IPC handler: `ipcMain.handle('llm-generate-stream', ...)`
   - Route `router.onToken` events to the UI using `event.sender.send('llm-token', chunk)`.
3. **`preload.js`**:
   - Expose `electronAPI.startLLMStream()` and `electronAPI.onLLMToken()` via `contextBridge`.
4. **`src/app.js`**:
   - Delete `callCloudAPI` and `callOllama`.
   - Refactor `callAI` to invoke `window.electronAPI.startLLMStream()` with the system prompt, user messages, and `localStorage` config.
   - Implement a progressive UI update mechanism to append tokens to the active chat bubble.

## 5. Verification Method
- **Unit Test**: Create a standalone test script (e.g., `tests/test_router.js`) that imports `LLMRouter.js`, mocks the configuration (pointing Ollama to a mock/down port), and verifies that it successfully falls back to the next configured provider and emits tokens.
- **Manual UI Test**: Launch the app, configure an invalid Ollama URL but a valid Gemini key, and observe the UI progressively streaming the response.
