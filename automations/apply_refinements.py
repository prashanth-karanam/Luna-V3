import re

html_path = "index.html"
js_path = "src/app.js"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Remove the top-nav completely
html = re.sub(
    r'<nav class="top-nav">.*?</nav>',
    '',
    html,
    flags=re.DOTALL
)

# 2. Insert the mini controls into the menu-container
mini_controls_html = """            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
              <input type="checkbox" id="menuToggle" style="display: none;" />
              <label for="menuToggle" class="menu-btn" style="margin-bottom: 0;">
                  <span class="icon">
                      <svg viewBox="0 0 175 80" width="30" height="30">
                          <rect width="80" height="15" fill="var(--blue)" rx="10"></rect>
                          <rect y="30" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                          <rect y="60" width="80" height="15" fill="var(--blue)" rx="10"></rect>
                      </svg>
                  </span>
                  <span class="text">MENU</span>
              </label>
              
              <!-- Mini Controls placed in the gap -->
              <div class="mini-controls" style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                <!-- Network Dot -->
                <div id="networkIndicator" title="Network Status: Online" style="width: 14px; height: 14px; border-radius: 50%; background-color: var(--green); box-shadow: 0 0 10px var(--green); transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2);"></div>
                
                <!-- Model Toggle -->
                <select id="chatEngineToggle" style="background: rgba(0,180,255,0.1); border: 1px solid rgba(0,180,255,0.3); border-radius: 6px; color: var(--blue); padding: 2px 4px; cursor: pointer; font-size: 0.65rem; font-family: 'Orbitron', sans-serif; outline: none; width: 80px;">
                  <option value="qwythos-9b:latest">Qwythos</option>
                  <option value="phi-mini:latest">Phi Mini</option>
                  <option value="mistral:latest">Mistral</option>
                  <option value="llama3:latest">Llama 3</option>
                </select>
              </div>
            </div>"""

html = re.sub(
    r'<input type="checkbox" id="menuToggle" style="display: none;" />\s*<label for="menuToggle" class="menu-btn">\s*<span class="icon">\s*<svg viewBox="0 0 175 80" width="30" height="30">\s*<rect width="80" height="15" fill="var\(--blue\)" rx="10"></rect>\s*<rect y="30" width="80" height="15" fill="var\(--blue\)" rx="10"></rect>\s*<rect y="60" width="80" height="15" fill="var\(--blue\)" rx="10"></rect>\s*</svg>\s*</span>\s*<span class="text">MENU</span>\s*</label>',
    mini_controls_html,
    html
)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Update updateNetworkStatus in app.js
new_network_js = """  function updateNetworkStatus() {
    const net = document.getElementById('networkIndicator');
    if (net) {
      if (navigator.onLine) {
        net.style.backgroundColor = 'var(--green)';
        net.style.boxShadow = '0 0 10px var(--green)';
        net.title = 'Network Status: Online';
      } else {
        net.style.backgroundColor = 'var(--red)';
        net.style.boxShadow = '0 0 10px var(--red)';
        net.title = 'Network Status: Offline';
      }
    }
  }"""

js = re.sub(
    r'function updateNetworkStatus\(\) \{.*?\n  \}',
    new_network_js,
    js,
    flags=re.DOTALL
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Applied UI refinements.")
