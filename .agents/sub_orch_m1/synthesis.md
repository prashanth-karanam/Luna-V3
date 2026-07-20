# M1 Synthesis & Implementation Strategy

## Aggregated Findings
1. **Existing Implementations**: `tools/app_launcher.py` and `tools/web_automation.py` exist and conform to the new architectural boundaries (standalone scripts outputting JSON).
2. **Current Misuse (Technical Debt)**: `src/app.js` bypasses these scripts. Instead of calling them, it injects monolithic Python code (`import luna_tools`, `import luna_browser`) via an insecure `window.electronAPI.executeCode('python', ...)` handler.
3. **Missing Workflow (M1.3)**: There is no mock automation workflow or E2E test verifying these standalone scripts.

## Resolved Implementation Strategy
1. **Refactor `src/app.js`**:
   - Locate the "Zero-LLM Fast Path" (around line 772-803) and the `AI_COMMAND_REGISTRY` (around line 3090).
   - Replace all `executeCode` calls that import `luna_tools` or `luna_browser` with calls to `window.electronAPI.runPython('tool_name.py', [args])` (using `app_launcher.py` and `web_automation.py`).
2. **Clean up Legacy Code (Optional but recommended)**:
   - If `core/luna_tools.py` and `core/luna_browser.py` are no longer needed, they can be removed or truncated to enforce architectural boundaries.
3. **Create Mock Workflow Test (M1.3)**:
   - Create `tests/e2e/tier1_feature/test_mock_workflow.py`.
   - Use `subprocess.run` to call `python tools/app_launcher.py "notepad"` and `python tools/web_automation.py status`.
   - Assert the outputs are valid JSON and simulate an E2E sequence.
   - Run the tests using `pytest` to verify.

## Next Steps
Dispatch a Worker (`teamwork_preview_worker`) with this strategy to implement the changes and verify them.
