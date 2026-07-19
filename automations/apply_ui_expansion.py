import os
import re

html_path = "index.html"
css_path = "style.css"
js_path = "src/app.js"

# --- 1. HTML INJECTION ---
new_settings_modal = """
  <!-- CYBER SETTINGS MODAL (TABBED) -->
  <div id="cyberSettingsModal" class="cyber-modal hidden">
    <div class="cyber-modal-overlay"></div>
    <div class="cyber-modal-content">
      <div class="neon-nut nut-tl"></div>
      <div class="neon-nut nut-tr"></div>
      <div class="neon-nut nut-bl"></div>
      <div class="neon-nut nut-br"></div>
      
      <div class="cyber-modal-header">
        <h2>SYSTEM SETTINGS</h2>
        <button class="cyber-close-btn modal-closer">&times;</button>
      </div>

      <div class="cyber-tabs">
        <button class="cyber-tab-btn active" data-target="set-basic">Basic</button>
        <button class="cyber-tab-btn" data-target="set-adv">Advanced Pools</button>
        <button class="cyber-tab-btn" data-target="set-alias">Aliases</button>
      </div>
      
      <div class="cyber-modal-body">
        <!-- BASIC TAB -->
        <div id="set-basic" class="cyber-tab-pane active">
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

        <!-- ADVANCED TAB -->
        <div id="set-adv" class="cyber-tab-pane">
          <div class="setting-group">
            <label>API Fallback Pool</label>
            <input type="text" placeholder="Enter comma-separated models..." value="qwythos-9b, claude-3-haiku, llama3" class="cyber-input" />
          </div>
          <div class="setting-group">
            <label>Latency Threshold (ms)</label>
            <input type="number" value="1500" class="cyber-input" />
          </div>
          <div class="setting-group">
            <label>Selenium DOM Depth</label>
            <input type="range" min="1" max="10" value="5" style="width:100%;" />
          </div>
        </div>

        <!-- ALIAS TAB -->
        <div id="set-alias" class="cyber-tab-pane">
          <div class="setting-group">
            <label>Active Persona Alias</label>
            <select class="cyber-select">
              <option>Default (Luna)</option>
              <option>Developer Mode</option>
              <option>Research Agent</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Trusted Friend IDs</label>
            <textarea class="cyber-textarea" rows="3" placeholder="Enter pubkeys or UUIDs of trusted agents..."></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
"""

