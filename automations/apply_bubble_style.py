import re

css_path = "style.css"
js_path = "src/app.js"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace .avatar.ua
css = re.sub(
    r'\.avatar\.ua \{.*?\}',
    r'.avatar.ua { background: rgba(30, 35, 45, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.3); color: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; }',
    css
)

# Replace .bubble
css = re.sub(
    r'\.bubble \{.*?\}',
    r'.bubble { padding: 14px 18px; line-height: 1.6; font-size: 0.93rem; word-break: break-word; }',
    css
)

# Replace .lb
css = re.sub(
    r'\.lb \{.*?\}',
    r'.lb { background: rgba(30, 35, 45, 0.5); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; border-bottom-left-radius: 4px; color: var(--text); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }',
    css
)

# Replace .ub
css = re.sub(
    r'\.ub \{.*?\}',
    r'.ub { background: rgba(50, 55, 65, 0.4); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; border-bottom-right-radius: 4px; color: #fff; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }',
    css
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Replace the user avatar inner HTML
# The original code has ${!isLuna ? `<div class="avatar ua">👤</div>` : ''}
user_icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
js = re.sub(
    r'<div class="avatar ua">.*?</div>',
    f'<div class="avatar ua">{user_icon_svg}</div>',
    js
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Applied glassmorphic gray styles to chat bubbles and user profile.")
