import re
import os

html_path = "index.html"
css_path = "style.css"
js_path = "src/app.js"

# 1. Inject HTML
modal_html = """
  <!-- CYBER SETTINGS MODAL -->
  <div id="cyberSettingsModal" class="cyber-modal hidden">
    <div class="cyber-modal-overlay"></div>
    <div class="cyber-modal-content">
      <!-- Neon Nuts -->
      <div class="neon-nut nut-tl"></div>
      <div class="neon-nut nut-tr"></div>
      <div class="neon-nut nut-bl"></div>
      <div class="neon-nut nut-br"></div>
      
      <div class="cyber-modal-header">
        <h2>SYSTEM SETTINGS</h2>
        <button id="closeSettingsBtn" class="cyber-close-btn">&times;</button>
      </div>
      
      <div class="cyber-modal-body">
        <div class="setting-group">
          <label>Ollama Endpoint URL</label>
          <input type="text" value="http://localhost:11434" class="cyber-input" />
        </div>
        <div class="setting-group">
          <label>Default AI Model</label>
          <select class="cyber-select">
            <option>phi3:mini</option>
            <option>qwythos-9b:latest</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Base System Prompt</label>
          <textarea class="cyber-textarea" rows="4">You are Luna, an advanced AI operating within the Luna OS environment. Be helpful, concise, and futuristic.</textarea>
        </div>
      </div>
    </div>
  </div>
"""

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

if 'id="cyberSettingsModal"' not in html:
    html = html.replace('<div id="modals-container"></div>', '<div id="modals-container"></div>\n' + modal_html)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

# 2. Inject CSS
cyber_css = """
/* CYBER SETTINGS MODAL */
.cyber-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.cyber-modal.hidden {
  display: none;
}
.cyber-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}
.cyber-modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background: rgba(15, 20, 30, 0.65);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(0, 180, 255, 0.05);
  animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Neon Nuts */
.neon-nut {
  position: absolute;
  width: 14px;
  height: 14px;
  background: rgba(10, 15, 20, 0.9);
  border: 2px solid var(--blue);
  box-shadow: 0 0 10px var(--blue), inset 0 0 5px var(--blue);
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  z-index: 10;
}
.nut-tl { top: -7px; left: -7px; transform: rotate(15deg); }
.nut-tr { top: -7px; right: -7px; transform: rotate(-10deg); }
.nut-bl { bottom: -7px; left: -7px; transform: rotate(45deg); }
.nut-br { bottom: -7px; right: -7px; transform: rotate(-25deg); }

/* Modal Internals */
.cyber-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.15);
  padding-bottom: 15px;
}
.cyber-modal-header h2 {
  margin: 0;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 3px;
  color: var(--blue);
  text-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
}
.cyber-close-btn {
  background: transparent;
  border: none;
  color: var(--dim);
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
}
.cyber-close-btn:hover {
  color: #ff4444;
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
}

.setting-group {
  margin-bottom: 20px;
}
.setting-group:last-child {
  margin-bottom: 0;
}
.setting-group label {
  display: block;
  font-size: 0.8rem;
  color: var(--dim);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.cyber-input, .cyber-select, .cyber-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  padding: 10px 14px;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.3s;
}
.cyber-input:focus, .cyber-select:focus, .cyber-textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.2);
  background: rgba(0, 180, 255, 0.05);
}
.cyber-textarea {
  resize: vertical;
}
"""

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

if ".cyber-modal" not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + cyber_css)

# 3. Inject JS
js_logic = """

// Cyber Settings Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const settingsRadio = document.getElementById('m-settings');
        const settingsModal = document.getElementById('cyberSettingsModal');
        
        if (settingsRadio && settingsModal) {
            const closeBtn = document.getElementById('closeSettingsBtn');
            const overlay = settingsModal.querySelector('.cyber-modal-overlay');

            settingsRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    settingsModal.classList.remove('hidden');
                    // Uncheck so the menu can act normally later
                    setTimeout(() => { e.target.checked = false; }, 100);
                }
            });

            const closeModal = () => {
                settingsModal.classList.add('hidden');
            };

            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
        }
    }, 1500); // Wait for DOM parsing
});
"""

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

if "Cyber Settings Modal Logic" not in js:
    with open(js_path, "a", encoding="utf-8") as f:
        f.write(js_logic)

print("Applied cyber settings modal.")
