# Scope: Milestone 1 (M1) - OS Control & Automation

## Architecture
- **Module boundaries**: `tools/` or `automations/` for Python scripts handling automation.
- **Functionality**:
  1. Open local applications on Windows.
  2. Automate browser tasks using Selenium or Playwright.
  3. Execute mock automation workflows for testing.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1.1 | OS App Launching | Implement Python script to launch Windows apps (e.g., via `subprocess` or `os` modules). | none | PLANNED |
| 1.2 | Browser Automation | Implement Python script utilizing Selenium/Playwright for browser control. | none | PLANNED |
| 1.3 | Mock Automation Workflow | Integrate and test a mock workflow leveraging the above scripts. | M1.1, M1.2 | PLANNED |

## Interface Contracts
### `core` ↔ `tools`
- `core` will call Python scripts in `tools/` via spawned processes or REST. The tools should accept clear CLI arguments or REST inputs and output structured JSON.
