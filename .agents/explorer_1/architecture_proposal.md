# Architecture Proposal for Luna-v2.15.05.26-main

## Overview
The root directory of this project currently contains many loose files, primarily automation/maintenance scripts, core backend files, styles, and state files. To maintain a clean architecture, we propose categorizing these loose files into standard subfolders based on their purpose.

## Proposed Directory Structure
- `/automations/` - Scripts for applying fixes, refactoring, and updates.
- `/core/` - Python modules for core AI and backend functionality.
- `/ui/` (or `/assets/css/`) - Global stylesheets.
- `/data/` - User state and data files.
- `/` (Root) - Configuration, entry points, and documentation.

## File Mapping

### 1. `automations/`
The following scripts should be moved here as they relate to maintenance, refactoring, or automating code changes:
- `add_ghost_btn.py`
- `apply_all_safe.py`
- `apply_bubble_style.py`
- `apply_checklist_css.py`
- `apply_checklist_js.py`
- `apply_custom_loaders.py`
- `apply_dashboard.py`
- `apply_final_tweaks.py`
- `apply_fixes.py`
- `apply_flip_card.py`
- `apply_glass_select.py`
- `apply_hover_fix.py`
- `apply_inbox_search.py`
- `apply_layout_swap.py`
- `apply_loader.py`
- `apply_menu.py`
- `apply_new_ui.py`
- `apply_orb_arrow_fixes.py`
- `apply_react_btn.py`
- `apply_react_btn_only.py`
- `apply_refinements.py`
- `apply_settings_fix.py`
- `apply_settings_modal.py`
- `apply_smart_hover.py`
- `apply_ui_expansion.py`
- `apply_ui_fixes_2.py`
- `clean_ui.py`
- `fix_app_syntax.py`
- `fix_arrow.py`
- `fix_btn_bg.py`
- `fix_prompt.py`
- `fix_remnants2.py`
- `patch_app.py`
- `patch_auto.py`
- `patch_insta.py`
- `patch_loop.py`
- `patch_profile.py`
- `refactor.py`
- `refactor_aliases.py`
- `refactor_app_firebase.py`
- `refactor_modals.py`
- `refactor_readme.py`
- `remove_block.py`
- `remove_firebase.py`
- `update_backup_routing.py`
- `update_css.py`
- `update_css_gray.py`
- `update_css_tweaks.py`
- `update_css_tweaks2.py`
- `update_insta.py`
- `update_insta_macro.py`
- `update_macro_full.py`
- `update_macro_js.py`
- `update_macro_playwright.py`
- `update_macro_profile.py`
- `update_macro_regex.py`
- `update_prompt.py`
- `update_prompt_2.py`
- `update_regex.py`
- `update_router.py`
- `update_save.py`
- `update_toolcode.py`
- `update_toolcode_regex.py`
- `update_ui_and_ollama.py`

### 2. `core/`
Core python components and AI engine:
- `luna_browser.py`
- `luna_message.py`
- `luna_tools.py`
- `personality_engine.py`

### 3. `ui/`
Stylesheet assets:
- `style.css`
- `style_backup.css`

### 4. `data/`
State and contact details:
- `contacts.json`
- `personality_state.json`

### 5. Remain in Root
Configuration, core entry points, and documentation that must remain at the root of the project:
- `.gitignore` (Git configuration)
- `.npmrc` (NPM configuration)
- `boot.bat` (Windows bootstrap script)
- `index.html` (Vite entry point for the web app)
- `LICENSE`
- `main.js` (Electron main process entry point)
- `package-lock.json`
- `package.json`
- `preload.js` (Electron preload script)
- `README.md`
- `sw.js` (Service worker; staying in root prevents scoping issues)
- `vite.config.js` (Vite configuration)
