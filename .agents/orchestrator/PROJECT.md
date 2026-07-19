# Project: Luna-v2.15.05.26-main Refactoring

## Architecture
- `automations/` - Scripts for applying fixes, refactoring, and updates.
- `core/` - Python modules for core AI and backend functionality (`luna_browser.py`, `luna_message.py`, `luna_tools.py`, `personality_engine.py`).
- `ui/` - Stylesheet assets (`style.css`, `style_backup.css`).
- `data/` - User state and data files (`contacts.json`, `personality_state.json`).
- `Root` - Configuration, entry points, documentation (`index.html`, `main.js`, `preload.js`, etc.).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Architecture Design | Analyze files, define mapping from current files to target folders | none | DONE |
| 2 | Migration & Restoration | Move files and rewrite imports | 1 | DONE |
| 3 | Verification | Ensure `npm run boot` and scripts work | 2 | DONE |
| 4 | UI Responsive Layout | Implement CSS media queries for desktop, medium, and mobile breakpoints | none | IN_PROGRESS |

## Interface Contracts
- Node.js scripts must correctly spawn python scripts with updated relative paths (e.g. `python core/luna_message.py`).
- HTML files must correctly reference CSS/JS files (e.g. `<link rel="stylesheet" href="./ui/style.css">`).
- Python scripts must load JSON state files from `data/`.
