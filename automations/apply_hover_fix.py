import re

css_path = "style.css"
js_path = "src/loaders.js"

# 1. Update style.css to keep flip card open on hover
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

new_trigger = """.menu-container:has(#menuToggle:checked) .flip-card-inner,
.menu-container:has(.menu-btn:hover) .flip-card-inner,
.menu-container:has(.flip-card:hover) .flip-card-inner {"""

css = re.sub(
    r'\.menu-container:has\(#menuToggle:checked\) \.flip-card-inner,\s*\.menu-container:has\(\.menu-btn:hover\) \.flip-card-inner\s*\{',
    new_trigger,
    css
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# 2. Update loaders.js to align the banter loader slightly North-West
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# I will apply translate(-15px, -15px) to pull it up and left
js = js.replace(
    'transform: scale(0.33); transform-origin: center;',
    'transform: scale(0.33) translate(-10px, -10px); transform-origin: center;'
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Applied hover fix and loader alignment.")
