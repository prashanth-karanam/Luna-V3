# M1 Explorer Handoff Report: OS Control & Automation

## Observation
1. The project requires moving OS app launching and browser automation to standalone Python scripts inside the `tools/` folder, which accept CLI/REST inputs and output JSON (`SCOPE.md`).
2. Two scripts, `tools/app_launcher.py` and `tools/web_automation.py`, exist in the codebase and output JSON responses, precisely matching the M1 requirements for standalone tool executables.
3. However, `src/app.js` completely bypasses these tools. When processing the `[OPEN_APP:...]` tag (line 3099) or the `[WEB_GO:...]` tag (line 3091) inside `AI_COMMAND_REGISTRY`, it uses an insecure `executeCode` wrapper to inject raw Python logic (`import luna_tools`, `import luna_browser` from the `core/` folder).
4. Similarly, the "Zero-LLM Fast Path" in `src/app.js` (lines 772-803) uses `window.electronAPI.executeCode` to launch apps via `luna_tools.open_app()` instead of using `app_launcher.py`.
5. The `web_automation.py` script is only used once in `src/app.js` (line 737) strictly for a `status` poll (`runPython('web_automation.py', ['status'])`).
6. There is no `tests/` directory or Mock Automation Workflow script (required by M1.3). `TEST_INFRA.md` dictates opaque-box testing using `pytest` in `tests/e2e/`.

## Logic Chain
1. **Tool Usage**: Because `src/app.js` injects monolithic code from `core/luna_tools.py` and `core/luna_browser.py`, it violates the Milestone 1 Architecture contract. The backend interface must be refactored to use the newly provided standalone `tools/app_launcher.py` and `tools/web_automation.py` CLI tools.
2. **IPC Integration**: We must replace `window.electronAPI.executeCode('python', ...)` with `window.electronAPI.runPython('tool_name.py', [args])` in the `AI_COMMAND_REGISTRY` and Fast Path blocks.
3. **Mock Automation (M1.3)**: To satisfy the mock automation workflow milestone, we must create a test file in the path defined by `TEST_INFRA.md` (`tests/e2e/tier1_feature/test_mock_workflow.py`). This mock test must verify that `app_launcher.py` and `web_automation.py` return valid JSON outputs and simulate an E2E sequence.

## Caveats
- I did not verify if `web_automation.py` Playwright script natively conflicts with the Electron window since they both might try to manage browser sessions. The mock workflow should test it safely.
- The `[WEB_CLICK]`, `[WEB_PRESS]`, and `[WEB_READ]` commands in `src/app.js` must be mapped to `web_automation.py`'s `click`, `type`, and `read` actions respectively. Some commands like `press` might not map 1:1, so we should map to the closest equivalents or just `click` and `type` which `web_automation.py` supports.

## Conclusion
The necessary Python scripts for OS Launching and Browser Automation (M1.1 and M1.2) are fully implemented but orphaned. The immediate fix is to refactor `src/app.js` to dispatch commands to these tools via `window.electronAPI.runPython()`, completely removing the `luna_tools.py` and `luna_browser.py` `executeCode` dependencies. Then, create a `pytest` E2E mock workflow in `tests/e2e/tier1_feature/test_mock_workflow.py` to validate them (M1.3).

### Step-by-Step Implementation Plan
1. **Refactor Fast Path (`src/app.js` lines ~780-795):**
   - Replace the `executeCode` snippet with `await window.electronAPI.runPython('app_launcher.py', [resolved])`.
2. **Refactor `AI_COMMAND_REGISTRY` (`src/app.js` lines ~3090-3135):**
   - Change `[OPEN_APP]` to use `window.electronAPI.runPython('app_launcher.py', [appName])`.
   - Change `[WEB_GO]` to use `window.electronAPI.runPython('web_automation.py', ['goto', url])`.
   - Change `[WEB_CLICK]` to use `window.electronAPI.runPython('web_automation.py', ['click', sel])`.
   - Change `[WEB_PRESS]` to use `window.electronAPI.runPython('web_automation.py', ['type', sel, key])` (adjust arguments to fit the `web_automation.py` parser).
   - Change `[WEB_READ]` in `AI_NO_ARG_REGISTRY` to use `runPython('web_automation.py', ['read'])`.
3. **Scaffold Tests (`tests/e2e/`):**
   - Create directory `tests/e2e/tier1_feature/`.
   - Implement `test_mock_workflow.py` using `pytest`.
   - In the test, use `subprocess.run` to call `python tools/app_launcher.py "notepad"` and `python tools/web_automation.py status`, then parse and assert the `{"ok": true}` outputs.

## Verification Method
1. Run `pytest tests/e2e/tier1_feature/test_mock_workflow.py` — it must pass and output valid JSON assertions.
2. In the app, type "open notepad" — `app.js` logs should show `app_launcher.py` being invoked via `runPython`, completely bypassing `executeCode` and `luna_tools.open_app`.
3. In the app, type a web automation query (e.g. "go to example.com and click the link") — it should call `web_automation.py goto` and not `luna_browser.py`.
