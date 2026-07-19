# Original User Request

## 2026-07-18T11:24:11Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

**Project Description:** Cleanly sort and refactor the entire `Luna-v2.15.05.26-main` directory into a highly professional, standard architecture. Move hundreds of loose files into organized subfolders so that any senior developer would immediately recognize the logical structure (e.g., separating backend automations, core AI logic, and frontend UI).

Working directory: `C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main`
Integrity mode: development

## Requirements

### R1. Architecture Design
Analyze the current flat directory structure. Design a clean, senior-level folder architecture (e.g., grouping `automations/`, `core/`, `ui/`, `assets/`, `scripts/`).

### R2. File Migration
Move all loose `.py`, `.js`, `.html`, and `.css` files into their new appropriate directories based on your designed architecture.

### R3. Path & Import Restoration
Carefully rewrite all Python `import` statements, Node.js `require()` calls, HTML `<script>`/`<link>` tags, and shell execution paths (`app.js` spawning python) so that the entire system remains 100% interconnected and functional.

## Acceptance Criteria

### Execution & Stability
- [ ] The application successfully boots using `npm run boot` or equivalent startup scripts without crashing due to missing files.
- [ ] Python automations (like `luna_message.py`) execute successfully from within the Node.js backend without throwing `ModuleNotFoundError` or file path errors.
- [ ] The final directory structure at the root level contains primarily folders and critical configuration files (e.g., `package.json`, `.env`), eliminating the clutter of loose source files.

## 2026-07-18T12:20:40Z

# Teamwork Project Prompt — Draft

> Status: Step 2 — Resolving Ambiguity
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Rebuild the Luna Web OS Dashboard UI layout to be fully responsive. The layout must dynamically collapse and hide specific dashboard panels (using CSS media queries) based on the window's width to ensure the chat always remains usable.

Working directory: `C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main`
Integrity mode: development

## Requirements

### R1. Desktop Layout (100% - 80%)
When the window is wide, all dashboard columns should display and stretch proportionally to fill the space without squishing unevenly.

### R2. Medium Layout (~60%)
When the window shrinks, gracefully hide the secondary panels (like Daily News, Orb Animation, Other Work). Keep only the "Menu", "Device Info", and the main Chat interface visible.

### R3. Minimized Layout (Mobile-size)
When the window is heavily minimized, hide all dashboard panels. The entire window should be dedicated exclusively to the main Chat interface.

## Acceptance Criteria

### Execution & Verification
- [ ] Resizing the window to >1000px displays all 3 columns proportionally.
- [ ] Resizing to ~700px hides non-essential panels, leaving Menu, Device Info, and Chat.
- [ ] Resizing to <500px hides all side panels, dedicating 100% of the screen width to the Chat interface.
- [ ] The app boots successfully via `npm run boot` without layout crashes.