help_modal = """
  <!-- CYBER HELP MODAL -->
  <div id="cyberHelpModal" class="cyber-modal hidden">
    <div class="cyber-modal-overlay"></div>
    <div class="cyber-modal-content help-content">
      <div class="neon-nut nut-tl"></div>
      <div class="neon-nut nut-tr"></div>
      <div class="neon-nut nut-bl"></div>
      <div class="neon-nut nut-br"></div>
      
      <div class="cyber-modal-header">
        <h2>LUNA INTELLIGENCE HUB</h2>
        <button class="cyber-close-btn modal-closer">&times;</button>
      </div>

      <div class="cyber-modal-body" style="max-height: 65vh; overflow-y: auto; padding-right: 10px;">
        
        <!-- HERO MANIFESTO -->
        <div class="manifesto-block">
          <h3 class="manifesto-title">THE ARCHITECTURE OF AUTONOMY</h3>
          <p class="manifesto-text">
            Luna OS is not just an interface; it is a fully autonomous intelligence ecosystem. Born out of the necessity for seamless execution, Luna dynamically commands a headless Selenium browser, navigating the vast web with human-like precision to gather, analyze, and execute tasks without manual intervention.
          </p>
          <p class="manifesto-text">
            By implementing an intelligent <strong>API Pooling matrix</strong>, Luna dynamically routes requests to the most capable local or cloud models in real-time, effectively eliminating single points of failure. We drastically reduced execution latency by relying on deep contextual DOM comprehension rather than heavy, sluggish traditional vision models. Luna doesn't just <em>look</em> at the web—she understands it structurally, enabling instant reasoning and flawless automation at lightspeed.
          </p>
        </div>

        <h3 class="faq-section-title">SYSTEM CONFIGURATION & SETUP</h3>
        <div class="faq-accordion">
          <details class="faq-item"><summary>1. How do I configure my primary Ollama endpoint?</summary><div class="faq-ans">Head to Settings > Basic. Ensure your Ollama server is running (default http://localhost:11434). <div class="faq-thought">[THOUGHT: If CORS fails, check Windows env variables for OLLAMA_ORIGINS "*"]</div></div></details>
          <details class="faq-item"><summary>2. What happens if my primary model goes offline?</summary><div class="faq-ans">Luna seamlessly falls back to the secondary models defined in your Advanced API Pools tab without interrupting the chat flow.</div></details>
          <details class="faq-item"><summary>3. How do I manage external API keys for cloud failovers?</summary><div class="faq-ans">External keys are securely stored in your local encrypted vault. They can be injected via the CLI or the Advanced Settings tab.</div></details>
          <details class="faq-item"><summary>4. How do I configure Alias profiles for custom behaviors?</summary><div class="faq-ans">Navigate to the Aliases tab. Aliases inject distinct system prompts and capability constraints dynamically into the context window.</div></details>
          <details class="faq-item"><summary>5. What is the difference between local execution and cloud routing?</summary><div class="faq-ans">Local keeps data completely offline with zero latency penalties. Cloud routing is used exclusively for complex reasoning tasks that exceed local VRAM constraints.</div></details>
          <details class="faq-item"><summary>6. How do I enable Selenium autonomous mode?</summary><div class="faq-ans">Selenium is enabled by default for web-search intents. You can tune its DOM parsing depth in the Advanced tab. <div class="faq-thought">[THOUGHT: Deeper DOM parses increase context size significantly. Tune carefully.]</div></div></details>
          <details class="faq-item"><summary>7. Where are my chat transcripts stored locally?</summary><div class="faq-ans">All transcripts are stored in your OS AppData directory under the Luna/brain/conversations vault.</div></details>
          <details class="faq-item"><summary>8. Can I change the default system prompt?</summary><div class="faq-ans">Yes, the base prompt can be fully overwritten in the Basic Settings tab to shape Luna's core personality.</div></details>
          <details class="faq-item"><summary>9. How do I tune the latency timeout thresholds?</summary><div class="faq-ans">In Advanced Settings, adjust the millisecond threshold. If a model fails to return a token before this limit, the pool automatically fails over.</div></details>
          <details class="faq-item"><summary>10. Does Luna support custom sub-agent integrations?</summary><div class="faq-ans">Yes. Sub-agents can be spawned dynamically during complex problem-solving sequences.</div></details>
        </div>

        <h3 class="faq-section-title" style="margin-top: 30px;">TROUBLESHOOTING & BUGS</h3>
        <div class="faq-accordion">
          <details class="faq-item"><summary>1. Luna says "Connection Failed" or models aren't loading.</summary><div class="faq-ans">This is typically a CORS error or a closed Ollama daemon. Open an Admin prompt, set OLLAMA_ORIGINS "*", and reboot Ollama. <div class="faq-thought">[THOUGHT: Over 80% of local LLM connection issues are CORS related.]</div></div></details>
          <details class="faq-item"><summary>2. The Selenium browser isn't clicking the right elements.</summary><div class="faq-ans">Dynamic SPAs (like React sites) often obscure DOM elements. Luna's fallback heuristic will attempt coordinate-based clicking if DOM hooks fail.</div></details>
          <details class="faq-item"><summary>3. The UI is rendering out of bounds or clipping.</summary><div class="faq-ans">Try resetting your browser zoom to 100%. Luna OS is built on a strict flex-grid architecture that may warp under aggressive zooming.</div></details>
          <details class="faq-item"><summary>4. My custom alias isn't overriding the system prompt.</summary><div class="faq-ans">Ensure the Alias is set to "Active Persona" in the settings, rather than just stored in the trusted friends list.</div></details>
          <details class="faq-item"><summary>5. Why is the response latency suddenly spiking?</summary><div class="faq-ans">Your VRAM might be spilling over into system RAM. Check your Task Manager; if RAM usage is maxed, restart the LLM daemon to clear context caches.</div></details>
          <details class="faq-item"><summary>6. The terminal info block isn't updating my logs.</summary><div class="faq-ans">The terminal block polls at a 1000ms interval. If the main thread is blocked by a heavy JS operation, UI updates will stall temporarily.</div></details>
          <details class="faq-item"><summary>7. Web search returns empty or blocked results.</summary><div class="faq-ans">Some sites heavily throttle automated browsers. Luna attempts to spoof user agents, but aggressive Cloudflare checks might occasionally block her. <div class="faq-thought">[THOUGHT: We intentionally skipped heavy vision models to solve captchas to maintain speed.]</div></div></details>
          <details class="faq-item"><summary>8. How do I fix CORS errors when connecting to Ollama?</summary><div class="faq-ans">Run 'setx OLLAMA_ORIGINS "*"' in an elevated Windows command prompt, then completely kill and restart the Ollama tray app.</div></details>
          <details class="faq-item"><summary>9. The AI Orb animation is stuttering.</summary><div class="faq-ans">The CSS keyframes use hardware acceleration. Ensure hardware acceleration is enabled in your browser settings.</div></details>
          <details class="faq-item"><summary>10. The system resets my theme settings on reboot.</summary><div class="faq-ans">Ensure you have granted LocalStorage write permissions. Luna OS saves configuration states directly to your browser's persistent storage.</div></details>
        </div>

      </div>
    </div>
  </div>
"""

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Remove the old cyberSettingsModal
html = re.sub(r'<!-- CYBER SETTINGS MODAL -->.*?</div>\s*</div>\s*</div>', '', html, flags=re.DOTALL)

