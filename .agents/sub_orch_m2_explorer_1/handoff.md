# Handoff Report: API Routing Engine (Milestone 2)

## 1. Observation
- In `src/app.js`, the AI generation is currently handled directly in the frontend renderer process.
- `callAI` (line 719) contains hardcoded manual routing logic, directing action/automation commands to Gemini and generic chat to local Ollama.
- `callOllama` (line 1476) makes a local HTTP request using `fetchWithTimeout` to `http://127.0.0.1:11434/api/chat` with `stream: false`.
- `callCloudAPI` (line 909) handles cloud fallback by looping over a pool of API keys and making direct HTTP REST calls to OpenAI, Groq, and Gemini, also entirely without streaming.
- `preload.js` exposes various system IPC commands via `window.electronAPI` (e.g., `executeCode`, `runCommand`), but currently lacks any LLM generation endpoints.
- The `src/main/` directory holds the Node.js backend controllers (`VisionManager.js`, `SystemController.js`, etc.), which are initialized in `main.js`.

## 2. Logic Chain
- **Decoupling**: The current implementation strongly couples the frontend UI (`app.js`) with API routing logic, making it difficult to maintain and lacking proper streaming mechanisms. Moving this to the backend (Node.js/Electron main process) aligns with the `PROJECT.md` architecture.
- **Router Module**: A dedicated `src/main/LLMRouter.js` class should be created to manage provider configuration and fallback logic. This isolates the generation logic.
- **Unified Interface**: The router should provide `async generate(messages, options)` and `async generateStream(messages, options, onTokenCallback)`.
- **Streaming Implementation**:
  - **Ollama**: POST to `/api/chat` with `stream: true`, parsing JSON lines.
  - **OpenAI/Groq**: POST with `stream: true`, parsing Server-Sent Events (SSE).
  - **Gemini**: Use the `streamGenerateContent?alt=sse` endpoint to parse SSE.
- **IPC Bridge**: A new `src/main/LLMController.js` (or similar) should wire the router to `ipcMain`. `preload.js` will expose `electronAPI.llmGenerateStream` and corresponding `onLlmToken`, `onLlmEnd`, `onLlmError` events.
- **UI Integration**: `src/app.js` will be refactored to replace `callOllama` and `callCloudAPI` with `electronAPI.llmGenerateStream`. The UI will append text to the chat bubble upon receiving `llm-token` events.

## 3. Caveats
- I did not investigate the specific UI token-rendering mechanics deeply (e.g., how Markdown is parsed incrementally during streaming). The `app.js` uses a custom `formatText` function (line 1038) which may need adjustment to handle partial Markdown streams gracefully.
- The cloud API key pooling logic inside `callCloudAPI` is complex (it splits keys by newline/comma). The new router should replicate or simplify this.
- If users can change settings (API keys/models) dynamically, the UI must send an IPC message (e.g., `llm-config-update`) to update the router's configuration instantly.

## 4. Conclusion
The API routing engine should be built as a backend Node.js module (`src/main/LLMRouter.js`), exposed to the frontend via Electron IPC.
1. Create `src/main/LLMRouter.js` handling Ollama (primary) -> Gemini -> OpenAI -> Groq fallbacks and streaming via Node `fetch`.
2. Create `src/main/LLMController.js` to manage IPC channels (`llm-config`, `llm-generate-stream`).
3. Update `preload.js` to expose these IPC methods to the renderer.
4. Refactor `src/app.js` to remove direct API calls and implement streaming UI updates via the new `electronAPI` methods.

## 5. Verification Method
- **Test Scripts**: Write a standalone Node.js script (e.g., `tests/test_router.js`) that imports `LLMRouter.js`, configures mock keys, and calls `generateStream()` while forcing failures to verify the fallback chain.
- **UI Testing**: Launch the app, configure a valid API key, submit a prompt, and visually confirm that the response streams token-by-token. Use Developer Tools to block `127.0.0.1` and verify the UI automatically switches to the secondary cloud provider and continues streaming.
