import re

file_path = "index.html"
with open(file_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Hide context toggles
html = re.sub(
    r'<div id="contextToggles" style="display:flex; gap:15px; font-size: 0\.8rem; color: var\(--dim\);">',
    r'<div id="contextToggles" style="display:none;">',
    html
)

# 2. Hide clutter buttons in navButtonsWrap
buttons_to_hide = [
    'chatEngineToggle', 'consoleBtn', 'storageBtn', 'memoryBtn', 
    'historyBtn', 'browserLaunchBtn', 'wallpaperBtn'
]

for btn_id in buttons_to_hide:
    # Handle select tag for chatEngineToggle
    if btn_id == 'chatEngineToggle':
        html = re.sub(
            f'<select id="{btn_id}"([^>]*)>',
            f'<select id="{btn_id}"\\1 style="display:none;">',
            html
        )
        # Note: In index.html it already has a style attribute, so injecting display:none; into the existing style is better, 
        # but let's just do a blanket replace for the select tag to safely add display:none.
        html = re.sub(
            r'<select id="chatEngineToggle" style="([^"]*)"',
            r'<select id="chatEngineToggle" style="\1; display:none;"',
            html
        )
    else:
        # Hide button tags
        html = re.sub(
            f'<button class="icon-btn" id="{btn_id}"([^>]*)>',
            f'<button class="icon-btn" id="{btn_id}"\\1 style="display:none;">',
            html
        )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(html)
print("UI Cleaned!")
