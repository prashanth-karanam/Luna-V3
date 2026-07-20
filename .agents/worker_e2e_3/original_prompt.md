Your task is to resume implementing the E2E test harness and test cases according to the Explorers' strategy. The first worker created the test files under `tests/e2e/tier*`, but failed before setting up `pytest.ini`, `conftest.py` with Playwright fixtures, and installing the required testing dependencies (`pytest`, `playwright`, `pytest-playwright`).

Your tasks:
1. Ensure `pytest` and `playwright` are available (you might need to install them locally or create a virtual environment if not present).
2. Create `tests/pytest.ini`.
3. Create `tests/conftest.py` with mock Playwright fixtures for an Electron app (since the app isn't built yet, the fixtures should mock the startup or use generic playwright web targets so the tests don't error out on collection).
4. Verify the setup by running `pytest tests/e2e --collect-only`. It must collect all 71 tests without errors.
5. Document your work in `C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main\.agents\worker_e2e_3\handoff.md`.
