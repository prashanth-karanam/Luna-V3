# Handoff: API Routing Engine (Milestone 2)

## 1. Observation

- **Current LLM API Execution**: Found in `src/app.js` lines 810-906 (`callAI` function) and lines 909-1013 (`callCloudAPI` function).
  - LLM calls are currently fully monolithic. The UI handles configuration, message history formatting, API key pools, fallback looping, and the network requests via `fetch`.
  - Ollama is called synchronously (no streaming) in `callOllama` (lines 1476-1538).
  - Cloud APIs (Gemini, OpenAI, Groq) are called in `callCloudAPI` via standard REST endpoints with `stream: false`.
  - Configuration state is stored exclusively in the renderer's `localStorage`.
- **Directory Structure & Context Constraints**:
  - `main.js` explicitly disables renderer Node integration (`nodeIntegration: false`, `contextIsolation: true`).
  - Python scripts and automations sit in `core/` and `tools/`.
  - Electron Node.js main process modules sit in `src/main/` (e.g., `CodeRunner.js`, `SystemController.js`). 
  - `SCOPE.md` specifies building `core/llm_router.js` (or similar depending on existing structure) as a Node.js/Python based routing engine.

## 2. Logic Chain

1. **Placement of the Router**: Because the prompt specifies a "Node.js/Python based routing engine" and `src/main/` already contains the Electron main process JS modules, the most logical and native location for the router is `src/main/LLMRouter.js`. It fits the existing architectural pattern better than putting JS in `core/` (which currently exclusively holds Python files).
2. **Configuration Bridging**: Since the renderer holds settings in `localStorage` and `LLMRouter.js` will run in the main process, `app.js` must pass the configuration (API keys, active models) to the main process during the invocation call.
3. **IPC Streaming Design**: To stream tokens back to the UI without blocking, `preload.js` must expose IPC endpoints for initiating the stream and receiving tokens. The main process will use standard Node.js `fetch` to parse SSE (Server-Sent Events) and NDJSON chunk streams.
4. **Fallback Mechanism**: The router should wrap the fetch logic in a unified async generator or promise chain. If `Ollama` fails (e.g., connection refused), it catches the error and immediately fires the Gemini request in `stream: true` mode, emitting a system/debug message to the frontend regarding the switch, and so on.

## 3. Caveats

- **API Compatibility**: The current Gemini implementation in `app.js` uses standard REST JSON. To stream with Gemini via REST, the endpoint must be changed to `streamGenerateContent?alt=sse`.
- **Python Alternative**: While the architecture specifies "Node.js/Python based", routing LLM streams via Python would require creating a local proxy server or complex stdout piping. Doing it in `src/main/LLMRouter.js` via IPC is significantly more robust and aligns with Electron's strengths.
- **Context Handling**: `app.js` currently cleans and truncates history heavily before sending. This preprocessing should either remain in `app.js` (simplest) or be moved entirely to `LLMRouter.js`. Moving it to `LLMRouter.js` requires passing the raw `state.history` via IPC.

## 4. Conclusion & Implementation Plan

The routing engine should be implemented in Node.js within the Electron main process.

**Step 1: Create `src/main/LLMRouter.js`**
- Implement `initLLMRouter(ipcMain, webContents)` which registers an `ipcMain.handle('llm-generate-stream', async (event, data) => {...})`.
- The `data` payload should include: `{ prompt, systemPrompt, history, config: { ollamaModel, openaiKey, geminiKey, groqKey, ... } }`.
- Implement a fallback loop inside the handler:
  1. Try Ollama: `fetch('http://127.0.0.1:11434/api/chat', { ..., stream: true })`. Parse NDJSON chunks.
  2. If error, try Gemini: `fetch('.../streamGenerateContent?alt=sse...', { stream: true })`. Parse SSE chunks.
  3. Try OpenAI/Groq (OpenAI-compatible): `fetch('.../v1/chat/completions', { ..., stream: true })`. Parse SSE chunks.
- As chunks arrive, stream them back: `event.sender.send('llm-token', textChunk)`.
- On completion: `event.sender.send('llm-end')`.
- On total failure: `event.sender.send('llm-error', errorMessage)`.

**Step 2: Update `preload.js`**
- Under `contextBridge.exposeInMainWorld('electronAPI', { ... })`, add:
  ```javascript
  llmGenerateStream: (data) => ipcRenderer.invoke('llm-generate-stream', data),
  onLlmToken: (callback) => ipcRenderer.on('llm-token', (e, text) => callback(text)),
  onLlmEnd: (callback) => ipcRenderer.on('llm-end', () => callback()),
  onLlmError: (callback) => ipcRenderer.on('llm-error', (e, err) => callback(err))
  ```

**Step 3: Update `main.js`**
- Import and initialize the router:
  ```javascript
  const { initLLMRouter } = require('./src/main/LLMRouter');
  // ... inside create window or whenReady
  initLLMRouter(ipcMain);
  ```

**Step 4: Refactor `src/app.js`**
- Replace `callOllama` and `callCloudAPI` with a single unified call:
  ```javascript
  window.electronAPI.llmGenerateStream({
      prompt: userText,
      systemPrompt: sysPrompt,
      history: cleanHistory,
      config: { /* pass keys and preferences from localStorage/cfg */ }
  });
  ```
- Refactor `addBubble` logic to create an empty bubble on submission, and progressively append text to its DOM element whenever `window.electronAPI.onLlmToken` fires. 

## 5. Verification Method

- **Files to Inspect**: `src/main/LLMRouter.js`, `preload.js`, `main.js`, `src/app.js`.
- **Testing Script**: Create a `tests/test_router.js` standalone Node script that mocks `event.sender.send` and calls the `LLMRouter` directly with invalid Ollama endpoints to ensure the fallback cascades to Gemini and returns streamed chunks.
- **E2E UI Test**: Launch the app, turn off the local Ollama server, and submit a query. The UI should instantly stream tokens from the cloud provider without console errors.