# Inject the new ones right before </body>
html = html.replace('</body>', new_settings_modal + "\n" + help_modal + "\n</body>")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)


# --- 2. CSS STYLING ---
css_addons = """
/* Cyber Tabs */
.cyber-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}
.cyber-tab-btn {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--dim);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-family: 'Orbitron', sans-serif;
  cursor: pointer;
  transition: all 0.3s;
}
.cyber-tab-btn.active, .cyber-tab-btn:hover {
  background: rgba(0, 180, 255, 0.15);
  border-color: var(--blue);
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.3);
}
.cyber-tab-pane {
  display: none;
  animation: fadeIn 0.3s ease;
}
.cyber-tab-pane.active {
  display: block;
}

/* Help Modal Specifics */
.help-content {
  max-width: 850px;
  height: 85vh;
  display: flex;
  flex-direction: column;
}
.manifesto-block {
  background: rgba(0, 0, 0, 0.3);
  border-left: 4px solid var(--blue);
  padding: 20px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 30px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}
.manifesto-title {
  font-family: 'Orbitron', sans-serif;
  color: var(--blue);
  letter-spacing: 2px;
  margin-top: 0;
  margin-bottom: 15px;
}
.manifesto-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 12px;
}
.manifesto-text strong {
  color: #fff;
}
.manifesto-text em {
  color: var(--blue);
}

/* FAQs */
.faq-section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
  margin-bottom: 15px;
}
.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.faq-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
}
.faq-item summary {
  padding: 12px 15px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #e0e0e0;
  outline: none;
  transition: background 0.2s;
}
.faq-item summary:hover {
  background: rgba(255, 255, 255, 0.05);
}
.faq-ans {
  padding: 15px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #bbb;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.4);
}
.faq-thought {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(0, 180, 255, 0.05);
  border-left: 2px solid var(--blue);
  font-family: monospace;
  font-size: 0.75rem;
  color: #88ccee;
}
"""

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

if ".cyber-tabs" not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + css_addons)


# --- 3. JAVASCRIPT WIRING ---
js_addons = """
// Expanded Modals Logic
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const settingsRadio = document.getElementById('m-settings');
        const helpRadio = document.getElementById('m-help');
        const settingsModal = document.getElementById('cyberSettingsModal');
        const helpModal = document.getElementById('cyberHelpModal');
        
        // Tab Switching Logic
        const tabBtns = document.querySelectorAll('.cyber-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                // Remove active from all
                document.querySelectorAll('.cyber-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.cyber-tab-pane').forEach(p => p.classList.remove('active'));
                // Add active to current
                e.target.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });

        const setupModalTrigger = (radio, modal) => {
            if(radio && modal) {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        modal.classList.remove('hidden');
                        setTimeout(() => { e.target.checked = false; }, 100);
                    }
                });
                const closers = modal.querySelectorAll('.modal-closer, .cyber-modal-overlay');
                closers.forEach(closer => {
                    closer.addEventListener('click', () => {
                        modal.classList.add('hidden');
                    });
                });
            }
        };

        setupModalTrigger(settingsRadio, settingsModal);
        setupModalTrigger(helpRadio, helpModal);

    }, 2000); // Wait for DOM parsing
});
"""

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Replace old settings logic if it exists
js = re.sub(r'// Cyber Settings Modal Logic.*?\}\);\s*\}\);\s*\}\);', '', js, flags=re.DOTALL)

if "Expanded Modals Logic" not in js:
    with open(js_path, "a", encoding="utf-8") as f:
        f.write("\n" + js_addons)

print("Applied Settings tabs and massive Help modal.")
