import re

# 1. Fix app.js
js_path = "src/app.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Replace the broken SEND_MESSAGE block
bad_block_regex = r"'SEND_MESSAGE': async \(match, feedback\) => \{.*?(?:const pyCode = `import luna_message.*?feedback\.push\(`\[SYSTEM_MSG\]: \$\{res\.output \|\| res\.error\}`\);\s*\}\s*\},)"
# wait, it's safer to just split by 'SEND_MESSAGE': async (match, feedback) => { ... }
# Let's do a direct replacement of the exact string that is there.
def replace_send_message():
    global js
    start_idx = js.find("'SEND_MESSAGE': async (match, feedback) => {")
    if start_idx == -1: return
    end_idx = js.find("    'WRITE_FILE':", start_idx)
    if end_idx == -1: return
    
    new_block = """'SEND_MESSAGE': async (match, feedback) => {
        if (window.electronAPI) {
            const args = match[1].trim().split('|');
            if (args.length < 3) {
                feedback.push('[SYSTEM_ERROR]: SEND_MESSAGE requires platform|receiver|message');
                return;
            }
            
            // Hardcoded fast execution plan (Zero Latency)
            if (typeof addBubble === 'function') {
                addBubble('luna', '<span style="font-style:italic;color:var(--dim);">Generating execution plan...</span>');
            }
            
            if (typeof window.createChecklist === 'function') {
                window.createChecklist(["Opening Browser", `Opening DMs of ${args[1]}`, "Typing and Sending"]);
            }
            
            const pyCode = `import sys\nimport luna_message\nprint(luna_message.send_message({'platform': '${args[0].trim()}', 'receiver': '${args[1].trim()}', 'message_text': '''${args.slice(2).join('|').trim()}'''}), flush=True)`;
            const res = await window.electronAPI.executeCode('python', pyCode);
            feedback.push(`[SYSTEM_MSG]: ${res.output || res.error}`);
        }
    },
"""
    js = js[:start_idx] + new_block + js[end_idx:]

replace_send_message()

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

# 2. Fix luna_message.py
py_path = "luna_message.py"
with open(py_path, "r", encoding="utf-8") as f:
    py = f.read()

# Replace prints with flush=True
py = py.replace('print("[PROGRESS] Opening Browser")', 'print("[PROGRESS] Opening Browser", flush=True)')
py = re.sub(r'print\(f"\[PROGRESS\] Opening DMs of \{([^}]+)\}"\)', r'print(f"[PROGRESS] Opening DMs of {\1}", flush=True)', py)
py = py.replace('print("[PROGRESS] Typing and Sending")', 'print("[PROGRESS] Typing and Sending", flush=True)')

# Increase sleep time after send_keys(Keys.RETURN)
# There are two places where it sends return
py = py.replace('msg_box.send_keys(Keys.RETURN)\n                time.sleep(1)', 'msg_box.send_keys(Keys.RETURN)\n                time.sleep(4)')

with open(py_path, "w", encoding="utf-8") as f:
    f.write(py)

# 3. Fix CSS default border color
css_path = "style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Change .checkmark border color default from var(--checkbox-border) to a grey/dim border, unless checked.
css = css.replace('border: 2px solid var(--checkbox-border);', 'border: 2px solid var(--border);')
# Keep the hover and checked effects as var(--checkbox-color)
with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixes applied successfully.")
