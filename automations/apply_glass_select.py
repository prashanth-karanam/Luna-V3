import re

html_path = "index.html"
css_path = "style.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

new_mini_controls = """              <div class="mini-controls" style="display: flex; flex-direction: row; gap: 12px; align-items: center; margin-left: 10px;">
                <!-- Network Dot -->
                <div id="networkIndicator" title="Network Status: Online" style="width: 16px; height: 16px; border-radius: 50%; background-color: var(--green); box-shadow: 0 0 14px 2px var(--green); transition: all 0.3s ease; border: 1.5px solid rgba(255,255,255,0.4);"></div>
                
                <!-- Model Toggle -->
                <select id="chatEngineToggle" class="glass-select">
                  <option value="qwythos-9b:latest">Qwythos</option>
                  <option value="phi-mini:latest">Phi Mini</option>
                  <option value="mistral:latest">Mistral</option>
                  <option value="llama3:latest">Llama 3</option>
                </select>
              </div>"""

html = re.sub(
    r'<div class="mini-controls".*?</select>\s*</div>',
    new_mini_controls,
    html,
    flags=re.DOTALL
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)


with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

glass_select_css = """
/* Glass Select for Model Toggle */
.glass-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(0, 180, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 12px;
  color: var(--blue);
  padding: 6px 20px 6px 32px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300b4ff"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 8a6 6 0 0 1 6 6v4H6v-4a6 6 0 0 1 6-6z"/></svg>'), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300b4ff"><path d="M7 10l5 5 5-5z"/></svg>');
  background-repeat: no-repeat, no-repeat;
  background-position: 8px center, right 6px center;
  background-size: 16px, 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  width: 120px;
}
.glass-select:hover {
  background-color: rgba(0, 180, 255, 0.15);
  box-shadow: 0 4px 15px rgba(0, 180, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2);
  border-color: rgba(0, 180, 255, 0.6);
  transform: translateY(-1px);
}
.glass-select:active {
  transform: translateY(1px);
}
.glass-select option {
  background: rgba(10, 15, 25, 0.95);
  color: var(--blue);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}
"""

with open(css_path, "a", encoding="utf-8") as f:
    f.write(glass_select_css)

print("Applied glass styling.")
