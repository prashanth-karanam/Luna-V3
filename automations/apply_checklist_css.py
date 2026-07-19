import re

css_path = "style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Add CSS if not present
if "checkbox-wrapper" not in css:
    checkbox_css = """

/* --- Neon Dynamic Checkboxes --- */
.checkbox-wrapper {
  --checkbox-size: 25px;
  --checkbox-color: #00ff88;
  --checkbox-shadow: rgba(0, 255, 136, 0.3);
  --checkbox-border: rgba(0, 255, 136, 0.7);
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 10px;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-wrapper .checkmark {
  position: relative;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border: 2px solid var(--checkbox-border);
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 15px var(--checkbox-shadow);
  overflow: hidden;
}

.checkbox-wrapper .checkmark::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--checkbox-color), #00ffcc);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: scale(0) rotate(-45deg);
}

.checkbox-wrapper input:checked ~ .checkmark::before {
  opacity: 1;
  transform: scale(1) rotate(0);
}

.checkbox-wrapper .checkmark svg {
  width: 0;
  height: 0;
  color: #1a1a1a;
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.checkbox-wrapper input:checked ~ .checkmark svg {
  width: 18px;
  height: 18px;
  transform: rotate(360deg);
}

.checkbox-wrapper:hover .checkmark {
  border-color: var(--checkbox-color);
  transform: scale(1.1);
  box-shadow:
    0 0 20px var(--checkbox-shadow),
    0 0 40px var(--checkbox-shadow),
    inset 0 0 10px var(--checkbox-shadow);
}

.checkbox-wrapper input:checked ~ .checkmark {
  animation: pulse 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 20px var(--checkbox-shadow); }
  50% { transform: scale(0.9); box-shadow: 0 0 30px var(--checkbox-shadow), 0 0 50px var(--checkbox-shadow); }
  100% { transform: scale(1); box-shadow: 0 0 20px var(--checkbox-shadow); }
}

.checkbox-wrapper .label {
  margin-left: 15px;
  font-family: "Segoe UI", sans-serif;
  color: var(--checkbox-color);
  font-size: 15px;
  text-shadow: 0 0 10px var(--checkbox-shadow);
  opacity: 0.9;
  transition: all 0.3s;
}

.checkbox-wrapper:hover .label {
  opacity: 1;
  transform: translateX(5px);
}

.checkbox-wrapper::after,
.checkbox-wrapper::before {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--checkbox-color);
  opacity: 0;
  transition: all 0.5s;
}

.checkbox-wrapper::before { left: -10px; top: 50%; }
.checkbox-wrapper::after { right: -10px; top: 50%; }

.checkbox-wrapper:hover::before { opacity: 1; transform: translateX(-10px); box-shadow: 0 0 10px var(--checkbox-color); }
.checkbox-wrapper:hover::after { opacity: 1; transform: translateX(10px); box-shadow: 0 0 10px var(--checkbox-color); }

/* --- 3-Dots Context Menu --- */
.bubble-context-menu {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
}
.bubble-row:hover .bubble-context-menu {
  display: block;
}
.dots-btn {
  background: transparent;
  border: none;
  color: var(--dim);
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
  transition: color 0.2s;
}
.dots-btn:hover {
  color: var(--text);
}
.dots-dropdown {
  position: absolute;
  right: 0;
  top: 25px;
  background: rgba(10, 10, 15, 0.95);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px;
  display: none;
  min-width: 180px;
  z-index: 100;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
}
.dots-dropdown.show {
  display: flex;
  flex-direction: column;
}
.dots-option {
  background: transparent;
  border: none;
  color: var(--text);
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}
.dots-option:hover {
  background: rgba(255, 0, 85, 0.2);
  color: #ff0055;
}

.checklist-container {
  margin-top: 10px;
  margin-bottom: 10px;
  border-left: 2px solid var(--accent);
  padding-left: 10px;
}
"""
    css += checkbox_css
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css)
    print("CSS updated.")
else:
    print("CSS already updated.")
