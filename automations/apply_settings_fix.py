import re

css_path = "style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Update .cyber-modal (z-index fix + gray theme)
css = re.sub(
    r'\.cyber-modal\s*\{[^\}]*\}',
    '.cyber-modal {\n  position: fixed;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 999999 !important;\n  transform: translateZ(1000px);\n}',
    css
)

css = re.sub(
    r'\.cyber-modal-content\s*\{[^\}]*\}',
    '.cyber-modal-content {\n  position: relative;\n  width: 90%;\n  max-width: 500px;\n  background: rgba(30, 35, 45, 0.7);\n  backdrop-filter: blur(25px);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 12px;\n  padding: 30px;\n  box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(255, 255, 255, 0.05);\n  animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n}',
    css
)

# 2. Update Header for Gray Theme
css = re.sub(
    r'\.cyber-modal-header h2\s*\{[^\}]*\}',
    ".cyber-modal-header h2 {\n  margin: 0;\n  font-family: 'Orbitron', sans-serif;\n  font-size: 1.2rem;\n  letter-spacing: 3px;\n  color: #fff;\n  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);\n}",
    css
)

css = re.sub(
    r'\.cyber-modal-header\s*\{[^\}]*\}',
    '.cyber-modal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 25px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  padding-bottom: 15px;\n}',
    css
)

# 3. Update Inputs for Gray Theme
css = re.sub(
    r'\.cyber-input:focus, \.cyber-select:focus, \.cyber-textarea:focus\s*\{[^\}]*\}',
    '.cyber-input:focus, .cyber-select:focus, .cyber-textarea:focus {\n  outline: none;\n  border-color: rgba(255, 255, 255, 0.4);\n  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);\n  background: rgba(255, 255, 255, 0.05);\n}',
    css
)

# 4. Update Neon Nuts (Thick blue and gray neon squared)
css = re.sub(
    r'\.neon-nut\s*\{[^\}]*\}',
    '.neon-nut {\n  position: absolute;\n  width: 18px;\n  height: 18px;\n  background: rgba(100, 110, 120, 0.8);\n  border: 4px solid var(--blue);\n  box-shadow: 0 0 15px var(--blue), inset 0 0 5px rgba(255, 255, 255, 0.5);\n  border-radius: 2px;\n  z-index: 10;\n}',
    css
)

# Reset rotation and adjust position for squares so they align perfectly on corners
css = re.sub(r'\.nut-tl\s*\{[^\}]*\}', '.nut-tl { top: -9px; left: -9px; }', css)
css = re.sub(r'\.nut-tr\s*\{[^\}]*\}', '.nut-tr { top: -9px; right: -9px; }', css)
css = re.sub(r'\.nut-bl\s*\{[^\}]*\}', '.nut-bl { bottom: -9px; left: -9px; }', css)
css = re.sub(r'\.nut-br\s*\{[^\}]*\}', '.nut-br { bottom: -9px; right: -9px; }', css)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Applied Z-index fix, gray theme, and thick blue/gray neon squares.")
