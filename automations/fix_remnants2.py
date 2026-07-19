import re

# 1. Fix app.js
js_path = "src/app.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Fix the "Sending message..." bubble
js = re.sub(
    r"if \(\s*typeof addBubble === 'function'\s*\)\s*\{\s*addBubble\('luna',\s*'[^']*Sending message\.\.\.'\);\s*\}",
    "",
    js
)

# Fix the Terminal Interceptor (read-only error)
bad_interceptor = """// --- Terminal Progress Interceptor ---
setTimeout(() => {
    if (window.electronAPI && window.electronAPI.onCodeOutput) {
        const originalOnCodeOutput = window.electronAPI.onCodeOutput;
        window.electronAPI.onCodeOutput = function(handler) {
            return originalOnCodeOutput((data) => {
                if (data && data.content && data.content.includes('[PROGRESS]')) {
                    const step = data.content.split('[PROGRESS]')[1].trim();
                    if (window.tickChecklist) {
                        const keywords = step.split(' ').filter(w => w.length > 3);
                        if (keywords.length > 0) window.tickChecklist(keywords[0]);
                        else window.tickChecklist(step);
                    }
                }
                return handler(data);
            });
        };
    }
}, 1500);"""

good_interceptor = """// --- Terminal Progress Interceptor ---
setTimeout(() => {
    if (window.electronAPI && window.electronAPI.onCodeOutput) {
        window.electronAPI.onCodeOutput((data) => {
            if (data && data.content && data.content.includes('[PROGRESS]')) {
                const step = data.content.split('[PROGRESS]')[1].trim();
                if (window.tickChecklist) {
                    const keywords = step.split(' ').filter(w => w.length > 3);
                    if (keywords.length > 0) window.tickChecklist(keywords[0]);
                    else window.tickChecklist(step);
                }
            }
        });
    }
}, 1500);"""

js = js.replace(bad_interceptor, good_interceptor)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

# 2. Fix CSS Default Green Glow
css_path = "style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Remove the green box-shadow from the unchecked state
css = css.replace("box-shadow: 0 0 15px var(--checkbox-shadow);", "box-shadow: none; /* Removed default green glow */")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Final fixes applied successfully.")
