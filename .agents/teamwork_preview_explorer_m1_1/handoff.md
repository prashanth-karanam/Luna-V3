# Observation
- **Scope & Goals**: `SCOPE.md` specifies Milestone 1 (M1) goals: Python scripts in `tools/` or `automations/` for OS App Launching (1.1), Browser Automation via Playwright/Selenium (1.2), and a Mock Automation Workflow (1.3). The interface contract mandates that `core` calls these scripts via spawned processes or REST.
- **Existing Implementations**:
  - `tools/app_launcher.py` (184 lines) already implements robust app launching and window focusing via `winreg`, `psutil`, and `ctypes`.
  - `tools/web_automation.py` (192 lines) already implements browser automation using Playwright over Chrome DevTools Protocol (`http://localhost:9222`).
- **Missing Elements**: There is no script for the Mock Automation Workflow (e.g., `tools/mock_workflow.py`).
- **Duplicate/Legacy Code**: `core/luna_tools.py` contains legacy implementations for `open_app` (using `pyautogui`/`uiautomation`) and `selenium_*` functions. These violate the new architectural boundaries.
- **IPC Integration**: `src/main/PythonTools.js` exposes a generic `run-python` handler but lacks specific, explicit endpoints for `app_launcher.py`, `web_automation.py`, or the mock workflow, making the `core` ↔ `tools` contract less rigid.

# Logic Chain
1. Because `tools/app_launcher.py` and `tools/web_automation.py` are already fully implemented, M1.1 and M1.2 are functionally complete at the script level and do not require rewriting.
2. Because `tools/mock_workflow.py` is absent, M1.3 is incomplete. We must create this script to orchestrate the launcher and web automation scripts to prove E2E capability.
3. Because `core/luna_tools.py` retains redundant automation functions, it creates technical debt and overlap with the new `tools/` modules. This legacy code must be removed.
4. Because the `core` ↔ `tools` interface needs to be clean and explicit, we must add dedicated IPC handlers in `src/main/PythonTools.js` to expose these scripts natively to the routing engine/frontend.

# Caveats
- I did not execute `app_launcher.py` or `web_automation.py` to confirm they work flawlessly in the current environment (due to read-only constraints and lack of a visible desktop session), but statically, they match the spec perfectly.
- The exact UI trigger for the mock workflow isn't specified in `PROJECT.md`; it will likely be invoked programmatically via the backend or a developer console rather than a dedicated UI button.

# Conclusion
M1 requires integration and cleanup rather than from-scratch development of the core tools.

**Recommended Step-by-Step Implementation Plan**:
1. **Create `tools/mock_workflow.py`**:
   - Write a Python script that uses `subprocess` to call `web_automation.py` (e.g., action: `goto`, url: `https://example.com`) followed by `app_launcher.py` (e.g., `notepad`).
2. **Integrate IPC in `src/main/PythonTools.js`**:
   - Add explicit handlers for the tools. For example:
     ```javascript
     ipcMain.handle('launch-app', (e, appName) => runPythonTool(e, 'app_launcher.py', [appName]));
     ipcMain.handle('web-action', (e, action, ...args) => runPythonTool(e, 'web_automation.py', [action, ...args]));
     ipcMain.handle('run-mock-workflow', (e) => runPythonTool(e, 'mock_workflow.py', []));
     ```
3. **Refactor `core/luna_tools.py`**:
   - Remove redundant legacy functions (`open_app`, `selenium_open_url`, `selenium_click`, `selenium_type`, `selenium_close`, `selenium_get_driver`) to strictly enforce the new module boundaries defined in `SCOPE.md`.

# Verification Method
1. Run `python tools/mock_workflow.py` from the command line and verify it successfully launches Chrome, navigates to a test URL, and launches Notepad without errors.
2. Start the application (`node src/main.js` or `npm start`) and trigger the new IPC endpoints from the dev console (e.g. `window.electronAPI.invoke('launch-app', 'calc')`) to confirm the `core` ↔ `tools` bridge is fully operational.
3. Verify that removing legacy functions from `core/luna_tools.py` does not break any existing tests or AI routing flows (by running the project test suite).
