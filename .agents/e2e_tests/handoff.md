# Handoff Report: E2E Testing Strategy for Luna v3

## 1. Observation
- `TEST_INFRA.md` requires an Opaque-box, requirement-driven testing approach using `pytest` and `playwright`.
- Four testing tiers are defined with strict numerical thresholds:
  - **Tier 1 (Feature)**: ≥5 tests per feature for 6 features (30 total tests).
  - **Tier 2 (Boundary)**: ≥5 tests per feature where boundaries exist (30 total tests).
  - **Tier 3 (Cross/Pairwise)**: ≥6 pairwise interaction tests.
  - **Tier 4 (Workload)**: 5 specific real-world scenarios.
- The 6 core features are: F1 (OS Control), F2 (Web Browser Automation), F3 (Token Streaming), F4 (API Routing & Fallback), F5 (Polished Chat UI), and F6 (Voice Mode Toggle).
- `PROJECT.md` shows an architecture comprising an Electron frontend, Node.js/Python bridge (`core`), AI routing, and Python automation tools. Interface contracts rely heavily on IPC between these modules.
- `ORIGINAL_REQUEST.md` mandates automated testing of a mock browser automation workflow, a primary provider failure triggering fallback, and UI streaming / voice mode toggles without console errors.

## 2. Logic Chain
- **Framework Setup**: Given the requirement for `pytest` and `playwright`, a `pytest.ini` and a `tests/conftest.py` must be initialized at the root to handle setup/teardown and fixtures (e.g., for launching the Electron app headlessly).
- **Directory Enforcement**: To comply with `TEST_INFRA.md` layout, the worker must explicitly build the `tests/e2e/tier1_feature`, `tests/e2e/tier2_boundary`, `tests/e2e/tier3_cross`, and `tests/e2e/tier4_workload` subdirectories.
- **Coverage Allocation**: To reach the 30-test threshold for Tiers 1 and 2 respectively, each tier must have a dedicated test file per feature (e.g., `test_f1_os_control.py`), containing at least 5 test cases.
- **Opaque-Box Mocking**: Because the system interacts with external APIs (LLM providers) and the physical OS (Selenium, PyAutoGUI), direct execution is flaky. The worker must employ a mocking strategy that intercepts IPC calls or local network requests to simulate these side effects (e.g., a mock HTTP server returning 500 to test API fallback).

## 3. Caveats
- Since the implementation is actively ongoing, specific DOM selectors (e.g., `#chat-input`, `.voice-btn`) and IPC channel names are assumptions. The worker agent will have to use standard placeholder selectors which the frontend implementer must later match, or update the tests once the UI stabilizes.
- Launching Electron tests via Playwright (`playwright._electron`) can be tricky in some CI environments; if full Electron mocking is complex, the worker should fall back to serving the web UI (`index.html`) over a local test server and stubbing the `window.electronAPI` bridge.

## 4. Conclusion
The Worker agent should execute the following concrete plan:

### Step 1: Initialize Directory Structure
Create the following folders and configuration:
- `tests/`
  - `pytest.ini` (Configure test discovery and async support).
  - `conftest.py` (Define Playwright/Electron fixtures and mock server setup).
  - `e2e/`
    - `tier1_feature/`
    - `tier2_boundary/`
    - `tier3_cross/`
    - `tier4_workload/`

### Step 2: Create Test Files (Stubbed for initial failure expectations)
Create these Python files, ensuring they collectively define the required number of `test_*` functions (which may initially just `assert False` or contain basic DOM checks):

**Tier 1: Feature Tests (30 tests, 5 per file)**
- `tier1_feature/test_f1_os_control.py` (5 tests simulating app launches)
- `tier1_feature/test_f2_browser_auto.py` (5 tests simulating Selenium tasks)
- `tier1_feature/test_f3_token_stream.py` (5 tests validating DOM token appends)
- `tier1_feature/test_f4_api_routing.py` (5 tests validating provider usage)
- `tier1_feature/test_f5_chat_ui.py` (5 tests validating UI responsiveness)
- `tier1_feature/test_f6_voice_mode.py` (5 tests validating full-screen toggle)

**Tier 2: Boundary Tests (30 tests, 5 per file)**
- Similar structure to Tier 1, but testing timeouts, massive token payloads, invalid app paths, malformed IPC messages, rapid mode toggling, etc.

**Tier 3 & 4**
- `tier3_cross/test_pairwise_interactions.py` (≥6 tests, e.g., streaming + voice mode, automation + fallback).
- `tier4_workload/test_real_scenarios.py` (5 tests exactly matching the scenarios in `TEST_INFRA.md`).

### Step 3: Implement Mocking Strategy
The worker must write the tests to rely on the following mocks (set up in `conftest.py`):
- **API Routing**: Intercept outgoing LLM requests. To test fallback, intercept the primary endpoint and return HTTP 500, then assert that the frontend successfully displays a response (indicating the backend routed to the fallback).
- **Automations (Browser/OS)**: Stub the Python child processes or `core` ↔ `tools` IPC channel to immediately return success without actually launching PyAutoGUI/Selenium.
- **UI Interaction**: Use Playwright's `page.locator()` and `page.evaluate()` to interact with the DOM to verify no console errors are thrown during complex state changes (like Voice Mode toggling).

## 5. Verification Method
1. **Directory Check**: Run `ls -R tests/e2e` to verify the exact tier folders and files exist.
2. **Test Discovery**: Run `pytest tests/e2e --collect-only` and confirm the output states:
   - `collected 71 items` (30 + 30 + 6 + 5).
3. **Execution**: Run `pytest tests/e2e`. It is expected to fail heavily since the project is ongoing, but no syntax or test-collection errors should occur.
